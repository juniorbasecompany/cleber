"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  googleIdTokenStorageKey,
  rememberMeChoiceStorageKey,
  tenantSelectionStorageKey
} from "@/lib/auth/session";
import type {
  AuthResponse,
  TenantSelectionSnapshot
} from "@/lib/auth/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "continue_with" | "signin_with" | "signup_with";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
          cancel: () => void;
        };
      };
    };
  }
}

type GoogleSignInPanelProps = {
  locale: string;
  clientId?: string;
  buttonLabel: string;
  buttonPendingLabel: string;
  helperText: string;
  unavailableText: string;
  genericErrorText: string;
  rememberMeLabel: string;
};

export function GoogleSignInPanel({
  locale,
  clientId,
  buttonLabel,
  buttonPendingLabel,
  helperText,
  unavailableText,
  genericErrorText,
  rememberMeLabel
}: GoogleSignInPanelProps) {
  const router = useRouter();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const isUnavailable = useMemo(() => !clientId, [clientId]);

  const handleCredential = useCallback(
    async (credential: string) => {
      setIsPending(true);
      setErrorMessage(null);

      try {
        sessionStorage.setItem(
          rememberMeChoiceStorageKey,
          rememberMe ? "1" : "0"
        );

        const response = await fetch("/api/auth/google/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id_token: credential,
            remember_me: rememberMe
          })
        });
        const data = (await response.json()) as AuthResponse & { detail?: string };

        if (!response.ok) {
          setErrorMessage(data.detail || genericErrorText);
          setIsPending(false);
          return;
        }

        if (data.requires_tenant_selection) {
          const snapshot: TenantSelectionSnapshot = {
            tenant_list: data.tenant_list ?? [],
            invite_list: data.invite_list ?? [],
            next_action: data.next_action ?? null
          };
          sessionStorage.setItem(googleIdTokenStorageKey, credential);
          sessionStorage.setItem(
            tenantSelectionStorageKey,
            JSON.stringify(snapshot)
          );
          router.push(`/${locale}/select-tenant`);
          return;
        }

        sessionStorage.removeItem(googleIdTokenStorageKey);
        sessionStorage.removeItem(tenantSelectionStorageKey);
        sessionStorage.removeItem(rememberMeChoiceStorageKey);
        router.push(`/${locale}/app`);
      } catch {
        setErrorMessage(genericErrorText);
        setIsPending(false);
      }
    },
    [genericErrorText, locale, rememberMe, router]
  );

  useEffect(() => {
    if (isUnavailable) {
      return;
    }
    const nextClientId = clientId;
    if (!nextClientId) {
      return;
    }

    let isCancelled = false;
    const intervalId = window.setInterval(() => {
      if (isCancelled || !window.google || !buttonContainerRef.current) {
        return;
      }

      buttonContainerRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: nextClientId,
        callback: ({ credential }) => {
          if (!credential) {
            setErrorMessage(genericErrorText);
            return;
          }

          void handleCredential(credential);
        }
      });
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width: 340
      });
      setIsReady(true);
      window.clearInterval(intervalId);
    }, 200);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
      window.google?.accounts.id.cancel();
    };
  }, [clientId, genericErrorText, handleCredential, isUnavailable]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white/75 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)] shadow-[var(--shadow-xs)]">
          {helperText}
        </div>
        {errorMessage ? (
          <div className="ui-notice-attention px-4 py-3 text-sm">
            {errorMessage}
          </div>
        ) : null}
        {isUnavailable ? (
          <div className="ui-notice-attention px-4 py-3 text-sm">
            {unavailableText}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {!isUnavailable ? (
          <div className="relative h-10 w-[340px] max-w-full" aria-busy={!isReady}>
            {!isReady ? (
              <>
                <div
                  className="pointer-events-none absolute inset-0 z-0 rounded-full bg-[var(--color-border)]/25 motion-safe:animate-pulse"
                  aria-hidden
                />
                <span className="sr-only">{buttonLabel}</span>
              </>
            ) : null}
            <div
              ref={buttonContainerRef}
              className={`relative z-10 flex h-full w-full items-center ${
                isPending ? "pointer-events-none opacity-60" : ""
              }`}
            />
          </div>
        ) : null}
        {isPending ? (
          <div className="text-sm font-medium text-[var(--color-text)]">
            {buttonPendingLabel}
          </div>
        ) : null}
        <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background-muted)]/70 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={isUnavailable || isPending}
            className="mt-1 h-4 w-4 shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50"
          />
          <span>{rememberMeLabel}</span>
        </label>
      </div>
    </div>
  );
}
