import { NextRequest, NextResponse } from "next/server";

import type { TenantScopeActionDirectoryResponse } from "@/lib/auth/types";
import { backendFetch, requireToken } from "@/lib/backend-fetch";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ scopeId: string; actionId: string }> }
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

  const { scopeId, actionId } = await context.params;
  const result = await backendFetch<TenantScopeActionDirectoryResponse>(
    `/auth/tenant/current/scopes/${scopeId}/actions/${actionId}`,
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
  context: { params: Promise<{ scopeId: string; actionId: string }> }
) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  const { scopeId, actionId } = await context.params;
  const result = await backendFetch<TenantScopeActionDirectoryResponse>(
    `/auth/tenant/current/scopes/${scopeId}/actions/${actionId}`,
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
