import { DEFAULT_ENV } from "./main.js";

for (const [key, value] of Object.entries({
  ...DEFAULT_ENV,
  "INPUT_AWS-KMS-ARN":
    "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
  // INPUT_PRIVATE-KEY is already set in DEFAULT_ENV
})) {
  process.env[key] = value;
}

const _error = console.error;
console.error = (err) => _error(err?.message ?? err);

const { default: promise } = await import("../main.js");
await promise;
process.exitCode = 0;
