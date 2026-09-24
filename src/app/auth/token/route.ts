import { NextResponse } from "next/server";
import { issueClientCredentialsToken } from "@/lib/bom/carbon/pact/host/auth";

/** OAuth2 token endpoint stub — POST /auth/token */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  let clientId = "";
  let clientSecret = "";
  let scope: string | undefined;
  let companyId: string | undefined;
  let grantType = "";

  try {
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      grantType = params.get("grant_type") || "";
      clientId = params.get("client_id") || "";
      clientSecret = params.get("client_secret") || "";
      scope = params.get("scope") || undefined;
      companyId = params.get("company_id") || undefined;
    } else {
      const body = (await request.json()) as {
        grant_type?: string;
        client_id?: string;
        client_secret?: string;
        scope?: string;
        company_id?: string;
      };
      grantType = body.grant_type || "";
      clientId = body.client_id || "";
      clientSecret = body.client_secret || "";
      scope = body.scope;
      companyId = body.company_id;
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Malformed token request" },
      { status: 400 }
    );
  }

  if (grantType !== "client_credentials") {
    return NextResponse.json(
      {
        error: "unsupported_grant_type",
        error_description: "Only client_credentials is supported",
      },
      { status: 400 }
    );
  }

  try {
    const token = issueClientCredentialsToken({
      clientId,
      clientSecret,
      scope,
      companyId,
    });
    return NextResponse.json(token);
  } catch (e) {
    const err = e as Error & { oauthError?: string; status?: number };
    return NextResponse.json(
      {
        error: err.oauthError || "invalid_client",
        error_description: err.message || "Authentication failed",
      },
      { status: err.status || 401 }
    );
  }
}
