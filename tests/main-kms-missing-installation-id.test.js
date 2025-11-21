import { DEFAULT_ENV } from "./main.js";
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

// Test that an error is thrown when installation auth is requested without installation ID
let errorThrown = false;
let errorMessage = "";

try {
  // Create KMS auth function
  const auth = createKmsAppAuth({
    appId: "123456",
    kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    request,
  });

  // Try to create installation auth without providing installationId
  await auth({
    type: "installation",
    // Missing installationId
  });
} catch (error) {
  errorThrown = true;
  errorMessage = error.message;
}

if (!errorThrown) {
  throw new Error("Expected error to be thrown when installationId is missing");
}

if (!errorMessage.includes("installationId is required")) {
  throw new Error(`Expected installationId error, got: ${errorMessage}`);
}

console.log("✓ KMS missing installation ID test passed");
