import { CheckCircleIcon, ClockIcon, SparkIcon } from "@/component/ui/ui-icons";

type StatusPanelProps = {
  title: string;
  description: string;
  tone?: "neutral" | "positive" | "attention";
};

const toneMetaByTone = {
  neutral: {
    className: "ui-tone-neutral",
    iconClassName: "ui-icon-badge",
    Icon: SparkIcon
  },
  positive: {
    className: "ui-tone-positive",
    iconClassName: "ui-icon-badge ui-icon-badge-positive",
    Icon: CheckCircleIcon
  },
  attention: {
    className: "ui-tone-attention",
    iconClassName: "ui-icon-badge ui-icon-badge-attention",
    Icon: ClockIcon
  }
} as const;

export function StatusPanel({
  title,
  description,
  tone = "neutral"
}: StatusPanelProps) {
  const toneMeta = toneMetaByTone[tone];

  return (
    <div
      className={`rounded-[var(--radius-card)] border px-4 py-4 text-sm shadow-[var(--shadow-xs)] ${toneMeta.className}`}
    >
      <div className="flex items-start gap-3">
        <span className={toneMeta.iconClassName}>
          <toneMeta.Icon className="h-[1.05rem] w-[1.05rem]" />
        </span>
        <div className="space-y-1">
          <div className="font-semibold tracking-[-0.01em]">{title}</div>
          <div className="leading-6 opacity-85">{description}</div>
        </div>
      </div>
    </div>
  );
}
