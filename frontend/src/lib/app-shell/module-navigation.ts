export const appModuleKeyList = [
  "operation",
  "record",
  "import",
  "process",
  "audit"
] as const;

export type AppModuleKey = (typeof appModuleKeyList)[number];

export function isAppModuleKey(value: string): value is AppModuleKey {
  return appModuleKeyList.includes(value as AppModuleKey);
}
