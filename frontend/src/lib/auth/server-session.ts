import { cookies } from "next/headers";

import {
  authTokenCookieName,
  hasAuthSession
} from "@/lib/auth/session";
import { getPublicApiUrl } from "@/lib/backend-api-url";
import type {
  AuthSessionResponse,
  TenantCurrentResponse,
  TenantLocationDirectoryResponse,
  TenantMemberDirectoryResponse,
  TenantScopeDirectoryResponse,
  TenantScopeFieldDirectoryResponse,
  TenantUnityDirectoryResponse
} from "@/lib/auth/types";

const apiUrl = getPublicApiUrl();

export async function getAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthSessionResponse;
  } catch {
    return null;
  }
}

export async function getTenantCurrentDetail() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/tenant/current`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantCurrentResponse;
  } catch {
    return null;
  }
}

export async function getTenantMemberDirectory() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/tenant/current/members`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantMemberDirectoryResponse;
  } catch {
    return null;
  }
}

export async function getTenantScopeDirectory() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/auth/tenant/current/scopes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantScopeDirectoryResponse;
  } catch {
    return null;
  }
}

export async function getTenantLocationDirectory(scopeId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/locations`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantLocationDirectoryResponse;
  } catch {
    return null;
  }
}

export async function getTenantUnityDirectory(scopeId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/unities`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantUnityDirectoryResponse;
  } catch {
    return null;
  }
}

export async function getTenantScopeFieldDirectory(
  scopeId: number,
  labelLang: "pt-BR" | "en" | "es"
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  const query = new URLSearchParams({ label_lang: labelLang });

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/fields?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TenantScopeFieldDirectoryResponse;
  } catch {
    return null;
  }
}
