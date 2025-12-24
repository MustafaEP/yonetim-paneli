// src/pages/system/components/NotificationsSettings.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  useTheme,
  alpha,
  Button,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import type { SystemSetting } from '../../../api/systemApi';

interface NotificationsSettingsProps {
  settings?: SystemSetting[];
  onUpdate?: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const NotificationsSettings: React.FC<NotificationsSettingsProps> = ({
  settings = [],
  onUpdate,
  loading = false,
}) => {
  const theme = useTheme();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getSetting = (key: string): SystemSetting | undefined => {
    return settings.find((s) => s.key === key);
  };

  const getValue = (key: string): string => {
    return localSettings[key] !== undefined
      ? localSettings[key]
      : getSetting(key)?.value || 'false';
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
      // Her bir ayarı ayrı ayrı güncelle, başarılı olanları temizle
      const results = await Promise.allSettled(
        keys.map((key) => onUpdate(key, localSettings[key]))
      );
      
      // Başarılı olanları localSettings'den kaldır
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
      
      // Hata varsa fırlat (SystemSettingsPage'deki handleUpdate zaten toast gösteriyor)
      const failedResults = results.filter((r) => r.status === 'rejected');
      if (failedResults.length > 0) {
        throw new Error(`${failedResults.length} ayar güncellenemedi`);
      }
    } catch (error) {
      console.error('Ayarlar güncellenirken hata:', error);
      // Hata durumunda localSettings'i koru, böylece kullanıcı tekrar deneyebilir
    } finally {
      setSaving(null);
    }
  };

  const hasUnsavedChanges = Object.keys(localSettings).length > 0;

  // Bildirim kanal ayarları
  const emailEnabled = getSetting('NOTIFICATION_EMAIL_ENABLED');
  const smsEnabled = getSetting('NOTIFICATION_SMS_ENABLED');
  const inAppEnabled = getSetting('NOTIFICATION_IN_APP_ENABLED');

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Bildirim Ayarları
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sistem geneli bildirim kanalları ayarları
          </Typography>
        </Box>
        {hasUnsavedChanges && onUpdate && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={saving === 'all'}
          >
            {saving === 'all' ? 'Kaydediliyor...' : 'Tümünü Kaydet'}
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Bildirim Kanalları */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                }}
              >
                <NotificationsIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Bildirim Kanalları
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hangi kanallardan bildirim gönderilebileceğini belirleyin
                </Typography>
              </Box>
            </Box>

            <Stack spacing={2.5}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue('NOTIFICATION_EMAIL_ENABLED') === 'true'}
                      onChange={(e) =>
                        handleChange('NOTIFICATION_EMAIL_ENABLED', e.target.checked ? 'true' : 'false')
                      }
                      disabled={!onUpdate || loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          E-posta Bildirimleri
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {emailEnabled?.description || 'E-posta bildirimleri aktif/pasif'}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                />
                {localSettings['NOTIFICATION_EMAIL_ENABLED'] !== undefined && (
                  <Chip
                    label="Kaydedilmemiş"
                    size="small"
                    color="warning"
                    sx={{ mt: 1, ml: 5 }}
                  />
                )}
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue('NOTIFICATION_SMS_ENABLED') === 'true'}
                      onChange={(e) =>
                        handleChange('NOTIFICATION_SMS_ENABLED', e.target.checked ? 'true' : 'false')
                      }
                      disabled={!onUpdate || loading}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmsIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          SMS Bildirimleri
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {smsEnabled?.description || 'SMS bildirimleri aktif/pasif'}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
                />
                {localSettings['NOTIFICATION_SMS_ENABLED'] !== undefined && (
                  <Chip
                    label="Kaydedilmemiş"
                    size="small"
                    color="warning"
                    sx={{ mt: 1, ml: 5 }}
                  />
                )}
              </Box>

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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsActiveIcon sx={{ fontSize: '1.25rem', color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Uygulama İçi Bildirimler
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {inAppEnabled?.description || 'Uygulama içi bildirimler aktif/pasif'}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
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
          </Card>
        </Grid>


        {/* Bilgilendirme */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<NotificationsIcon />}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Bildirim Gönderme
            </Typography>
            <Typography variant="body2">
              Manuel bildirim göndermek için{' '}
              <strong>Bildirimler</strong> sayfasını kullanabilirsiniz. Bu ayarlar sistem geneli bildirim kanallarını kontrol eder.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationsSettings;

