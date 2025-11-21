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

// Test KMS authentication with owner set and repositories unset
await test(
  (mockPool) => {
    const baseUrl = new URL(process.env["INPUT_GITHUB-API-URL"]);
    const basePath = baseUrl.pathname === "/" ? "" : baseUrl.pathname;

    // Mock the /users/{username}/installation endpoint
    mockPool
      .intercept({
        path: `${basePath}/users/monalisa/installation`,
        method: "GET",
        headers: {
          accept: "application/vnd.github.v3+json",
          "user-agent": "actions/create-github-app-token",
        },
      })
      .reply(
        200,
        { id: "123456", app_slug: "github-actions" },
        { headers: { "content-type": "application/json" } }
      );
  },
  {
    ...DEFAULT_ENV,
    "INPUT_PRIVATE-KEY": "",
    "INPUT_AWS-KMS-ARN": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    INPUT_OWNER: "monalisa",
  }
);

console.log("✓ KMS owner set, repositories unset test passed");
