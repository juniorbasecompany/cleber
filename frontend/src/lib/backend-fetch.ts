import { NextResponse } from "next/server";

import {
  authPersistCookieName,
  authRememberMeMaxAgeSeconds,
  authTokenCookieName
} from "@/lib/auth/session";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003";

type BackendResult<T> =
  | { ok: true; data: T; response: Response }
  | { ok: false; error: NextResponse };

type BackendFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
};

function isConnectionError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("fetch") ||
      errorMessage.includes("network") ||
      errorMessage.includes("econnrefused")
    );
  }

  return false;
}

function normalizeBackendErrorPayload(rawBody: string, status: number) {
  const trimmedBody = rawBody.trim();
  if (!trimmedBody) {
    return {
      detail:
        status >= 500
          ? "O backend falhou sem informar o motivo. Verifique os logs do servidor."
          : "A requisição falhou sem detalhar o motivo."
    };
  }

  try {
    return JSON.parse(trimmedBody);
  } catch {
    if (trimmedBody === "Internal Server Error") {
      return {
        detail:
          "O backend respondeu com erro interno e não informou o motivo. Verifique os logs do servidor."
      };
    }
    return { detail: trimmedBody };
  }
}

export async function backendFetch<T>(
  endpoint: string,
  options: BackendFetchOptions = {}
): Promise<BackendResult<T>> {
  const { method = "GET", body, headers = {}, token } = options;

  try {
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers
    };

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    });

    const rawBody = await response.text();
    const data = normalizeBackendErrorPayload(rawBody, response.status) as T;

    if (!response.ok) {
      return {
        ok: false,
        error: NextResponse.json(data, { status: response.status })
      };
    }

    return { ok: true, data, response };
  } catch (error) {
    if (isConnectionError(error)) {
      return {
        ok: false,
        error: NextResponse.json(
          { detail: "Servidor indisponível. Tente novamente em instantes." },
          { status: 503 }
        )
      };
    }

    return {
      ok: false,
      error: NextResponse.json(
        { detail: "Erro interno ao comunicar com o backend." },
        { status: 500 }
      )
    };
  }
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ detail: message }, { status });
}

export function requireToken(request: {
  cookies: { get: (name: string) => { value: string } | undefined };
}) {
  const token = request.cookies.get(authTokenCookieName)?.value;
  if (!token) {
    return {
      ok: false as const,
      error: NextResponse.json({ detail: "Não autenticado" }, { status: 401 })
    };
  }

  return { ok: true as const, token };
}

type AuthCookieOptions = {
  rememberMe: boolean;
};

function applyAuthCookies(
  response: NextResponse,
  token: string,
  { rememberMe }: AuthCookieOptions
) {
  const base = {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/"
  };

  if (rememberMe) {
    response.cookies.set(authTokenCookieName, token, {
      ...base,
      maxAge: authRememberMeMaxAgeSeconds
    });
    response.cookies.set(authPersistCookieName, "1", {
      ...base,
      maxAge: authRememberMeMaxAgeSeconds
    });
  } else {
    response.cookies.set(authTokenCookieName, token, { ...base });
    response.cookies.set(authPersistCookieName, "0", { ...base });
  }
}

export function successWithCookie<T>(
  data: T,
  token: string,
  cookieOptions: AuthCookieOptions
) {
  const response = NextResponse.json(data);
  applyAuthCookies(response, token, cookieOptions);
  return response;
}

export function clearAuthCookie() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(authTokenCookieName);
  response.cookies.delete(authPersistCookieName);
  return response;
}
