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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecrets = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Get Secrets from the current environment using patterns to match keys.
 * @param patterns
 * @param env
 */
function getSecrets(patterns, env = process.env) {
    const regexPatterns = patterns.map((s) => new RegExp(s));
    const keys = Object.keys(env);
    core.info(`Available env keys: ${JSON.stringify(keys)}`);
    return keys
        .filter((k) => {
        return env[k] && regexPatterns.filter((r) => r.test(k)).length;
    })
        .reduce((o, k) => {
        // tell Github to mask this from logs
        if (!k.match(/GITHUB_.*/)) {
            core.setSecret(env[k]);
        }
        o[k] = env[k];
        return o;
    }, {});
}
exports.getSecrets = getSecrets;
