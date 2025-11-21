import { DEFAULT_ENV } from "./main.js";

// Test that an error is thrown when neither private-key nor aws-kms-arn is provided
let errorThrown = false;
let errorMessage = "";

try {
  // Set up environment without private key or KMS ARN
  for (const [key, value] of Object.entries({
    ...DEFAULT_ENV,
    "INPUT_PRIVATE-KEY": "",
    "INPUT_AWS-KMS-ARN": "",
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
  throw new Error("Expected error to be thrown when neither private-key nor aws-kms-arn is provided");
}

if (!errorMessage.includes("Either 'private-key' or 'aws-kms-arn' must be provided")) {
  throw new Error(`Expected specific error message, got: ${errorMessage}`);
}

console.log("✓ KMS validation (missing both) test passed");
