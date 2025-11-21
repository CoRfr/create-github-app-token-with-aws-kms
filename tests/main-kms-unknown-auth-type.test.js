import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createKmsAppAuth } from "../lib/kms-auth.js";
import request from "../lib/request.js";

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

// Test that an error is thrown for unknown authentication type
let errorThrown = false;
let errorMessage = "";

try {
  // Create KMS auth function
  const auth = createKmsAppAuth({
    appId: "123456",
    kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    request,
  });

  // Try to use an unknown authentication type
  await auth({
    type: "unknown",
  });
} catch (error) {
  errorThrown = true;
  errorMessage = error.message;
}

if (!errorThrown) {
  throw new Error("Expected error to be thrown for unknown authentication type");
}

if (!errorMessage.includes("Unknown authentication type")) {
  throw new Error(`Expected unknown type error, got: ${errorMessage}`);
}

console.log("✓ KMS unknown auth type test passed");
