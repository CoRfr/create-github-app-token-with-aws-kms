import { DEFAULT_ENV, test } from "./main.js";
import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

// Create a mock KMS client
const kmsMock = mockClient(KMSClient);

// Mock a valid RSA signature
const mockSignature = Buffer.from(
  "0".repeat(256),
  "utf-8"
);

// Set up KMS mock to return a signature
kmsMock.on(SignCommand).resolves({
  Signature: mockSignature,
});

// Test KMS authentication with specific permissions
await test(
  (mockPool) => {
    const baseUrl = new URL(process.env["INPUT_GITHUB-API-URL"]);
    const basePath = baseUrl.pathname === "/" ? "" : baseUrl.pathname;

    // Override the default mock to check for permissions in the request body
    mockPool
      .intercept({
        path: `${basePath}/app/installations/123456/access_tokens`,
        method: "POST",
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": "actions/create-github-app-token",
        },
      })
      .reply(
        201,
        {
          token: "ghs_16C7e42F292c6912E7710c838347Ae178B4a",
          expires_at: "2016-07-11T22:14:10Z",
          permissions: {
            issues: "write",
            contents: "read",
          },
        },
        { headers: { "content-type": "application/json" } }
      );
  },
  {
    ...DEFAULT_ENV,
    "INPUT_PRIVATE-KEY": "",
    "INPUT_AWS-KMS-ARN": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    "INPUT_PERMISSION-ISSUES": "write",
    "INPUT_PERMISSION-CONTENTS": "read",
  }
);

console.log("✓ KMS with permissions test passed");
