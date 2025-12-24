// src/pages/system/components/IntegrationSettings.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  useTheme,
  alpha,
  Button,
  Stack,
  Chip,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import ApiIcon from '@mui/icons-material/Api';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import type { SystemSetting } from '../../../api/systemApi';

interface IntegrationSettingsProps {
  settings?: SystemSetting[];
  onUpdate?: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const IntegrationSettings: React.FC<IntegrationSettingsProps> = ({
  settings = [],
  onUpdate,
  loading = false,
}) => {
  const theme = useTheme();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find((s) => s.key === key);
  };

  const getValue = (key: string): string => {
    const defaultValue = key.startsWith('NOTIFICATION_') ? 'false' : '';
    return localSettings[key] !== undefined
      ? localSettings[key]
      : getSetting(key)?.value || defaultValue;
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    if (!onUpdate) return;
    
    setSaving(key);
    try {
      await onUpdate(key, getValue(key));
      setLocalSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (error) {
      console.error('Ayar güncellenirken hata:', error);
      throw error;
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    if (!onUpdate) return;
    
    const keys = Object.keys(localSettings);
    if (keys.length === 0) return;
    
    setSaving('all');
    try {
      const results = await Promise.allSettled(
        keys.map((key) => onUpdate(key, localSettings[key]))
      );
      
      const successfulKeys = keys.filter((key, index) => 
        results[index].status === 'fulfilled'
      );
      
      if (successfulKeys.length > 0) {
        setLocalSettings((prev) => {
          const next = { ...prev };
          successfulKeys.forEach((key) => delete next[key]);
          return next;
        });
      }
      
      const failedResults = results.filter((r) => r.status === 'rejected');
      if (failedResults.length > 0) {
        throw new Error(`${failedResults.length} ayar güncellenemedi`);
      }
    } catch (error) {
      console.error('Ayarlar güncellenirken hata:', error);
    } finally {
      setSaving(null);
    }
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasUnsavedChanges = Object.keys(localSettings).length > 0;

  return (
    <Stack spacing={3}>
      {/* Üst Aksiyon Bölümü */}
      {hasUnsavedChanges && onUpdate && (
        <Alert 
          severity="info"
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={saving === 'all'}
            >
              {saving === 'all' ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
            </Button>
          }
        >
          Kaydedilmemiş değişiklikler var
        </Alert>
      )}

      {/* Bildirim Kanalları */}
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
              <NotificationsIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Bildirim Kanalları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Hangi kanallardan bildirim gönderilebileceğini belirleyin
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {/* E-posta Bildirimleri */}
            <Box>
              {(() => {
                const integrationEmailEnabled = getValue('INTEGRATION_EMAIL_ENABLED') === 'true';
                const notificationEmailEnabled = getValue('NOTIFICATION_EMAIL_ENABLED') === 'true';
                const isDisabled = !onUpdate || loading || !integrationEmailEnabled;

                return (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationEmailEnabled && integrationEmailEnabled}
                          onChange={(e) => {
                            if (integrationEmailEnabled) {
                              handleChange('NOTIFICATION_EMAIL_ENABLED', e.target.checked ? 'true' : 'false');
                            }
                          }}
                          disabled={isDisabled}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <EmailIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              E-posta Bildirimleri
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {!integrationEmailEnabled
                                ? 'E-posta entegrasyonu aktif olmalıdır'
                                : 'E-posta ile bildirim gönder'}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                    {!integrationEmailEnabled && (
                      <Alert severity="warning" sx={{ mt: 1.5, ml: 5 }}>
                        E-posta entegrasyonunu önce aktifleştirmelisiniz.
                      </Alert>
                    )}
                    {localSettings['NOTIFICATION_EMAIL_ENABLED'] !== undefined && (
                      <Chip
                        label="Kaydedilmemiş"
                        size="small"
                        color="warning"
                        sx={{ mt: 1, ml: 5 }}
                      />
                    )}
                  </>
                );
              })()}
            </Box>

            <Divider />

            {/* SMS Bildirimleri */}
            <Box>
              {(() => {
                const integrationSmsEnabled = getValue('INTEGRATION_SMS_ENABLED') === 'true';
                const notificationSmsEnabled = getValue('NOTIFICATION_SMS_ENABLED') === 'true';
                const isDisabled = !onUpdate || loading || !integrationSmsEnabled;

                return (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationSmsEnabled && integrationSmsEnabled}
                          onChange={(e) => {
                            if (integrationSmsEnabled) {
                              handleChange('NOTIFICATION_SMS_ENABLED', e.target.checked ? 'true' : 'false');
                            }
                          }}
                          disabled={isDisabled}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <SmsIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              SMS Bildirimleri
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {!integrationSmsEnabled
                                ? 'SMS entegrasyonu aktif olmalıdır'
                                : 'SMS ile bildirim gönder'}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%' }}
                    />
                    {!integrationSmsEnabled && (
                      <Alert severity="warning" sx={{ mt: 1.5, ml: 5 }}>
                        SMS entegrasyonunu önce aktifleştirmelisiniz.
                      </Alert>
                    )}
                    {localSettings['NOTIFICATION_SMS_ENABLED'] !== undefined && (
                      <Chip
                        label="Kaydedilmemiş"
                        size="small"
                        color="warning"
                        sx={{ mt: 1, ml: 5 }}
                      />
                    )}
                  </>
                );
              })()}
            </Box>

            <Divider />

            {/* Uygulama İçi Bildirimler */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('NOTIFICATION_IN_APP_ENABLED') === 'true'}
                    onChange={(e) =>
                      handleChange('NOTIFICATION_IN_APP_ENABLED', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!onUpdate || loading}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <NotificationsActiveIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Uygulama İçi Bildirimler
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Panel içinde bildirim göster
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
              {localSettings['NOTIFICATION_IN_APP_ENABLED'] !== undefined && (
                <Chip
                  label="Kaydedilmemiş"
                  size="small"
                  color="warning"
                  sx={{ mt: 1, ml: 5 }}
                />
              )}
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* E-posta Entegrasyonu (SMTP) */}
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
              <EmailIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                E-posta Entegrasyonu (SMTP)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SMTP sunucu ayarları ve e-posta gönderim konfigürasyonu
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={getValue('INTEGRATION_EMAIL_ENABLED') === 'true'}
                  onChange={(e) => {
                    const isEnabled = e.target.checked;
                    handleChange('INTEGRATION_EMAIL_ENABLED', isEnabled ? 'true' : 'false');
                    if (!isEnabled) {
                      handleChange('NOTIFICATION_EMAIL_ENABLED', 'false');
                    }
                  }}
                  disabled={!onUpdate || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    E-posta Entegrasyonunu Etkinleştir
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    E-posta gönderimini aktif/pasif et
                  </Typography>
                </Box>
              }
            />
            {localSettings['INTEGRATION_EMAIL_ENABLED'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" />
            )}

            {getValue('INTEGRATION_EMAIL_ENABLED') === 'true' && (
              <>
                <Divider />
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SMTP Sunucu"
                      value={getValue('INTEGRATION_EMAIL_SMTP_HOST')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_SMTP_HOST', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Örn: smtp.gmail.com"
                      placeholder="smtp.gmail.com"
                    />
                    {localSettings['INTEGRATION_EMAIL_SMTP_HOST'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SMTP Port"
                      type="number"
                      value={getValue('INTEGRATION_EMAIL_SMTP_PORT')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_SMTP_PORT', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Genellikle 587 veya 465"
                      placeholder="587"
                    />
                    {localSettings['INTEGRATION_EMAIL_SMTP_PORT'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Gönderen E-posta"
                      type="email"
                      value={getValue('INTEGRATION_EMAIL_FROM')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_FROM', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Gönderen e-posta adresi"
                      placeholder="noreply@example.com"
                    />
                    {localSettings['INTEGRATION_EMAIL_FROM'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Gönderen Adı"
                      value={getValue('INTEGRATION_EMAIL_FROM_NAME')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_FROM_NAME', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Gönderen görünen adı"
                      placeholder="Sendika Yönetim Sistemi"
                    />
                    {localSettings['INTEGRATION_EMAIL_FROM_NAME'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SMTP Kullanıcı Adı"
                      value={getValue('INTEGRATION_EMAIL_SMTP_USER')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_SMTP_USER', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="SMTP kullanıcı adı"
                      placeholder="user@example.com"
                    />
                    {localSettings['INTEGRATION_EMAIL_SMTP_USER'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SMTP Şifre"
                      type={showPasswords['INTEGRATION_EMAIL_SMTP_PASS'] ? 'text' : 'password'}
                      value={getValue('INTEGRATION_EMAIL_SMTP_PASS')}
                      onChange={(e) => handleChange('INTEGRATION_EMAIL_SMTP_PASS', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="SMTP şifresi"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('INTEGRATION_EMAIL_SMTP_PASS')}
                              edge="end"
                              size="small"
                            >
                              {showPasswords['INTEGRATION_EMAIL_SMTP_PASS'] ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {localSettings['INTEGRATION_EMAIL_SMTP_PASS'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={getValue('INTEGRATION_EMAIL_SMTP_SECURE') === 'true'}
                          onChange={(e) =>
                            handleChange('INTEGRATION_EMAIL_SMTP_SECURE', e.target.checked ? 'true' : 'false')
                          }
                          disabled={!onUpdate || loading}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            TLS/SSL Kullan
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Güvenli bağlantı için TLS/SSL
                          </Typography>
                        </Box>
                      }
                    />
                    {localSettings['INTEGRATION_EMAIL_SMTP_SECURE'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 2 }} />
                    )}
                  </Grid>
                </Grid>
              </>
            )}
          </Stack>
        </Box>
      </Card>

      {/* SMS Entegrasyonu */}
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.03)} 0%, ${alpha(theme.palette.success.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SmsIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                SMS Entegrasyonu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                SMS servis sağlayıcı ayarları ve API konfigürasyonu
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={getValue('INTEGRATION_SMS_ENABLED') === 'true'}
                  onChange={(e) => {
                    const isEnabled = e.target.checked;
                    handleChange('INTEGRATION_SMS_ENABLED', isEnabled ? 'true' : 'false');
                    if (!isEnabled) {
                      handleChange('NOTIFICATION_SMS_ENABLED', 'false');
                    }
                  }}
                  disabled={!onUpdate || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    SMS Entegrasyonunu Etkinleştir
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SMS gönderimini aktif/pasif et
                  </Typography>
                </Box>
              }
            />
            {localSettings['INTEGRATION_SMS_ENABLED'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" />
            )}

            {getValue('INTEGRATION_SMS_ENABLED') === 'true' && (
              <>
                <Divider />
                <Grid container spacing={2.5}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="SMS Servis Sağlayıcı"
                      value={getValue('INTEGRATION_SMS_PROVIDER')}
                      onChange={(e) => handleChange('INTEGRATION_SMS_PROVIDER', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Örn: NetGSM, İleti Merkezi"
                      placeholder="NetGSM"
                    />
                    {localSettings['INTEGRATION_SMS_PROVIDER'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="API Endpoint"
                      value={getValue('INTEGRATION_SMS_API_URL')}
                      onChange={(e) => handleChange('INTEGRATION_SMS_API_URL', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="SMS API endpoint URL"
                      placeholder="https://api.example.com/sms"
                    />
                    {localSettings['INTEGRATION_SMS_API_URL'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="API Kullanıcı Adı / Key"
                      value={getValue('INTEGRATION_SMS_API_USER')}
                      onChange={(e) => handleChange('INTEGRATION_SMS_API_USER', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="API kullanıcı adı veya key"
                    />
                    {localSettings['INTEGRATION_SMS_API_USER'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="API Şifre / Secret"
                      type={showPasswords['INTEGRATION_SMS_API_PASS'] ? 'text' : 'password'}
                      value={getValue('INTEGRATION_SMS_API_PASS')}
                      onChange={(e) => handleChange('INTEGRATION_SMS_API_PASS', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="API şifre veya secret"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility('INTEGRATION_SMS_API_PASS')}
                              edge="end"
                              size="small"
                            >
                              {showPasswords['INTEGRATION_SMS_API_PASS'] ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    {localSettings['INTEGRATION_SMS_API_PASS'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Gönderen Numarası / Başlık"
                      value={getValue('INTEGRATION_SMS_SENDER')}
                      onChange={(e) => handleChange('INTEGRATION_SMS_SENDER', e.target.value)}
                      fullWidth
                      size="small"
                      disabled={!onUpdate || loading}
                      helperText="Gönderen numara veya başlık"
                      placeholder="SENDIKA"
                    />
                    {localSettings['INTEGRATION_SMS_SENDER'] !== undefined && (
                      <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
                    )}
                  </Grid>
                </Grid>
              </>
            )}
          </Stack>
        </Box>
      </Card>

      {/* API Entegrasyonları (Yakında) */}
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          borderRadius: 2,
          overflow: 'hidden',
          opacity: 0.7,
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ApiIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                  API Entegrasyonları
                </Typography>
                <Chip 
                  label="Yakında" 
                  size="small" 
                  color="info" 
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }} 
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Webhook URL'leri ve harici API entegrasyon ayarları
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Bu özellik yakında eklenecek
            </Typography>
            <Typography variant="body2">
              Harici sistemlerle entegrasyon kurabilecek, webhook URL'leri ile önemli olayları 
              otomatik bildirebileceksiniz.
            </Typography>
          </Alert>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Webhook URL"
                value=""
                fullWidth
                size="small"
                disabled
                helperText="Yakında eklenecek"
                placeholder="https://api.example.com/webhook"
              />
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Bilgilendirme */}
      <Alert severity="info" icon={<IntegrationInstructionsIcon />}>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
          Bildirim ve Entegrasyon Kullanımı
        </Typography>
        <Typography variant="body2">
          Bildirim kanallarını etkinleştirdikten sonra entegrasyon ayarlarını yapılandırın. 
          Manuel bildirim göndermek için <strong>Bildirimler</strong> sayfasını kullanabilirsiniz.
        </Typography>
      </Alert>
    </Stack>
  );
};

export default IntegrationSettings;