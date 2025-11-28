import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import api from "../api/client";
import type { RawSystemConfig, SystemConfig, ThemeMode } from "../types/config";

interface ConfigContextValue {
  config: SystemConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void; // sadece frontend'de override
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const useConfig = (): ConfigContextValue => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return ctx;
};

const normalizeConfig = (raw: RawSystemConfig | null): SystemConfig => {
  const appName = raw?.app_name || "Yönetim Paneli";
  const themeRaw = raw?.theme === "dark" ? "dark" : "light";
  const defaultLimit = raw?.default_page_limit
    ? Number(raw.default_page_limit)
    : 10;

  return {
    appName,
    theme: themeRaw,
    defaultPageLimit: !Number.isNaN(defaultLimit) && defaultLimit > 0
      ? defaultLimit
      : 10,
  };
};

interface ConfigProviderProps {
  children: React.ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideTheme, setOverrideTheme] = useState<ThemeMode | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get<RawSystemConfig>("/config");
      const normalized = normalizeConfig(res.data || {});
      setConfig(normalized);
    } catch (err) {
      console.error("Sistem ayarları alınırken hata:", err);
      // config null kalırsa fallback ile devam ederiz
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // document title'ı ayarlama
  useEffect(() => {
    if (config?.appName) {
      document.title = config.appName;
    }
  }, [config?.appName]);

  const themeMode: ThemeMode =
    overrideTheme || config?.theme || "light";

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
      }),
    [themeMode]
  );

  const value: ConfigContextValue = {
    config: config || normalizeConfig(null),
    loading,
    refreshConfig: fetchConfig,
    setThemeMode: (mode: ThemeMode) => setOverrideTheme(mode),
  };

  return (
    <ConfigContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ConfigContext.Provider>
  );
};
