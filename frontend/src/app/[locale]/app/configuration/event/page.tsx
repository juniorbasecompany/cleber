import { redirect } from "next/navigation";

type EventConfigurationRedirectPageProps = {
  params: Promise<{ locale: string }>;
};

/** URL antiga `/configuration/event`: redireciona para o painel de fatos. */
export default async function EventConfigurationRedirectPage({
  params
}: EventConfigurationRedirectPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/app/configuration/event/fact`);
}
