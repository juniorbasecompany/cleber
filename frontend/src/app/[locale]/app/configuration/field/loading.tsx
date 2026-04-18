import { useTranslations } from "next-intl";

import { AppBusyFallback } from "@/component/ui/app-busy-fallback";

export default function FieldConfigurationLoading() {
  const t = useTranslations("State");

  return <AppBusyFallback busyAriaLabel={t("loadingAriaLabel")} />;
}
