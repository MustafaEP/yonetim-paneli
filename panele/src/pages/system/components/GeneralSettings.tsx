// src/pages/system/components/GeneralSettings.tsx
import React, { useState } from 'react';
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
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import UploadIcon from '@mui/icons-material/Upload';
import type { SystemSetting } from '../../../api/systemApi';

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
    } finally {
      setSaving(null);
    }
  };

  const siteName = getSetting('SITE_NAME');
  const siteLogo = getSetting('SITE_LOGO_URL');
  const defaultLanguage = getSetting('DEFAULT_LANGUAGE');
  const timezone = getSetting('TIMEZONE');
  const dateFormat = getSetting('DATE_FORMAT');
  const currency = getSetting('DEFAULT_CURRENCY');
  const maintenanceMode = getSetting('MAINTENANCE_MODE');
  const maintenanceMessage = getSetting('MAINTENANCE_MESSAGE');

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Genel Sistem Ayarları
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sistemin temel kimliği ve davranış ayarları
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sistem Kimliği */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Sistem Kimliği
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Sistem Adı"
                  value={getValue('SITE_NAME')}
                  onChange={(e) => handleChange('SITE_NAME', e.target.value)}
                  fullWidth
                  helperText={siteName?.description}
                />
                {localSettings['SITE_NAME'] !== undefined && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('SITE_NAME')}
                    disabled={saving === 'SITE_NAME'}
                    sx={{ mt: 1 }}
                  >
                    Kaydet
                  </Button>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Logo URL (Light)"
                  value={getValue('SITE_LOGO_URL')}
                  onChange={(e) => handleChange('SITE_LOGO_URL', e.target.value)}
                  fullWidth
                  helperText={siteLogo?.description}
                />
                {localSettings['SITE_LOGO_URL'] !== undefined && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('SITE_LOGO_URL')}
                    disabled={saving === 'SITE_LOGO_URL'}
                    sx={{ mt: 1 }}
                  >
                    Kaydet
                  </Button>
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Lokalizasyon */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Lokalizasyon
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Varsayılan Dil"
                  value={getValue('DEFAULT_LANGUAGE')}
                  onChange={(e) => handleChange('DEFAULT_LANGUAGE', e.target.value)}
                  fullWidth
                  select
                  SelectProps={{ native: true }}
                  helperText={defaultLanguage?.description}
                >
                  <option value="tr">Türkçe (TR)</option>
                  <option value="en">English (EN)</option>
                </TextField>
                {localSettings['DEFAULT_LANGUAGE'] !== undefined && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('DEFAULT_LANGUAGE')}
                    disabled={saving === 'DEFAULT_LANGUAGE'}
                    sx={{ mt: 1 }}
                  >
                    Kaydet
                  </Button>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Saat Dilimi"
                  value={getValue('TIMEZONE')}
                  onChange={(e) => handleChange('TIMEZONE', e.target.value)}
                  fullWidth
                  helperText={timezone?.description}
                />
                {localSettings['TIMEZONE'] !== undefined && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('TIMEZONE')}
                    disabled={saving === 'TIMEZONE'}
                    sx={{ mt: 1 }}
                  >
                    Kaydet
                  </Button>
                )}
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Tarih Formatı"
                  value={getValue('DATE_FORMAT')}
                  onChange={(e) => handleChange('DATE_FORMAT', e.target.value)}
                  fullWidth
                  helperText={dateFormat?.description}
                />
                {localSettings['DATE_FORMAT'] !== undefined && (
                  <Button
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => handleSave('DATE_FORMAT')}
                    disabled={saving === 'DATE_FORMAT'}
                    sx={{ mt: 1 }}
                  >
                    Kaydet
                  </Button>
                )}
              </Grid>
            </Grid>
          </Card>
        </Grid>

        {/* Bakım Modu */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              p: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Bakım Modu
            </Typography>

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
                Bakım modu aktifken sadece ADMIN kullanıcıları ve IP whitelist erişebilir.
              </Alert>
            )}

            <TextField
              label="Bakım Mesajı"
              value={getValue('MAINTENANCE_MESSAGE')}
              onChange={(e) => handleChange('MAINTENANCE_MESSAGE', e.target.value)}
              fullWidth
              multiline
              rows={3}
              helperText={maintenanceMessage?.description}
              sx={{ mb: 2 }}
            />

            {(localSettings['MAINTENANCE_MODE'] !== undefined ||
              localSettings['MAINTENANCE_MESSAGE'] !== undefined) && (
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => {
                  if (localSettings['MAINTENANCE_MODE'] !== undefined) {
                    handleSave('MAINTENANCE_MODE');
                  }
                  if (localSettings['MAINTENANCE_MESSAGE'] !== undefined) {
                    handleSave('MAINTENANCE_MESSAGE');
                  }
                }}
                disabled={saving !== null}
              >
                Bakım Ayarlarını Kaydet
              </Button>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GeneralSettings;

