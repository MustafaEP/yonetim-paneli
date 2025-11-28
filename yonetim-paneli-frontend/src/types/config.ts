export interface RawSystemConfig {
  app_name?: string;
  theme?: string;
  default_page_limit?: string;
}

export type ThemeMode = "light" | "dark";

export interface SystemConfig {
  appName: string;
  theme: ThemeMode;
  defaultPageLimit: number;
}
