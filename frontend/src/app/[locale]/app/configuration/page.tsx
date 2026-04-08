import { redirect } from "next/navigation";

type ConfigurationPageProps = {
  params: Promise<{ locale: string }>;
};

/** Hub antigo removido; URL mantida para compatibilidade (favoritos, links antigos). */
export default async function ConfigurationPage({ params }: ConfigurationPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/app`);
}
