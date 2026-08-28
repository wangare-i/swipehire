import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

const client = new CognitoIdentityProviderClient({ region: REGION });

export type Role = "jobseeker" | "recruiter";

export type AuthTokens = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

export type IdTokenClaims = {
  sub: string;
  email: string;
  name: string;
  "custom:role": Role;
  exp: number;
};

export function decodeIdToken(idToken: string): IdTokenClaims {
  const payload = idToken.split(".")[1];
  const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: Role
): Promise<void> {
  await client.send(
    new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "name", Value: name },
        { Name: "custom:role", Value: role },
      ],
    })
  );
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthTokens> {
  const res = await client.send(
    new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: { USERNAME: email, PASSWORD: password },
    })
  );
  const result = res.AuthenticationResult;
  if (!result?.IdToken || !result.AccessToken || !result.RefreshToken) {
    throw new Error("Sign in failed");
  }
  return {
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken,
  };
}
