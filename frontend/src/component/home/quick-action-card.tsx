import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/component/ui/ui-icons";

type QuickActionCardProps = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  iconSlot?: ReactNode;
};

export function QuickActionCard({
  title,
  description,
  href,
  actionLabel,
  iconSlot
}: QuickActionCardProps) {
  return (
    <article className="ui-card flex h-full flex-col gap-4 border-[rgba(37,117,216,0.14)] p-5">
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(37,117,216,0.18),_transparent_70%)]" />
      <div className="relative flex items-start gap-4">
        {iconSlot ? <div className="ui-icon-badge shrink-0">{iconSlot}</div> : null}
        <div className="space-y-2">
          <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--color-text)]">
            {title}
          </h3>
          <p className="text-sm leading-6 text-[var(--color-text-subtle)]">
            {description}
          </p>
        </div>
      </div>
      <div className="relative mt-auto">
        <Link
          href={href}
          className="ui-button-secondary inline-flex items-center text-sm font-medium transition"
        >
          {actionLabel}
          <ArrowUpRightIcon />
        </Link>
      </div>
    </article>
  );
}
