"use strict";
/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSecretForRepo = exports.setSecretForRepo = exports.getPublicKey = exports.filterReposByPatterns = exports.listAllReposForAuthenticatedUser = exports.listAllMatchingRepos = exports.getRepos = exports.DefaultOctokit = exports.publicKeyCache = void 0;
const core = __importStar(require("@actions/core"));
const rest_1 = require("@octokit/rest");
const utils_1 = require("./utils");
const config_1 = require("./config");
const plugin_retry_1 = require("@octokit/plugin-retry");
exports.publicKeyCache = new Map();
const RetryOctokit = rest_1.Octokit.plugin(plugin_retry_1.retry);
function DefaultOctokit(_a) {
    var octokitOptions = __rest(_a, []);
    const retries = (0, config_1.getConfig)().RETRIES;
    /* istanbul ignore next */
    function onRateLimit(retryAfter, options) {
        core.warning(`Request quota exhausted for request ${options.method} ${options.url}`);
        if (options.request.retryCount < retries) {
            core.warning(`Retrying request ${options.method} ${options.url} after ${retryAfter} seconds!`);
            return true;
        }
        core.warning(`Did not retry request ${options.method} ${options.url}`);
        return false;
    }
    /* istanbul ignore next */
    function onAbuseLimit(retryAfter, options) {
        core.warning(`Abuse detected for request ${options.method} ${options.url}`);
        if (options.request.retryCount < retries) {
            core.warning(`Retrying request ${options.method} ${options.url} after ${retryAfter} seconds!`);
            return true;
        }
        core.warning(`Did not retry request ${options.method} ${options.url}`);
        return false;
    }
    const defaultOptions = {
        throttle: {
            onRateLimit,
            onAbuseLimit,
        },
    };
    return new RetryOctokit(Object.assign(Object.assign({}, defaultOptions), octokitOptions));
}
exports.DefaultOctokit = DefaultOctokit;
function getRepos({ patterns, octokit, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const repos = [];
        for (const pattern of patterns) {
            const [repo_owner, repo_name] = pattern.split("/");
            const response = yield octokit.repos.get({
                owner: repo_owner,
                repo: repo_name,
            });
            repos.push(response.data);
        }
        return repos.filter((r) => !r.archived);
    });
}
exports.getRepos = getRepos;
function listAllMatchingRepos({ patterns, octokit, affiliation = "owner,collaborator,organization_member", pageSize = 30, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const repos = yield listAllReposForAuthenticatedUser({
            octokit,
            affiliation,
            pageSize,
        });
        core.info(`Available repositories: ${JSON.stringify(repos.map((r) => r.full_name))}`);
        return filterReposByPatterns(repos, patterns);
    });
}
exports.listAllMatchingRepos = listAllMatchingRepos;
function listAllReposForAuthenticatedUser({ octokit, affiliation, pageSize, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const repos = [];
        for (let page = 1;; page++) {
            const response = yield octokit.repos.listForAuthenticatedUser({
                affiliation,
                page,
                pageSize,
            });
            repos.push(...response.data);
            if (response.data.length < pageSize) {
                break;
            }
        }
        return repos.filter((r) => !r.archived);
    });
}
exports.listAllReposForAuthenticatedUser = listAllReposForAuthenticatedUser;
function filterReposByPatterns(repos, patterns) {
    const regexPatterns = patterns.map((s) => new RegExp(s));
    return repos.filter((repo) => regexPatterns.filter((r) => r.test(repo.full_name)).length);
}
exports.filterReposByPatterns = filterReposByPatterns;
function getPublicKey(octokit, repo, environment, target) {
    return __awaiter(this, void 0, void 0, function* () {
        let publicKey = exports.publicKeyCache.get(repo);
        if (!publicKey) {
            if (environment) {
                publicKey = (yield octokit.actions.getEnvironmentPublicKey({
                    repository_id: repo.id,
                    environment_name: environment,
                })).data;
                exports.publicKeyCache.set(repo, publicKey);
                return publicKey;
            }
            else {
                const [owner, name] = repo.full_name.split("/");
                switch (target) {
                    case "codespaces":
                        publicKey = (yield octokit.codespaces.getRepoPublicKey({
                            owner,
                            repo: name,
                        })).data;
                        exports.publicKeyCache.set(repo, publicKey);
                        return publicKey;
                    case "dependabot":
                        publicKey = (yield octokit.dependabot.getRepoPublicKey({
                            owner,
                            repo: name,
                        })).data;
                        exports.publicKeyCache.set(repo, publicKey);
                        return publicKey;
                    case "actions":
                    default:
                        publicKey = (yield octokit.actions.getRepoPublicKey({
                            owner,
                            repo: name,
                        })).data;
                        exports.publicKeyCache.set(repo, publicKey);
                        return publicKey;
                }
            }
        }
        return publicKey;
    });
}
exports.getPublicKey = getPublicKey;
function setSecretForRepo(octokit, name, secret, repo, environment, new_secret_prefix, dry_run, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const [repo_owner, repo_name] = repo.full_name.split("/");
        const publicKey = yield getPublicKey(octokit, repo, environment, target);
        const encrypted_value = (0, utils_1.encrypt)(secret, publicKey.key);
        const final_name = new_secret_prefix ? new_secret_prefix + name : name;
        core.info(`Set \`${final_name} = ***\` on ${repo.full_name}`);
        if (!dry_run) {
            switch (target) {
                case "codespaces":
                    return octokit.codespaces.createOrUpdateRepoSecret({
                        owner: repo_owner,
                        repo: repo_name,
                        secret_name: final_name,
                        key_id: publicKey.key_id,
                        encrypted_value,
                    });
                case "dependabot":
                    return octokit.dependabot.createOrUpdateRepoSecret({
                        owner: repo_owner,
                        repo: repo_name,
                        secret_name: final_name,
                        key_id: publicKey.key_id,
                        encrypted_value,
                    });
                case "actions":
                default:
                    if (environment) {
                        return octokit.actions.createOrUpdateEnvironmentSecret({
                            repository_id: repo.id,
                            environment_name: environment,
                            secret_name: final_name,
                            key_id: publicKey.key_id,
                            encrypted_value,
                        });
                    }
                    else {
                        return octokit.actions.createOrUpdateRepoSecret({
                            owner: repo_owner,
                            repo: repo_name,
                            secret_name: final_name,
                            key_id: publicKey.key_id,
                            encrypted_value,
                        });
                    }
            }
        }
    });
}
exports.setSecretForRepo = setSecretForRepo;
function deleteSecretForRepo(octokit, name, secret, repo, environment, new_secret_prefix, dry_run, target) {
    return __awaiter(this, void 0, void 0, function* () {
        const final_name = new_secret_prefix ? new_secret_prefix + name : name;
        core.info(`Remove ${final_name} from ${repo.full_name}`);
        try {
            if (!dry_run) {
                const action = "DELETE";
                switch (target) {
                    case "codespaces":
                        return octokit.request(`${action} /repos/${repo.full_name}/codespaces/secrets/${final_name}`);
                    case "dependabot":
                        return octokit.request(`${action} /repos/${repo.full_name}/dependabot/secrets/${final_name}`);
                    case "actions":
                    default:
                        if (environment) {
                            return octokit.request(`${action} /repositories/${repo.id}/environments/${environment}/secrets/${final_name}`);
                        }
                        else {
                            return octokit.request(`${action} /repos/${repo.full_name}/actions/secrets/${final_name}`);
                        }
                }
            }
        }
        catch (HttpError) {
            //If secret is not found in target repo, silently continue
        }
    });
}
exports.deleteSecretForRepo = deleteSecretForRepo;
