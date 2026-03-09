// src/features/system/components/DuesSettings.tsx
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
  Alert,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalculateIcon from '@mui/icons-material/Calculate';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import type { SystemSetting } from '../services/systemApi';

interface DuesSettingsProps {
  settings: SystemSetting[];
  onUpdate: (key: string, value: string) => Promise<void>;
  loading?: boolean;
  canManage?: boolean;
}

const DuesSettings: React.FC<DuesSettingsProps> = ({
  settings,
  onUpdate,
  loading = false,
  canManage = true,
}) => {
  const theme = useTheme();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getSetting = (key: string): SystemSetting | undefined =>
    settings.find((s) => s.key === key);

  const getDefaultValue = (key: string): string => {
    const defaults: Record<string, string> = {
      DUES_DEFAULT_AMOUNT: '0',
      DUES_PAYMENT_PERIOD: 'MONTHLY',
      DUES_PAYMENT_DUE_DAY: '5',
      DUES_LATE_PENALTY_RATE: '0',
      DUES_AUTO_CALCULATION_ENABLED: 'false',
      DUES_BRANCH_SHARE_PERCENT: '0',
      DUES_CURRENCY: 'TRY',
    };
    return defaults[key] ?? '';
  };

  const getValue = (key: string): string => {
    if (localSettings[key] !== undefined) return localSettings[key];
    return getSetting(key)?.value ?? getDefaultValue(key);
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    if (!canManage) return;
    setSaving(key);
    try {
      await onUpdate(key, getValue(key));
      setLocalSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    if (!canManage) return;
    const keys = Object.keys(localSettings);
    if (keys.length === 0) return;
    setSaving('all');
    try {
      const results = await Promise.allSettled(
        keys.map((key) => onUpdate(key, localSettings[key])),
      );
      const successfulKeys = keys.filter((_, i) => results[i].status === 'fulfilled');
      if (successfulKeys.length > 0) {
        setLocalSettings((prev) => {
          const next = { ...prev };
          successfulKeys.forEach((key) => delete next[key]);
          return next;
        });
      }
    } finally {
      setSaving(null);
    }
  };

  const hasUnsavedChanges = Object.keys(localSettings).length > 0;
  const isDisabled = !canManage || loading;

  const cardHeaderSx = {
    p: 2.5,
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  };

  const iconBoxSx = (color: string, darkColor: string) => ({
    width: 36,
    height: 36,
    borderRadius: 1.5,
    background: `linear-gradient(135deg, ${color} 0%, ${darkColor} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  return (
    <Stack spacing={3}>
      {hasUnsavedChanges && canManage && (
        <Alert
          severity="info"
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={saving === 'all' ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
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
        {/* Genel Aidat Ayarları */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                ...cardHeaderSx,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={iconBoxSx(theme.palette.primary.main, theme.palette.primary.dark)}>
                  <AccountBalanceIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Genel Aidat Ayarları
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Temel aidat tutarı ve para birimi
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Varsayılan Aidat Tutarı"
                  type="number"
                  value={getValue('DUES_DEFAULT_AMOUNT')}
                  onChange={(e) => handleChange('DUES_DEFAULT_AMOUNT', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_DEFAULT_AMOUNT')?.description ||
                    'Üyelerin ödeyeceği varsayılan aylık aidat tutarı'
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {getValue('DUES_CURRENCY') || 'TRY'}
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                {localSettings['DUES_DEFAULT_AMOUNT'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_DEFAULT_AMOUNT' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_DEFAULT_AMOUNT')}
                    disabled={saving === 'DUES_DEFAULT_AMOUNT'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_DEFAULT_AMOUNT' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}

                <Divider />

                <TextField
                  label="Para Birimi"
                  select
                  value={getValue('DUES_CURRENCY')}
                  onChange={(e) => handleChange('DUES_CURRENCY', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_CURRENCY')?.description || 'Aidat ödemelerinde kullanılacak para birimi'
                  }
                >
                  <MenuItem value="TRY">TRY — Türk Lirası</MenuItem>
                  <MenuItem value="USD">USD — Amerikan Doları</MenuItem>
                  <MenuItem value="EUR">EUR — Euro</MenuItem>
                </TextField>
                {localSettings['DUES_CURRENCY'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_CURRENCY' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_CURRENCY')}
                    disabled={saving === 'DUES_CURRENCY'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_CURRENCY' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Ödeme Periyodu Ayarları */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                ...cardHeaderSx,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.03)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={iconBoxSx(theme.palette.secondary.main, theme.palette.secondary.dark)}>
                  <PaymentsIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Ödeme Periyodu
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aidat ödeme sıklığı ve vade günü
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Ödeme Periyodu"
                  select
                  value={getValue('DUES_PAYMENT_PERIOD')}
                  onChange={(e) => handleChange('DUES_PAYMENT_PERIOD', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_PAYMENT_PERIOD')?.description || 'Aidat ödemelerinin sıklığı'
                  }
                >
                  <MenuItem value="MONTHLY">Aylık</MenuItem>
                  <MenuItem value="QUARTERLY">3 Aylık</MenuItem>
                  <MenuItem value="SEMI_ANNUAL">6 Aylık</MenuItem>
                  <MenuItem value="YEARLY">Yıllık</MenuItem>
                </TextField>
                {localSettings['DUES_PAYMENT_PERIOD'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_PAYMENT_PERIOD' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_PAYMENT_PERIOD')}
                    disabled={saving === 'DUES_PAYMENT_PERIOD'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_PAYMENT_PERIOD' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}

                <Divider />

                <TextField
                  label="Ödeme Vade Günü"
                  type="number"
                  value={getValue('DUES_PAYMENT_DUE_DAY')}
                  onChange={(e) => handleChange('DUES_PAYMENT_DUE_DAY', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_PAYMENT_DUE_DAY')?.description ||
                    'Her ayın kaçında ödeme vadesi dolacak (1-31)'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">. gün</InputAdornment>,
                  }}
                  inputProps={{ min: 1, max: 31 }}
                />
                {localSettings['DUES_PAYMENT_DUE_DAY'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_PAYMENT_DUE_DAY' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_PAYMENT_DUE_DAY')}
                    disabled={saving === 'DUES_PAYMENT_DUE_DAY'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_PAYMENT_DUE_DAY' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Hesaplama ve Paylaşım */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                ...cardHeaderSx,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.03)} 0%, ${alpha(theme.palette.success.light, 0.02)} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={iconBoxSx(theme.palette.success.main, theme.palette.success.dark)}>
                  <CalculateIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Hesaplama & Paylaşım
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Otomatik hesaplama ve şube payı ayarları
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue('DUES_AUTO_CALCULATION_ENABLED') === 'true'}
                      onChange={(e) =>
                        handleChange(
                          'DUES_AUTO_CALCULATION_ENABLED',
                          e.target.checked ? 'true' : 'false',
                        )
                      }
                      disabled={isDisabled}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Otomatik Hesaplama
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getSetting('DUES_AUTO_CALCULATION_ENABLED')?.description ||
                          'Aidat tahakkuklarını otomatik olarak hesapla'}
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
                {localSettings['DUES_AUTO_CALCULATION_ENABLED'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_AUTO_CALCULATION_ENABLED' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_AUTO_CALCULATION_ENABLED')}
                    disabled={saving === 'DUES_AUTO_CALCULATION_ENABLED'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_AUTO_CALCULATION_ENABLED' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}

                <Divider />

                <TextField
                  label="Şube Payı Yüzdesi"
                  type="number"
                  value={getValue('DUES_BRANCH_SHARE_PERCENT')}
                  onChange={(e) => handleChange('DUES_BRANCH_SHARE_PERCENT', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_BRANCH_SHARE_PERCENT')?.description ||
                    'Aidat gelirinden şubeye aktarılacak pay oranı'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                {localSettings['DUES_BRANCH_SHARE_PERCENT'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_BRANCH_SHARE_PERCENT' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_BRANCH_SHARE_PERCENT')}
                    disabled={saving === 'DUES_BRANCH_SHARE_PERCENT'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_BRANCH_SHARE_PERCENT' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Gecikme Ceza Ayarları */}
        <Grid size={{ xs: 12, md: 6 }}>
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
                ...cardHeaderSx,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.03)} 0%, ${alpha(theme.palette.warning.light, 0.02)} 100%)`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={iconBoxSx(theme.palette.warning.main, theme.palette.warning.dark)}>
                  <AccountBalanceWalletIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Gecikme Ceza Ayarları
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Geç ödeme durumunda uygulanacak ceza
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
                <TextField
                  label="Gecikme Faiz Oranı"
                  type="number"
                  value={getValue('DUES_LATE_PENALTY_RATE')}
                  onChange={(e) => handleChange('DUES_LATE_PENALTY_RATE', e.target.value)}
                  fullWidth
                  size="small"
                  disabled={isDisabled}
                  helperText={
                    getSetting('DUES_LATE_PENALTY_RATE')?.description ||
                    'Vade geçimi durumunda uygulanacak aylık faiz oranı (0 = ceza yok)'
                  }
                  InputProps={{
                    endAdornment: <InputAdornment position="end">% / ay</InputAdornment>,
                  }}
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />
                {localSettings['DUES_LATE_PENALTY_RATE'] !== undefined && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      saving === 'DUES_LATE_PENALTY_RATE' ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSave('DUES_LATE_PENALTY_RATE')}
                    disabled={saving === 'DUES_LATE_PENALTY_RATE'}
                    sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
                  >
                    {saving === 'DUES_LATE_PENALTY_RATE' ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                )}

                {parseFloat(getValue('DUES_LATE_PENALTY_RATE')) > 0 && (
                  <Alert severity="warning">
                    Gecikme faizi aktif. Vadesi geçen ödemelere aylık{' '}
                    <strong>%{getValue('DUES_LATE_PENALTY_RATE')}</strong> faiz uygulanacak.
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

export default DuesSettings;
