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

// Test app-level authentication (not installation)
const auth = createKmsAppAuth({
  appId: "123456",
  kmsKeyArn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
  request,
});

// Get app authentication (JWT token)
const appAuth = await auth({ type: "app" });

if (!appAuth.token) {
  throw new Error("Expected app token to be returned");
}

if (appAuth.type !== "app") {
  throw new Error("Expected auth type to be 'app'");
}

if (appAuth.appId !== 123456) {
  throw new Error("Expected appId to be 123456");
}

// Verify the token is a JWT (three parts separated by dots)
const parts = appAuth.token.split(".");
if (parts.length !== 3) {
  throw new Error("Expected JWT to have 3 parts");
}

console.log("✓ KMS app authentication test passed");
