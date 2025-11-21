import { DEFAULT_ENV } from "./main.js";

// Test that an error is thrown when both private-key and aws-kms-arn are provided
let errorThrown = false;
let errorMessage = "";

try {
  // Set up environment with both private key AND KMS ARN
  for (const [key, value] of Object.entries({
    ...DEFAULT_ENV,
    "INPUT_AWS-KMS-ARN": "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    // INPUT_PRIVATE-KEY is already set in DEFAULT_ENV
  })) {
    process.env[key] = value;
  }

  // This should throw an error
  const { default: promise } = await import("../main.js");
  await promise;
} catch (error) {
  errorThrown = true;
  errorMessage = error.message;
}

if (!errorThrown) {
  throw new Error("Expected error to be thrown when both private-key and aws-kms-arn are provided");
}

if (!errorMessage.includes("Only one of 'private-key' or 'aws-kms-arn' should be provided")) {
  throw new Error(`Expected specific error message, got: ${errorMessage}`);
}

console.log("✓ KMS validation (both provided) test passed");
