import { run } from "./main";
import * as core from "@actions/core";
import axios, { isAxiosError } from "axios";

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      core.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io"
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
  }
}

validateSubscription();

/* istanbul ignore next */
run();
