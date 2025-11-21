import { mockClient } from "aws-sdk-client-mock";
import { KMSClient, SignCommand } from "@aws-sdk/client-kms";
import { createKmsAppAuth } from "../lib/kms-auth.js";
import request from "../lib/request.js";

// Create a mock KMS client
const kmsMock = mockClient(KMSClient);

// Set up KMS mock to return no signature (undefined)
kmsMock.on(SignCommand).resolves({
  Signature: undefined,
});

// Test that an error is thrown when KMS returns no signature
let errorThrown = false;
let errorMessage = "";

try {
  // Create KMS auth function
  const auth = createKmsAppAuth({
    appId: "123456",
    kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    request,
  });

  // Try to get app authentication which will trigger signing
  await auth({ type: "app" });
} catch (error) {
  errorThrown = true;
  errorMessage = error.message;
}

if (!errorThrown) {
  throw new Error("Expected error to be thrown when KMS returns no signature");
}

if (!errorMessage.includes("KMS signing failed: no signature returned")) {
  throw new Error(`Expected KMS signing error, got: ${errorMessage}`);
}

console.log("✓ KMS no signature error test passed");
