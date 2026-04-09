import { useTranslations } from "next-intl";

import { AppSegmentSkeleton } from "@/component/ui/skeleton-patterns";

export default function AppLoadingPage() {
  const t = useTranslations("State");

  return <AppSegmentSkeleton busyAriaLabel={t("loadingAriaLabel")} />;
}
