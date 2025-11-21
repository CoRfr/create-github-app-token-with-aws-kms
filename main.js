// @ts-check

import core from "@actions/core";
import { createAppAuth } from "@octokit/auth-app";

import { getPermissionsFromInputs } from "./lib/get-permissions-from-inputs.js";
import { main } from "./lib/main.js";
import request from "./lib/request.js";
import { createKmsAppAuth } from "./lib/kms-auth.js";

if (!process.env.GITHUB_REPOSITORY) {
  throw new Error("GITHUB_REPOSITORY missing, must be set to '<owner>/<repo>'");
}

if (!process.env.GITHUB_REPOSITORY_OWNER) {
  throw new Error("GITHUB_REPOSITORY_OWNER missing, must be set to '<owner>'");
}

const appId = core.getInput("app-id");
const privateKey = core.getInput("private-key");
const awsKmsArn = core.getInput("aws-kms-arn");
const awsProfile = core.getInput("aws-profile");
const owner = core.getInput("owner");
const repositories = core
  .getInput("repositories")
  .split(/[\n,]+/)
  .map((s) => s.trim())
  .filter((x) => x !== "");

const skipTokenRevoke = core.getBooleanInput("skip-token-revoke");

const permissions = getPermissionsFromInputs(process.env);

// Validate that either private-key or aws-kms-arn is provided
if (!privateKey && !awsKmsArn) {
  throw new Error("Either 'private-key' or 'aws-kms-arn' must be provided");
}

if (privateKey && awsKmsArn) {
  throw new Error("Only one of 'private-key' or 'aws-kms-arn' should be provided");
}

// Create the appropriate auth function
let authFunction;
if (awsKmsArn) {
  authFunction = createKmsAppAuth({
    appId,
    kmsKeyArn: awsKmsArn,
    awsProfile: awsProfile || undefined,
    request,
  });
} else {
  authFunction = createAppAuth({
    appId,
    privateKey,
    request,
  });
}

// Export promise for testing
export default main(
  appId,
  privateKey,
  owner,
  repositories,
  permissions,
  core,
  authFunction,
  request,
  skipTokenRevoke,
).catch((error) => {
  /* c8 ignore next 3 */
  console.error(error);
  core.setFailed(error.message);
});
