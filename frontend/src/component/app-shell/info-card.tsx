import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/component/ui/ui-icons";

type InfoCardProps = {
  title: string;
  description: string;
  iconSlot?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
};

export function InfoCard({
  title,
  description,
  iconSlot,
  actionHref,
  actionLabel
}: InfoCardProps) {
  return (
    <article className="ui-card flex h-full flex-col gap-4 p-5">
      <div className="flex items-start gap-4">
        {iconSlot ? <div className="ui-icon-badge shrink-0">{iconSlot}</div> : null}
        <div className="space-y-2">
          <h2 className="text-[0.98rem] font-semibold tracking-[-0.02em] text-[var(--color-text)]">
            {title}
          </h2>
          <p className="text-sm leading-6 text-[var(--color-text-subtle)]">
            {description}
          </p>
        </div>
      </div>
      {actionHref && actionLabel ? (
        <div className="mt-auto">
          <Link className="ui-link text-sm font-semibold" href={actionHref}>
            {actionLabel}
            <ArrowUpRightIcon />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
