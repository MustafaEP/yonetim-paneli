// React kütüphanelerini ve hooks'ları içe aktar
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Material-UI bileşenlerini içe aktar (tema yönetimi ve stil sıfırlama için)
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// API istemcisini içe aktar
import api from "../api/client";

// TypeScript türlerini içe aktar
import type { RawSystemConfig, SystemConfig, ThemeMode } from "../types/config";

// ConfigContext'te sağlanacak değerlerin TypeScript arayüzü
interface ConfigContextValue {
  // Sunucudan alınan sistem yapılandırması
  config: SystemConfig | null;
  // Veri yüklenirken loading durumu (API çağrısı sırasında true)
  loading: boolean;
  // Yapılandırmayı sunucudan yeniden almak için fonksiyon
  refreshConfig: () => Promise<void>;
  // Tema modunu (açık/koyu) geçici olarak değiştirme (sadece frontend'de)
  setThemeMode: (mode: ThemeMode) => void;
}

// React Context'i oluştur ve tanımla (ConfigContextValue türüyle)
const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

// Custom hook: Context değerlerine erişmek için kullanılır
// Eğer provider dışında çağrılırsa hata fırlatır
export const useConfig = (): ConfigContextValue => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig must be used within ConfigProvider");
  }
  return ctx;
};

// Sunucudan gelen ham yapılandırmayı (RawSystemConfig) uygulamaya uygun formata çevirme
// Varsayılan değerler ve tür dönüşümleri yapılır
const normalizeConfig = (raw: RawSystemConfig | null): SystemConfig => {
  // Uygulama adı - eğer yoksa varsayılan "Yönetim Paneli" kullanılır
  const appName = raw?.app_name || "Yönetim Paneli";
  
  // Tema modu - "dark" ise "dark", değilse "light"
  const themeRaw = raw?.theme === "dark" ? "dark" : "light";
  
  // Sayfa başına varsayılan öğe sayısı - number'a çevirme ve doğrulama
  const defaultLimit = raw?.default_page_limit
    ? Number(raw.default_page_limit)
    : 10;

  return {
    appName,
    theme: themeRaw,
    // Sayfa limiti pozitif bir sayı olmalı, değilse 10 kullanılır
    defaultPageLimit: !Number.isNaN(defaultLimit) && defaultLimit > 0
      ? defaultLimit
      : 10,
  };
};

// ConfigProvider bileşeninin props arayüzü
interface ConfigProviderProps {
  // Provider tarafından sarılacak alt bileşenler
  children: React.ReactNode;
}

// ConfigProvider: Yapılandırma Context'ini sağlayan provider bileşeni
// Tüm uygulamaya sistem ayarlarını ve tema yönetimini sunar
export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  // Sunucudan alınan sistem yapılandırması durumu
  const [config, setConfig] = useState<SystemConfig | null>(null);
  
  // API çağrısı sırasında true olan loading durumu
  const [loading, setLoading] = useState(false);
  
  // Kullanıcının tema seçmesine izin vermek için geçici override (null = sunucu ayarını kullan)
  const [overrideTheme, setOverrideTheme] = useState<ThemeMode | null>(null);

  // Sunucudan sistem yapılandırmasını alan API fonksiyonu
  const fetchConfig = async () => {
    try {
      setLoading(true);
      
      // API'den sistem yapılandırmasını al
      const res = await api.get<RawSystemConfig>("/config");
      
      // Ham veriyi normalleştir
      const normalized = normalizeConfig(res.data || {});
      setConfig(normalized);
    } catch (err) {
      console.error("Sistem ayarları alınırken hata:", err);
      // Hata durumunda config null kalır, normalizeConfig fallback sağlar
    } finally {
      setLoading(false);
    }
  };

  // Bileşen yüklenirken yapılandırmayı getir
  useEffect(() => {
    fetchConfig();
  }, []);

  // Document title'ı uygulamanın adı ile güncelle
  useEffect(() => {
    if (config?.appName) {
      document.title = config.appName;
    }
  }, [config?.appName]);

  // Tema modu: override varsa onu kullan, yoksa sunucu ayarını, hatta o da yoksa "light" kullan
  const themeMode: ThemeMode =
    overrideTheme || config?.theme || "light";

  // Material-UI temasını oluştur (tema moduna göre)
  // useMemo kullanarak performans optimize edilir (themeMode değiştiğinde yeniden hesaplanır)
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
        },
      }),
    [themeMode]
  );

  // Context'te sağlanacak değer (fonksiyonlar ve durumlar)
  const value: ConfigContextValue = {
    // Yapılandırma - yoksa normalizeConfig'ten fallback döner
    config: config || normalizeConfig(null),
    // Loading durumu
    loading,
    // Yapılandırmayı yeniden yüklemek için fonksiyon
    refreshConfig: fetchConfig,
    // Tema modunu geçici olarak değiştirmek için fonksiyon
    setThemeMode: (mode: ThemeMode) => setOverrideTheme(mode),
  };

  return (
    // Context Provider: value'u tüm alt bileşenlere ilet
    <ConfigContext.Provider value={value}>
      {/* Material-UI Tema Sağlayıcısı - tema tanımını uygulamaya aktar */}
      <ThemeProvider theme={muiTheme}>
        {/* CSS Sıfırlama - tarayıcı varsayılanlarını normalize et */}
        <CssBaseline />
        {/* Alt bileşenler */}
        {children}
      </ThemeProvider>
    </ConfigContext.Provider>
  );
};
