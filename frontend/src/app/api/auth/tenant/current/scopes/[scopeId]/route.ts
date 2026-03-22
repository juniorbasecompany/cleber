import { NextRequest, NextResponse } from "next/server";

import { backendFetch, requireToken } from "@/lib/backend-fetch";
import type { TenantScopeDirectoryResponse } from "@/lib/auth/types";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ scopeId: string }> }
) {
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

  const { scopeId } = await context.params;
  const result = await backendFetch<TenantScopeDirectoryResponse>(
    `/auth/tenant/current/scopes/${scopeId}`,
    {
      method: "PATCH",
      token: authResult.token,
      body
    }
  );
  if (!result.ok) {
    return result.error;
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ scopeId: string }> }
) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  const { scopeId } = await context.params;
  const result = await backendFetch<TenantScopeDirectoryResponse>(
    `/auth/tenant/current/scopes/${scopeId}`,
    {
      method: "DELETE",
      token: authResult.token
    }
  );
  if (!result.ok) {
    return result.error;
  }

  return NextResponse.json(result.data);
}
