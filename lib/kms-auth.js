// @ts-check

import { KMSClient, SignCommand } from "@aws-sdk/client-kms";

/**
 * Create a custom signing function that uses AWS KMS
 * @param {string} kmsKeyArn - The ARN of the KMS key
 * @param {string | undefined} awsProfile - Optional AWS profile to use
 * @returns {(payload: string) => Promise<string>} A signing function
 */
function createKmsSigner(kmsKeyArn, awsProfile) {
  const clientConfig = awsProfile ? { profile: awsProfile } : {};
  const kmsClient = new KMSClient(clientConfig);

  return async (payload) => {
    const command = new SignCommand({
      KeyId: kmsKeyArn,
      Message: Buffer.from(payload, "utf8"),
      MessageType: "RAW",
      SigningAlgorithm: "RSASSA_PKCS1_V1_5_SHA_256",
    });

    const response = await kmsClient.send(command);

    if (!response.Signature) {
      throw new Error("KMS signing failed: no signature returned");
    }

    // Convert signature to base64url format (required by JWT)
    return Buffer.from(response.Signature)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  };
}

/**
 * Create a JWT token signed with AWS KMS
 * @param {string} appId - GitHub App ID
 * @param {(payload: string) => Promise<string>} sign - Signing function
 * @returns {Promise<string>} JWT token
 */
async function createKmsSignedJwt(appId, sign) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // issued at time, 60 seconds in the past to allow for clock drift
    exp: now + 600, // expires in 10 minutes
    iss: Number(appId), // Convert to number to match Python implementation
  };

  const header = {
    typ: "JWT",
    alg: "RS256",
  };

  // Use compact JSON encoding (no spaces) to match the Python implementation
  const encodedHeader = Buffer.from(JSON.stringify(header).replace(/\s/g, ""))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const encodedPayload = Buffer.from(JSON.stringify(payload).replace(/\s/g, ""))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await sign(signatureInput);

  return `${signatureInput}.${signature}`;
}

/**
 * Create an app auth instance that uses AWS KMS for signing
 * @param {Object} options
 * @param {string} options.appId - GitHub App ID
 * @param {string} options.kmsKeyArn - AWS KMS key ARN
 * @param {string} [options.awsProfile] - Optional AWS profile
 * @param {import("@octokit/request").request} options.request - Octokit request instance
 * @returns {Function}
 */
export function createKmsAppAuth({ appId, kmsKeyArn, awsProfile, request }) {
  const sign = createKmsSigner(kmsKeyArn, awsProfile);

  /**
   * Auth function that returns authentication tokens
   * @param {Object} options
   * @param {'app' | 'installation'} options.type - Type of authentication
   * @param {number} [options.installationId] - Installation ID (required for installation auth)
   * @param {string[]} [options.repositoryNames] - Repository names
   * @param {Record<string, string>} [options.permissions] - Permissions
   * @returns {Promise<Object>}
   */
  const auth = async (options = {}) => {
    const { type = "app", installationId, repositoryNames, permissions } = options;

    if (type === "app") {
      const jwt = await createKmsSignedJwt(appId, sign);
      return {
        type: "app",
        token: jwt,
        appId: Number(appId),
      };
    }

    if (type === "installation") {
      if (!installationId) {
        throw new Error("installationId is required for installation authentication");
      }

      // Create JWT for app authentication
      const jwt = await createKmsSignedJwt(appId, sign);

      // Use the JWT to create an installation access token
      const requestOptions = {
        headers: {
          authorization: `Bearer ${jwt}`,
        },
      };

      const body = {};
      if (repositoryNames && repositoryNames.length > 0) {
        body.repositories = repositoryNames;
      }
      if (permissions) {
        body.permissions = permissions;
      }

      const response = await request(
        "POST /app/installations/{installation_id}/access_tokens",
        {
          installation_id: installationId,
          ...body,
          ...requestOptions,
        }
      );

      return {
        type: "token",
        token: response.data.token,
        tokenType: "installation",
        installationId,
        expiresAt: response.data.expires_at,
        permissions: response.data.permissions,
        repositorySelection: response.data.repository_selection,
      };
    }

    throw new Error(`Unknown authentication type: ${type}`);
  };

  // Add a hook function for authenticated requests
  auth.hook = async (request, route, parameters = {}) => {
    const jwt = await createKmsSignedJwt(appId, sign);
    return request(route, {
      ...parameters,
      headers: {
        ...(parameters.headers || {}),
        authorization: `Bearer ${jwt}`,
      },
    });
  };

  return auth;
}
