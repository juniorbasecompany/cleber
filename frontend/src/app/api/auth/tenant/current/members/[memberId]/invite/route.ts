import { NextRequest, NextResponse } from "next/server";

import { backendFetch, requireToken } from "@/lib/backend-fetch";

type InviteEmailResponse = {
  message: string;
  email: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  const authResult = requireToken(request);
  if (!authResult.ok) {
    return authResult.error;
  }

  const { memberId } = await context.params;
  const localeHeader = request.headers.get("x-valora-invite-email-locale");
  const forwardHeaders: Record<string, string> = {};
  if (localeHeader?.trim()) {
    forwardHeaders["X-Valora-Invite-Email-Locale"] = localeHeader.trim();
  }

  const result = await backendFetch<InviteEmailResponse>(
    `/auth/tenant/current/members/${memberId}/invite`,
    {
      method: "POST",
      token: authResult.token,
      headers: forwardHeaders
    }
  );

  if (!result.ok) {
    return result.error;
  }

  return NextResponse.json(result.data);
}
