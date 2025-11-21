import { test } from "./main.js";
import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

// Create a mock KMS client
const kmsMock = mockClient(KMSClient);

// Mock a valid RSA signature (base64 encoded)
const mockSignature = Buffer.from(
  "0".repeat(256), // RSA-2048 signature is 256 bytes
  "utf-8"
);

// Set up KMS mock to return a signature
kmsMock.on(SignCommand).resolves({
  Signature: mockSignature,
});

// Test KMS authentication with AWS profile
await test(() => {
  // Remove private key and add KMS ARN with profile
  delete process.env["INPUT_PRIVATE-KEY"];
  process.env["INPUT_AWS-KMS-ARN"] = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012";
  process.env["INPUT_AWS-PROFILE"] = "my-aws-profile";
});

console.log("✓ KMS with AWS profile test passed");
