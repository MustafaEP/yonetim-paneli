// src/pages/system/components/GeneralSettings.tsx
import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  useTheme,
  alpha,
  Alert,
  Avatar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import ImageIcon from '@mui/icons-material/Image';
import BusinessIcon from '@mui/icons-material/Business';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import BuildIcon from '@mui/icons-material/Build';
import type { SystemSetting } from '../services/systemApi';
import { uploadLogo, uploadHeaderPaper } from '../services/systemApi';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import { useSystemSettings } from '../../../app/providers/SystemSettingsContext';

interface GeneralSettingsProps {
  settings: SystemSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  settings,
  onUpdate,
  loading = false,
}) => {
  const theme = useTheme();
  const toast = useToast();
  const { refreshSettings } = useSystemSettings();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeaderPaper, setUploadingHeaderPaper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerPaperInputRef = useRef<HTMLInputElement>(null);

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find((s) => s.key === key);
  };

  const getValue = (key: string): string => {
    return localSettings[key] !== undefined
      ? localSettings[key]
      : getSetting(key)?.value || '';
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await onUpdate(key, getValue(key));
      setLocalSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      toast.success('Ayar başarıyla güncellendi');
      await refreshSettings();
    } catch (error: unknown) {
      console.error('Ayar güncellenirken hata:', error);
      toast.error(getApiErrorMessage(error, 'Ayar güncellenirken bir hata oluştu'));
    } finally {
      setSaving(null);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingLogo(true);
    try {
      const logoUrl = await uploadLogo(file);
      await onUpdate('SITE_LOGO_URL', logoUrl);
      await refreshSettings();
      toast.success('Logo başarıyla yüklendi');
    } catch (error: unknown) {
      console.error('Logo yüklenirken hata:', error);
      toast.error(getApiErrorMessage(error, 'Logo yüklenirken bir hata oluştu'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleHeaderPaperUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // PDF, PNG veya JPG kabul et (PNG/JPG öneriliyor - daha hızlı)
    if (!file.type.match(/(pdf|png|jpg|jpeg)$/) && !file.name.match(/\.(pdf|png|jpg|jpeg)$/i)) {
      toast.error('Lütfen bir PDF, PNG veya JPG dosyası seçin (PNG/JPG öneriliyor)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
      return;
    }

    setUploadingHeaderPaper(true);
    try {
      const headerPaperUrl = await uploadHeaderPaper(file);
      await onUpdate('DOCUMENT_HEADER_PAPER_PATH', headerPaperUrl);
      await refreshSettings();
      toast.success('Antetli kağıt başarıyla yüklendi');
    } catch (error: unknown) {
      console.error('Antetli kağıt yüklenirken hata:', error);
      toast.error(getApiErrorMessage(error, 'Antetli kağıt yüklenirken bir hata oluştu'));
    } finally {
      setUploadingHeaderPaper(false);
      if (headerPaperInputRef.current) {
        headerPaperInputRef.current.value = '';
      }
    }
  };

  return (
    <Stack spacing={3}>
      {/* Sistem Kimliği */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BusinessIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Sistem Kimliği
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Temel tanımlama ve görüntülenme bilgileri
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Sistem Adı"
                value={getValue('SITE_NAME')}
                onChange={(e) => handleChange('SITE_NAME', e.target.value)}
                fullWidth
                size="small"
                helperText={getSetting('SITE_NAME')?.description || 'Sistemin görünen adı'}
              />
              {localSettings['SITE_NAME'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('SITE_NAME')}
                  disabled={saving === 'SITE_NAME'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'SITE_NAME' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Sistem Kısa Adı"
                value={getValue('SYSTEM_CODE')}
                onChange={(e) => handleChange('SYSTEM_CODE', e.target.value)}
                fullWidth
                size="small"
                helperText={getSetting('SYSTEM_CODE')?.description || 'Örn: sendika-core'}
                placeholder="sendika-core"
              />
              {localSettings['SYSTEM_CODE'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('SYSTEM_CODE')}
                  disabled={saving === 'SYSTEM_CODE'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'SYSTEM_CODE' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Sistem Versiyonu"
                value={getValue('SYSTEM_VERSION')}
                fullWidth
                size="small"
                disabled
                helperText="Otomatik yönetilir (salt okunur)"
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: alpha(theme.palette.action.disabledBackground, 0.3),
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Ortam Bilgisi</InputLabel>
                <Select
                  value={getValue('ENVIRONMENT')}
                  onChange={(e) => handleChange('ENVIRONMENT', e.target.value)}
                  label="Ortam Bilgisi"
                >
                  <MenuItem value="Production">Üretim</MenuItem>
                  <MenuItem value="Staging">Hazırlık</MenuItem>
                  <MenuItem value="Test">Test</MenuItem>
                </Select>
              </FormControl>
              {getSetting('ENVIRONMENT')?.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {getSetting('ENVIRONMENT')?.description}
                </Typography>
              )}
              {localSettings['ENVIRONMENT'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('ENVIRONMENT')}
                  disabled={saving === 'ENVIRONMENT'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'ENVIRONMENT' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Varsayılan Dil</InputLabel>
                <Select
                  value={getValue('DEFAULT_LANGUAGE')}
                  onChange={(e) => handleChange('DEFAULT_LANGUAGE', e.target.value)}
                  label="Varsayılan Dil"
                >
                  <MenuItem value="tr">Türkçe</MenuItem>
                  <MenuItem value="en" disabled>English (Yakında)</MenuItem>
                </Select>
              </FormControl>
              {getSetting('DEFAULT_LANGUAGE')?.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {getSetting('DEFAULT_LANGUAGE')?.description}
                </Typography>
              )}
              {localSettings['DEFAULT_LANGUAGE'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('DEFAULT_LANGUAGE')}
                  disabled={saving === 'DEFAULT_LANGUAGE'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'DEFAULT_LANGUAGE' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Saat Dilimi"
                value={getValue('TIMEZONE')}
                onChange={(e) => handleChange('TIMEZONE', e.target.value)}
                fullWidth
                size="small"
                helperText="Örn: Europe/Istanbul"
                placeholder="Europe/Istanbul"
              />
              {localSettings['TIMEZONE'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('TIMEZONE')}
                  disabled={saving === 'TIMEZONE'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'TIMEZONE' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}>
                Logo
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: 'flex-start' }}>
                <Box>
                  {(() => {
                    const logoUrl = getValue('SITE_LOGO_URL');
                    let logoSrc: string | null = null;
                    
                    if (logoUrl) {
                      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
                        logoSrc = logoUrl;
                      } else {
                        // Relative path ise, API base URL'ini kullan
                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
                          ? import.meta.env.VITE_API_BASE_URL 
                          : (import.meta.env.PROD ? window.location.origin : 'http://localhost:3000');
                        logoSrc = `${API_BASE_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
                      }
                    }

                    return logoSrc ? (
                      <Avatar
                        key={logoUrl}
                        src={logoSrc}
                        alt="Logo"
                        variant="rounded"
                        sx={{
                          width: 72,
                          height: 72,
                          border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
                          boxShadow: `0 2px 12px ${alpha(theme.palette.common.black, 0.08)}`,
                        }}
                        imgProps={{
                          onError: () => {
                            console.error('Logo yüklenemedi:', logoUrl);
                          },
                        }}
                      />
                    ) : (
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 72,
                          height: 72,
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`,
                        }}
                      >
                        <ImageIcon sx={{ color: theme.palette.text.secondary, fontSize: '2rem' }} />
                      </Avatar>
                    );
                  })()}
                </Box>
                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={uploadingLogo ? <CircularProgress size={16} /> : <UploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    size="small"
                  >
                    {uploadingLogo ? 'Yükleniyor...' : 'Logo Yükle'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    PNG, JPG veya SVG (Maksimum 5MB)
                  </Typography>
                  {getValue('SITE_LOGO_URL') && (
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: 'success.main', fontWeight: 500 }}>
                      ✓ Logo başarıyla yüklendi
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.secondary }}>
                Antetli Kağıt (PDF Arka Plan)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Üye dökümanları için kullanılacak antetli kağıt dosyası. Bu PDF dosyası tüm üye dökümanlarının arka planı olarak kullanılır.
                  </Typography>
                  <input
                    ref={headerPaperInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                    onChange={handleHeaderPaperUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={uploadingHeaderPaper ? <CircularProgress size={16} /> : <UploadIcon />}
                    onClick={() => headerPaperInputRef.current?.click()}
                    disabled={uploadingHeaderPaper}
                    size="small"
                  >
                    {uploadingHeaderPaper ? 'Yükleniyor...' : 'Antetli Kağıt Yükle'}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    PNG, JPG veya PDF formatı (PNG/JPG öneriliyor - daha hızlı, Maksimum 10MB)
                  </Typography>
                  {getValue('DOCUMENT_HEADER_PAPER_PATH') && (
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: 'success.main', fontWeight: 500 }}>
                      ✓ Antetli kağıt başarıyla yüklendi
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* İletişim & Kurumsal Bilgiler */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.03)} 0%, ${alpha(theme.palette.info.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ContactMailIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                İletişim & Kurumsal Bilgiler
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PDF, e-posta ve raporlarda kullanılır
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Kurumsal E-posta"
                value={getValue('CONTACT_EMAIL')}
                onChange={(e) => handleChange('CONTACT_EMAIL', e.target.value)}
                fullWidth
                size="small"
                type="email"
                helperText="Örn: info@sendika.org"
                placeholder="info@sendika.org"
              />
              {localSettings['CONTACT_EMAIL'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('CONTACT_EMAIL')}
                  disabled={saving === 'CONTACT_EMAIL'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'CONTACT_EMAIL' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Telefon"
                value={getValue('CONTACT_PHONE')}
                onChange={(e) => handleChange('CONTACT_PHONE', e.target.value)}
                fullWidth
                size="small"
                helperText="Kurumsal telefon numarası"
                placeholder="+90 (212) 123 45 67"
              />
              {localSettings['CONTACT_PHONE'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('CONTACT_PHONE')}
                  disabled={saving === 'CONTACT_PHONE'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'CONTACT_PHONE' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Adres"
                value={getValue('CONTACT_ADDRESS')}
                onChange={(e) => handleChange('CONTACT_ADDRESS', e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={3}
                helperText="Kurumsal adres (opsiyonel)"
                placeholder="Örn: Atatürk Bulvarı No: 123, Çankaya, Ankara"
              />
              {localSettings['CONTACT_ADDRESS'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('CONTACT_ADDRESS')}
                  disabled={saving === 'CONTACT_ADDRESS'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'CONTACT_ADDRESS' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Alt Bilgi (Footer) Metni"
                value={getValue('FOOTER_TEXT')}
                onChange={(e) => handleChange('FOOTER_TEXT', e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
                helperText="PDF ve rapor çıktılarında gösterilir"
                placeholder="© 2025 X Sendikası – Tüm hakları saklıdır"
              />
              {localSettings['FOOTER_TEXT'] !== undefined && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave('FOOTER_TEXT')}
                  disabled={saving === 'FOOTER_TEXT'}
                  sx={{ mt: 1 }}
                >
                  {saving === 'FOOTER_TEXT' ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Bakım Modu */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.warning.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BuildIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Bakım Modu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sistem bakım durumu ve mesajı
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={getValue('MAINTENANCE_MODE') === 'true'}
                onChange={(e) =>
                  handleChange('MAINTENANCE_MODE', e.target.checked ? 'true' : 'false')
                }
              />
            }
            label="Bakım modunu aktif et"
            sx={{ mb: 2 }}
          />

          {getValue('MAINTENANCE_MODE') === 'true' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bakım modu aktifken sadece ADMIN kullanıcıları erişebilir.
            </Alert>
          )}

          <TextField
            label="Bakım Mesajı"
            value={getValue('MAINTENANCE_MESSAGE')}
            onChange={(e) => handleChange('MAINTENANCE_MESSAGE', e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            helperText={getSetting('MAINTENANCE_MESSAGE')?.description}
          />

          {(localSettings['MAINTENANCE_MODE'] !== undefined ||
            localSettings['MAINTENANCE_MESSAGE'] !== undefined) && (
            <Button
              variant="contained"
              color={getValue('MAINTENANCE_MODE') === 'true' ? 'warning' : 'primary'}
              startIcon={<SaveIcon />}
              onClick={async () => {
                if (localSettings['MAINTENANCE_MODE'] !== undefined) {
                  await handleSave('MAINTENANCE_MODE');
                }
                if (localSettings['MAINTENANCE_MESSAGE'] !== undefined) {
                  await handleSave('MAINTENANCE_MESSAGE');
                }
              }}
              disabled={saving !== null}
              sx={{ mt: 2 }}
            >
              {saving !== null ? 'Kaydediliyor...' : 'Bakım Ayarlarını Kaydet'}
            </Button>
          )}
        </Box>
      </Card>
    </Stack>
  );
};

export default GeneralSettings;