"""Envio de e-mail de convite de membro via Resend; cópias por locale em locale/member_invite_email.json."""

from __future__ import annotations

import html
import logging
import re
from typing import Tuple

from valora_backend.config import Settings
from valora_backend.locale.member_invite_email import (
    get_member_invite_email_strings,
    resolve_member_invite_locale,
)

logger = logging.getLogger(__name__)

try:
    import resend

    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("Resend não está instalado.")


def _build_invite_html(
    *,
    member_name: str,
    tenant_name: str,
    app_url: str,
    to_email: str,
    strings: dict[str, str],
) -> str:
    esc = html.escape
    ctx = {
        "tenant_name": tenant_name,
        "member_name": member_name,
        "to_email": to_email,
        "app_url": app_url,
    }
    title_heading = esc(strings["title_prefix"].format(**ctx))
    greeting = esc(strings["greeting"].format(**ctx))
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title_heading}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2c3e50; margin-top: 0;">{title_heading}</h1>
    </div>
    <div style="padding: 20px 0;">
        <p>{greeting}</p>
        <p>{esc(strings["body_lead"].format(**ctx))}</p>
        <p>{esc(strings["cta_intro"].format(**ctx))}</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{esc(app_url)}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">{esc(strings["cta_label"])}</a>
        </div>
        <p>{esc(strings["link_intro"].format(**ctx))}</p>
        <p style="word-break: break-all; color: #007bff;">{esc(app_url)}</p>
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>{esc(strings["instructions_title"])}</strong></p>
            <ul style="margin: 10px 0;">
                <li>{esc(strings["instruction_existing"].format(**ctx))}</li>
                <li>{esc(strings["instruction_new"].format(**ctx))}</li>
            </ul>
        </div>
        <p>{esc(strings["closing"].format(**ctx))}</p>
        <p style="margin-top: 30px;">
            <strong>{esc(strings["signature"].format(**ctx))}</strong>
        </p>
    </div>
    <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #6c757d;">
        <p style="margin: 0;">{esc(strings["footer"].format(**ctx))}</p>
    </div>
</body>
</html>
    """.strip()


def _build_invite_text(
    *,
    member_name: str,
    tenant_name: str,
    app_url: str,
    to_email: str,
    strings: dict[str, str],
) -> str:
    lines = [
        strings["greeting"].format(
            member_name=member_name,
            tenant_name=tenant_name,
            to_email=to_email,
            app_url=app_url,
        ),
        "",
        strings["body_lead"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        "",
        strings["cta_intro"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        app_url,
        "",
        strings["instructions_title"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        strings["instruction_existing"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        strings["instruction_new"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        "",
        strings["closing"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        strings["signature"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
        "",
        "---",
        strings["footer"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url,
        ),
    ]
    return "\n".join(lines)


def send_member_invite(
    *,
    to_email: str,
    member_name: str,
    tenant_name: str,
    locale: str,
    app_url: str | None = None,
) -> Tuple[bool, str]:
    """
    Envia e-mail de convite. Retorna (ok, mensagem_de_erro_vazia_se_ok).
    Mensagens de falha de configuração ou Resend em inglês (logs e detalhe genérico na API).
    """
    logger.info(
        "Sending member invite email to %s (member_name=%s tenant=%s locale=%s)",
        to_email,
        member_name,
        tenant_name,
        locale,
    )
    try:
        settings = Settings()
        resolved_locale = resolve_member_invite_locale(locale)
        strings = get_member_invite_email_strings(resolved_locale)
        app_url_final = app_url or settings.app_url
        resend_api_key_secret = settings.resend_api_key
        resend_api_key = (
            resend_api_key_secret.get_secret_value()
            if resend_api_key_secret is not None
            else None
        )
        email_from = settings.email_from

        subject = strings["subject"].format(
            tenant_name=tenant_name,
            member_name=member_name,
            to_email=to_email,
            app_url=app_url_final,
        )
        html_body = _build_invite_html(
            member_name=member_name,
            tenant_name=tenant_name,
            app_url=app_url_final,
            to_email=to_email,
            strings=strings,
        )
        text_body = _build_invite_text(
            member_name=member_name,
            tenant_name=tenant_name,
            app_url=app_url_final,
            to_email=to_email,
            strings=strings,
        )

        if not RESEND_AVAILABLE:
            return False, "Resend is not installed. Configure the email integration."

        if not resend_api_key:
            return False, "RESEND_API_KEY is not set. Configure outbound email."

        if not email_from:
            return False, "EMAIL_FROM is not set. Configure the sender address."

        resend.api_key = resend_api_key

        try:
            params = {
                "from": email_from,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
                "text": text_body,
            }
            email_response = resend.Emails.send(params)

            if email_response and isinstance(email_response, dict) and "id" in email_response:
                return True, ""

            email_id = getattr(email_response, "id", None)
            if email_id:
                return True, ""

            error_msg = f"Unexpected email provider response: {email_response!r}"
            logger.error("%s for %s", error_msg, to_email)
            return False, error_msg

        except Exception as resend_error:
            error_msg_raw = str(resend_error)
            if resend_api_key and resend_api_key in error_msg_raw:
                error_msg_raw = error_msg_raw.replace(resend_api_key, "***REDACTED***")

            lower = error_msg_raw.lower()
            if "domain" in lower and (
                "not verified" in lower or "unverified" in lower or "não verificado" in lower
            ):
                domain_pattern = (
                    r"\b([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}"
                )
                domain_match = re.search(domain_pattern, error_msg_raw)
                if domain_match:
                    domain = domain_match.group(0)
                    error_msg = (
                        f"Domain '{domain}' is not verified in Resend. "
                        "Add and verify it at https://resend.com/domains"
                    )
                else:
                    error_msg = (
                        "Email domain is not verified in Resend. "
                        "Add and verify it at https://resend.com/domains"
                    )
            elif "domain" in lower or "verified" in lower or "verificado" in lower:
                error_msg = "Email domain is not verified in Resend."
            elif "invalid" in lower or "inválido" in lower:
                error_msg = "Invalid email configuration. Check EMAIL_FROM and RESEND_API_KEY."
            elif "unauthorized" in lower or "401" in error_msg_raw:
                error_msg = "Invalid or expired RESEND_API_KEY."
            elif "rate limit" in lower or "quota" in lower:
                error_msg = "Email sending rate limit exceeded. Try again later."
            else:
                error_msg = f"Failed to send email: {error_msg_raw[:100]}"

            logger.error(
                "Resend error for %s: %s", to_email, error_msg_raw, exc_info=True
            )
            return False, error_msg

    except Exception as e:
        error_msg = f"Unexpected error: {str(e)[:100]}"
        logger.error("Invite email failure for %s: %s", to_email, e, exc_info=True)
        return False, error_msg
