import { NextRequest, NextResponse } from "next/server";

import type { TenantScopeFieldDirectoryResponse } from "@/lib/auth/types";
import { backendFetch, requireToken } from "@/lib/backend-fetch";

export async function POST(
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
  const search = request.nextUrl.search;
  const result = await backendFetch<TenantScopeFieldDirectoryResponse>(
    `/auth/tenant/current/scopes/${scopeId}/fields/reorder${search}`,
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
