// @ts-check

import * as core from "@actions/core";
import { createAppAuth } from "@octokit/auth-app";

import { getPermissionsFromInputs } from "./lib/get-permissions-from-inputs.js";
import { main } from "./lib/main.js";
import request, { ensureNativeProxySupport } from "./lib/request.js";
import { createKmsAppAuth } from "./lib/kms-auth.js";

if (!process.env.GITHUB_REPOSITORY) {
  throw new Error("GITHUB_REPOSITORY missing, must be set to '<owner>/<repo>'");
}

if (!process.env.GITHUB_REPOSITORY_OWNER) {
  throw new Error("GITHUB_REPOSITORY_OWNER missing, must be set to '<owner>'");
}

async function run() {
  ensureNativeProxySupport();

  const clientId = core.getInput("client-id") || core.getInput("app-id");
  const privateKey = core.getInput("private-key");
  const awsKmsArn = core.getInput("aws-kms-arn");
  const awsProfile = core.getInput("aws-profile");
  const owner = core.getInput("owner");
  const repositories = core
    .getInput("repositories")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((x) => x !== "");
  const installationId = core.getInput("installation-id");

  const skipTokenRevoke = core.getBooleanInput("skip-token-revoke");

  const permissions = getPermissionsFromInputs(process.env);

  if (!clientId) {
    throw new Error(
      "The 'client-id' (or deprecated 'app-id') input must be set to a non-empty string. If using a secret or variable, ensure it is available in this workflow context.",
    );
  }

  if (!privateKey && !awsKmsArn) {
    throw new Error("Either 'private-key' or 'aws-kms-arn' must be provided");
  }

  if (privateKey && awsKmsArn) {
    throw new Error(
      "Only one of 'private-key' or 'aws-kms-arn' should be provided",
    );
  }

  const authFunction = awsKmsArn
    ? createKmsAppAuth({
        appId: clientId,
        kmsKeyArn: awsKmsArn,
        awsProfile: awsProfile || undefined,
        request,
      })
    : createAppAuth({
        appId: clientId,
        privateKey,
        request,
      });

  return main(
    clientId,
    privateKey,
    owner,
    repositories,
    permissions,
    core,
    authFunction,
    request,
    skipTokenRevoke,
    installationId,
  );
}

// Export promise for testing
export default run().catch((error) => {
  /* c8 ignore next 3 */
  console.error(error);
  core.setFailed(error.message);
});
