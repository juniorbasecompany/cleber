import { NextRequest, NextResponse } from "next/server";

import { backendFetch, requireToken } from "@/lib/backend-fetch";
import type { TenantScopeDirectoryResponse } from "@/lib/auth/types";

export async function GET(request: NextRequest) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  const result = await backendFetch<TenantScopeDirectoryResponse>(
    "/auth/tenant/current/scopes",
    {
      method: "GET",
      token: authResult.token
    }
  );
  if (!result.ok) {
    return result.error;
  }

  return NextResponse.json(result.data);
}

export async function POST(request: NextRequest) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON body" }, { status: 400 });
  }

  const result = await backendFetch<TenantScopeDirectoryResponse>(
    "/auth/tenant/current/scopes",
    {
      method: "POST",
      token: authResult.token,
      body
    }
  );
  if (!result.ok) {
    return result.error;
  }

  return NextResponse.json(result.data);
}
