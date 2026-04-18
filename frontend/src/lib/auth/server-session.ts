import { cache } from "react";
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
  ScopeFormulaListResponse,
  TenantScopeActionDirectoryResponse,
  TenantScopeDirectoryResponse,
  TenantScopeEventDirectoryResponse,
  TenantScopeFieldDirectoryResponse,
  TenantItemDirectoryResponse,
  TenantUnityDirectoryResponse
} from "@/lib/auth/types";

const apiUrl = getPublicApiUrl();

export const getAuthSession = cache(async () => {
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
});

export const getTenantCurrentDetail = cache(async () => {
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
});

export const getTenantMemberDirectory = cache(async () => {
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
});

export const getTenantScopeDirectory = cache(async () => {
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
});

export const getTenantLocationDirectory = cache(async (scopeId: number) => {
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
});

export const getTenantItemDirectory = cache(async (scopeId: number) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/items`,
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

    return (await response.json()) as TenantItemDirectoryResponse;
  } catch {
    return null;
  }
});

export const getTenantUnityDirectory = cache(async (scopeId: number) => {
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
});

export const getTenantScopeFieldDirectory = cache(async (
  scopeId: number,
  labelLang: "pt-BR" | "en" | "es"
) => {
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
});

export const getTenantScopeActionDirectory = cache(async (
  scopeId: number,
  labelLang: "pt-BR" | "en" | "es"
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  const query = new URLSearchParams({ label_lang: labelLang });

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/actions?${query.toString()}`,
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

    return (await response.json()) as TenantScopeActionDirectoryResponse;
  } catch {
    return null;
  }
});

export const getTenantScopeActionFormulaList = cache(async (
  scopeId: number,
  actionId: number
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/actions/${actionId}/formulas`,
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

    return (await response.json()) as ScopeFormulaListResponse;
  } catch {
    return null;
  }
});

export const getTenantScopeEventDirectory = cache(async (
  scopeId: number,
  filter: {
    age_from?: number;
    age_to?: number;
    location_id?: number | number[];
    item_id?: number | number[];
    action_id?: number;
    label_lang?: "pt-BR" | "en" | "es";
    /** Eventos-padrão (standard) ou fatos (fact); omitido: lista mista. */
    event_kind?: "standard" | "fact";
  } = {}
) => {
  const cookieStore = await cookies();
  const token = cookieStore.get(authTokenCookieName)?.value;
  if (!hasAuthSession(token)) {
    return null;
  }

  const query = new URLSearchParams();
  if (filter.age_from != null) {
    query.set("age_from", String(filter.age_from));
  }
  if (filter.age_to != null) {
    query.set("age_to", String(filter.age_to));
  }
  if (Array.isArray(filter.location_id)) {
    for (const locationId of filter.location_id) {
      query.append("location_id", String(locationId));
    }
  } else if (filter.location_id != null) {
    query.set("location_id", String(filter.location_id));
  }
  if (Array.isArray(filter.item_id)) {
    for (const itemId of filter.item_id) {
      query.append("item_id", String(itemId));
    }
  } else if (filter.item_id != null) {
    query.set("item_id", String(filter.item_id));
  }
  if (filter.action_id != null) {
    query.set("action_id", String(filter.action_id));
  }
  if (filter.label_lang != null) {
    query.set("label_lang", filter.label_lang);
  }
  if (filter.event_kind != null) {
    query.set("event_kind", filter.event_kind);
  }
  const suffix = query.toString();

  try {
    const response = await fetch(
      `${apiUrl}/auth/tenant/current/scopes/${scopeId}/events${suffix ? `?${suffix}` : ""}`,
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

    return (await response.json()) as TenantScopeEventDirectoryResponse;
  } catch {
    return null;
  }
});
