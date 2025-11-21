import { test } from "./main.js";
import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

// Create a mock KMS client
const kmsMock = mockClient(KMSClient);

// Mock a valid RSA signature (base64 encoded)
// This is a dummy signature that looks like a valid RSA signature
const mockSignature = Buffer.from(
  "0".repeat(256), // RSA-2048 signature is 256 bytes
  "utf-8"
);

// Set up KMS mock to return a signature
kmsMock.on(SignCommand).resolves({
  Signature: mockSignature,
});

// Test basic KMS authentication flow
await test(() => {
  // Remove private key and add KMS ARN
  delete process.env["INPUT_PRIVATE-KEY"];
  process.env["INPUT_AWS-KMS-ARN"] = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012";
});

console.log("✓ KMS basic authentication test passed");
