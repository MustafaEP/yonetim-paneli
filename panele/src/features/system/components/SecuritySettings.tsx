// src/pages/system/components/SecuritySettings.tsx
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
  Divider,
  Button,
  Stack,
  Chip,
  Alert,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import TimerIcon from '@mui/icons-material/Timer';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import type { SystemSetting } from '../services/systemApi';

interface SecuritySettingsProps {
  settings?: SystemSetting[];
  onUpdate?: (key: string, value: string) => Promise<void>;
  loading?: boolean;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
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
      : getSetting(key)?.value || '';
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
    setSaving('all');
    try {
      await Promise.all(keys.map((key) => onUpdate(key, localSettings[key])));
      setLocalSettings({});
    } catch (error) {
      console.error('Ayarlar güncellenirken hata:', error);
    } finally {
      setSaving(null);
    }
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

      <Grid container spacing={3}>
        {/* Şifre Politikası */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
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
                  <LockIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Şifre Politikası
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Şifre gereksinimleri ve kuralları
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>

              <Stack spacing={2.5}>
                <TextField
                  label="Minimum Şifre Uzunluğu"
                  type="number"
                  value={getValue('SECURITY_PASSWORD_MIN_LENGTH')}
                  onChange={(e) => handleChange('SECURITY_PASSWORD_MIN_LENGTH', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={!onUpdate || loading}
                  helperText={getSetting('SECURITY_PASSWORD_MIN_LENGTH')?.description}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">karakter</InputAdornment>,
                  }}
                />
                {localSettings['SECURITY_PASSWORD_MIN_LENGTH'] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" />
                )}

              <Divider />

              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('SECURITY_PASSWORD_REQUIRE_UPPERCASE') === 'true'}
                    onChange={(e) =>
                      handleChange('SECURITY_PASSWORD_REQUIRE_UPPERCASE', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!onUpdate || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Büyük Harf Zorunlu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getSetting('SECURITY_PASSWORD_REQUIRE_UPPERCASE')?.description}
                    </Typography>
                  </Box>
                }
              />
              {localSettings['SECURITY_PASSWORD_REQUIRE_UPPERCASE'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('SECURITY_PASSWORD_REQUIRE_LOWERCASE') === 'true'}
                    onChange={(e) =>
                      handleChange('SECURITY_PASSWORD_REQUIRE_LOWERCASE', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!onUpdate || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Küçük Harf Zorunlu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getSetting('SECURITY_PASSWORD_REQUIRE_LOWERCASE')?.description}
                    </Typography>
                  </Box>
                }
              />
              {localSettings['SECURITY_PASSWORD_REQUIRE_LOWERCASE'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('SECURITY_PASSWORD_REQUIRE_NUMBER') === 'true'}
                    onChange={(e) =>
                      handleChange('SECURITY_PASSWORD_REQUIRE_NUMBER', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!onUpdate || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Rakam Zorunlu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getSetting('SECURITY_PASSWORD_REQUIRE_NUMBER')?.description}
                    </Typography>
                  </Box>
                }
              />
              {localSettings['SECURITY_PASSWORD_REQUIRE_NUMBER'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('SECURITY_PASSWORD_REQUIRE_SPECIAL') === 'true'}
                    onChange={(e) =>
                      handleChange('SECURITY_PASSWORD_REQUIRE_SPECIAL', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!onUpdate || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Özel Karakter Zorunlu
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {getSetting('SECURITY_PASSWORD_REQUIRE_SPECIAL')?.description}
                    </Typography>
                  </Box>
                }
              />
              {localSettings['SECURITY_PASSWORD_REQUIRE_SPECIAL'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
              )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Oturum ve Erişim Kontrolü */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
              overflow: 'hidden',
              height: '100%',
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
                  <TimerIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Oturum Yönetimi
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Oturum zaman aşımı ve erişim kontrolleri
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>

              <Stack spacing={2.5}>
                <TextField
                  label="Oturum Zaman Aşımı"
                  type="number"
                  value={getValue('SECURITY_SESSION_TIMEOUT')}
                  onChange={(e) => handleChange('SECURITY_SESSION_TIMEOUT', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={!onUpdate || loading}
                  helperText={getSetting('SECURITY_SESSION_TIMEOUT')?.description || 'Dakika cinsinden'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">dakika</InputAdornment>,
                  }}
                />
                {localSettings['SECURITY_SESSION_TIMEOUT'] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" />
                )}

                <Divider />

                <TextField
                  label="Maksimum Giriş Denemesi"
                  type="number"
                  value={getValue('SECURITY_MAX_LOGIN_ATTEMPTS')}
                  onChange={(e) => handleChange('SECURITY_MAX_LOGIN_ATTEMPTS', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={!onUpdate || loading}
                  helperText={getSetting('SECURITY_MAX_LOGIN_ATTEMPTS')?.description}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">deneme</InputAdornment>,
                  }}
                />
                {localSettings['SECURITY_MAX_LOGIN_ATTEMPTS'] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" />
                )}

                <TextField
                  label="Hesap Kilitlenme Süresi"
                  type="number"
                  value={getValue('SECURITY_LOCKOUT_DURATION')}
                  onChange={(e) => handleChange('SECURITY_LOCKOUT_DURATION', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={!onUpdate || loading}
                  helperText={getSetting('SECURITY_LOCKOUT_DURATION')?.description || 'Dakika cinsinden'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">dakika</InputAdornment>,
                  }}
                />
                {localSettings['SECURITY_LOCKOUT_DURATION'] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" />
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* İki Faktörlü Kimlik Doğrulama */}
        <Grid item xs={12}>
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
                  <VerifiedUserIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    İki Faktörlü Kimlik Doğrulama (2FA)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ek güvenlik katmanı için 2FA ayarları
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>

              <Stack spacing={2.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue('SECURITY_2FA_ENABLED') === 'true'}
                      onChange={(e) =>
                        handleChange('SECURITY_2FA_ENABLED', e.target.checked ? 'true' : 'false')
                      }
                      disabled={!onUpdate || loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        İki Faktörlü Kimlik Doğrulamayı Etkinleştir
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getSetting('SECURITY_2FA_ENABLED')?.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
                {localSettings['SECURITY_2FA_ENABLED'] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
                )}

                {getValue('SECURITY_2FA_ENABLED') === 'true' && (
                  <Alert severity="info">
                    İki faktörlü kimlik doğrulama aktif edildiğinde, kullanıcılar giriş yaparken ek bir doğrulama kodu girmeleri gerekecektir.
                  </Alert>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default SecuritySettings;

