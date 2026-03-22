import { NextRequest, NextResponse } from "next/server";

import { backendFetch, requireToken } from "@/lib/backend-fetch";
import type { TenantMemberDirectoryResponse } from "@/lib/auth/types";

export async function GET(request: NextRequest) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  const result = await backendFetch<TenantMemberDirectoryResponse>(
    "/auth/tenant/current/members",
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
