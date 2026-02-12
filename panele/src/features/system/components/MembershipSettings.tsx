// src/pages/system/components/MembershipSettings.tsx
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DescriptionIcon from '@mui/icons-material/Description';
import type { SystemSetting } from '../services/systemApi';
import { useSystemSettings } from '../../../app/providers/SystemSettingsContext';
import MemberGroupsManagement from './MemberGroupsManagement';

interface MembershipSettingsProps {
  settings: SystemSetting[];
  onUpdate?: (key: string, value: string) => Promise<void>;
  loading?: boolean;
  canManage?: boolean;
}

const MembershipSettings: React.FC<MembershipSettingsProps> = ({
  settings,
  onUpdate,
  loading = false,
  canManage = false,
}) => {
  const theme = useTheme();
  const { refreshSettings } = useSystemSettings();
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
    if (!onUpdate || !canManage) {
      return;
    }
    setSaving(key);
    try {
      await onUpdate(key, getValue(key));
      setLocalSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await refreshSettings();
    } catch (error) {
      console.error('Ayar güncellenirken hata:', error);
      // Hata mesajı SystemSettingsPage'de gösteriliyor
      throw error;
    } finally {
      setSaving(null);
    }
  };

  const handleSaveMultiple = async (keys: string[]) => {
    const keysToSave = keys.filter((key) => localSettings[key] !== undefined);
    for (const key of keysToSave) {
      await handleSave(key);
    }
  };

  const handleSaveAll = async () => {
    if (!onUpdate || !canManage) return;
    
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
        await refreshSettings();
      }
      
      const failedResults = results.filter((r) => r.status === 'rejected');
      if (failedResults.length > 0) {
        throw new Error(`${failedResults.length} ayar güncellenemedi`);
      }
    } catch (error) {
      console.error('Ayarlar güncellenirken hata:', error);
      throw error;
    } finally {
      setSaving(null);
    }
  };

  const hasUnsavedChanges = Object.keys(localSettings).length > 0;

  return (
    <Stack spacing={3}>
      {!canManage && (
        <Alert severity="warning">
          Bu ayarları değiştirmek için sistem ayarları yönetim yetkisine sahip olmanız gerekmektedir.
        </Alert>
      )}
      {/* Üst Aksiyon Bölümü */}
      {hasUnsavedChanges && onUpdate && canManage && (
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
      {/* Başvuru Ayarları */}
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
              <AssignmentIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Başvuru Ayarları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Üye başvuru süreçleri ve onay akışları
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('MEMBERSHIP_AUTO_APPROVE') === 'true'}
                    onChange={(e) =>
                      handleChange('MEMBERSHIP_AUTO_APPROVE', e.target.checked ? 'true' : 'false')
                    }
                    disabled={!canManage || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Başvuruları Otomatik Onayla
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aktif olduğunda yeni üye başvuruları otomatik olarak onaylanır
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
              {localSettings['MEMBERSHIP_AUTO_APPROVE'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 1, ml: 5 }} />
              )}
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth size="small">
                <InputLabel>Varsayılan Üye Durumu</InputLabel>
                <Select
                  value={getValue('MEMBERSHIP_DEFAULT_STATUS') || 'PENDING'}
                  label="Varsayılan Üye Durumu"
                  onChange={(e) => handleChange('MEMBERSHIP_DEFAULT_STATUS', e.target.value)}
                  disabled={!canManage || loading}
                >
                  <MenuItem value="PENDING">Beklemede (PENDING)</MenuItem>
                  <MenuItem value="ACTIVE">Aktif (ACTIVE)</MenuItem>
                  <MenuItem value="INACTIVE">Pasif (INACTIVE)</MenuItem>
                </Select>
              </FormControl>
              {getSetting('MEMBERSHIP_DEFAULT_STATUS')?.description && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {getSetting('MEMBERSHIP_DEFAULT_STATUS')?.description}
                </Typography>
              )}
              {localSettings['MEMBERSHIP_DEFAULT_STATUS'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
              )}
            </Grid>

            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                İzin Verilen Başvuru Kaynakları
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {[
                    { value: 'DIRECT', label: 'Panelden Direkt' },
                    { value: 'OTHER', label: 'Diğer' },
                  ].map(({ value: source, label }) => {
                    const currentValue = getValue('MEMBERSHIP_ALLOWED_SOURCES');
                    const allowedSources = currentValue
                      ? currentValue.split(',').map((s) => s.trim()).filter((s) => s !== '')
                      : [];
                    // Boş liste = tüm kaynaklar izinli
                    const isChecked = allowedSources.length === 0 || allowedSources.includes(source);

                    return (
                      <FormControlLabel
                        key={source}
                        control={
                          <Switch
                            checked={isChecked}
                            onChange={(e) => {
                              const currentSources = currentValue
                                ? currentValue.split(',').map((s) => s.trim()).filter((s) => s !== '')
                                : [];
                              let newSources: string[];
                              if (e.target.checked) {
                                // Ekle
                                newSources = currentSources.includes(source)
                                  ? currentSources
                                  : [...currentSources, source];
                              } else {
                                // Çıkar
                                newSources = currentSources.filter((s) => s !== source);
                              }
                              handleChange('MEMBERSHIP_ALLOWED_SOURCES', newSources.join(','));
                            }}
                            disabled={!canManage || loading}
                          />
                        }
                        label={label}
                      />
                    );
                  })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Hiçbiri seçili değilse tüm kaynaklar izinlidir
              </Typography>
              {localSettings['MEMBERSHIP_ALLOWED_SOURCES'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" />
              )}
            </Grid>
          </Grid>
        </Box>
      </Card>
      {/* Kayıt Numarası Ayarları */}
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
              <PeopleIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Üye Kayıt Numarası Ayarları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kayıt numarası oluşturma ve formatlama
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={2.5}>
            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={getValue('MEMBERSHIP_AUTO_GENERATE_REG_NUMBER') === 'true'}
                    onChange={(e) =>
                      handleChange(
                        'MEMBERSHIP_AUTO_GENERATE_REG_NUMBER',
                        e.target.checked ? 'true' : 'false',
                      )
                    }
                    disabled={!canManage || loading}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Kayıt Numarasını Otomatik Oluştur
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Aktif olduğunda yeni üyeler için kayıt numarası otomatik oluşturulur
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, width: '100%' }}
              />
              {localSettings['MEMBERSHIP_AUTO_GENERATE_REG_NUMBER'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 1, ml: 5 }} />
              )}
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                label="Kayıt Numarası Öneki"
                value={getValue('MEMBERSHIP_REG_NUMBER_PREFIX')}
                onChange={(e) => handleChange('MEMBERSHIP_REG_NUMBER_PREFIX', e.target.value)}
                fullWidth
                size="small"
                helperText="Örn: UYE-2024-"
                placeholder="UYE"
                disabled={!canManage || loading}
              />
              {localSettings['MEMBERSHIP_REG_NUMBER_PREFIX'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
              )}
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <FormControl fullWidth size="small">
                <InputLabel>Kayıt Numarası Formatı</InputLabel>
                <Select
                  value={getValue('MEMBERSHIP_REG_NUMBER_FORMAT') || 'SEQUENTIAL'}
                  label="Kayıt Numarası Formatı"
                  onChange={(e) => handleChange('MEMBERSHIP_REG_NUMBER_FORMAT', e.target.value)}
                  disabled={!canManage || loading}
                >
                  <MenuItem value="SEQUENTIAL">Sıralı Numaralandırma (1, 2, 3...)</MenuItem>
                  <MenuItem value="YEAR_SEQUENTIAL">Yıl + Sıralı (2024-001, 2024-002...)</MenuItem>
                  <MenuItem value="PREFIX_SEQUENTIAL">Önek + Sıralı (UYE-001, UYE-002...)</MenuItem>
                  <MenuItem value="PREFIX_YEAR_SEQUENTIAL">
                    Önek + Yıl + Sıralı (UYE-2024-001...)
                  </MenuItem>
                </Select>
              </FormControl>
              {localSettings['MEMBERSHIP_REG_NUMBER_FORMAT'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
              )}
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 6
              }}>
              <TextField
                label="Başlangıç Numarası"
                type="number"
                value={getValue('MEMBERSHIP_REG_NUMBER_START') || '1'}
                onChange={(e) => handleChange('MEMBERSHIP_REG_NUMBER_START', e.target.value)}
                fullWidth
                size="small"
                helperText="Sıralı numaralandırmanın başlangıç değeri"
                disabled={!canManage || loading}
              />
              {localSettings['MEMBERSHIP_REG_NUMBER_START'] !== undefined && (
                <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ mt: 0.5 }} />
              )}
            </Grid>
          </Grid>
        </Box>
      </Card>
      {/* Onay Akışı Ayarları */}
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
              <AccountTreeIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Onay Akışı Ayarları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Üyelik onay süreçleri ve gereksinimleri
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={getValue('MEMBERSHIP_REQUIRE_APPROVAL') === 'true'}
                  onChange={(e) =>
                    handleChange('MEMBERSHIP_REQUIRE_APPROVAL', e.target.checked ? 'true' : 'false')
                  }
                  disabled={!canManage || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Üyelik Onayı Zorunlu
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aktif olduğunda tüm üyelikler onay gerektirir
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            {localSettings['MEMBERSHIP_REQUIRE_APPROVAL'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
            )}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={getValue('MEMBERSHIP_REQUIRE_BOARD_DECISION') === 'true'}
                  onChange={(e) =>
                    handleChange(
                      'MEMBERSHIP_REQUIRE_BOARD_DECISION',
                      e.target.checked ? 'true' : 'false',
                    )
                  }
                  disabled={!canManage || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Yönetim Kurulu Kararı Zorunlu
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Onay için yönetim kurulu kararı bilgileri gerekir
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            {localSettings['MEMBERSHIP_REQUIRE_BOARD_DECISION'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
            )}

            <Alert severity="info">
              Onay akışı aktif olduğunda, üye başvuruları onaylanana kadar PENDING durumunda kalır.
            </Alert>
          </Stack>
        </Box>
      </Card>
      {/* Üyelik Yaşam Döngüsü */}
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
              <DescriptionIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Üyelik Yaşam Döngüsü Ayarları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Üyelik iptali ve yeniden kayıt ayarları
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <FormControlLabel
              control={
                <Switch
                  checked={getValue('MEMBERSHIP_ALLOW_CANCELLATION') === 'true'}
                  onChange={(e) =>
                    handleChange('MEMBERSHIP_ALLOW_CANCELLATION', e.target.checked ? 'true' : 'false')
                  }
                  disabled={!canManage || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Üyelik İptaline İzin Ver
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Aktif olduğunda üyelik iptali yapılabilir
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            {localSettings['MEMBERSHIP_ALLOW_CANCELLATION'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
            )}

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={getValue('MEMBERSHIP_ALLOW_RE_REGISTRATION') === 'true'}
                  onChange={(e) =>
                    handleChange('MEMBERSHIP_ALLOW_RE_REGISTRATION', e.target.checked ? 'true' : 'false')
                  }
                  disabled={!canManage || loading}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Yeniden Kayıt Olmaya İzin Ver
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Daha önce iptal edilmiş üyelerin yeniden kayıt olmasına izin ver
                  </Typography>
                </Box>
              }
              sx={{ m: 0, width: '100%' }}
            />
            {localSettings['MEMBERSHIP_ALLOW_RE_REGISTRATION'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 5 }} />
            )}

            <Divider />

            <TextField
              label="Varsayılan İptal Sebepleri (Virgülle Ayırın)"
              value={getValue('MEMBERSHIP_DEFAULT_CANCELLATION_REASONS')}
              onChange={(e) =>
                handleChange('MEMBERSHIP_DEFAULT_CANCELLATION_REASONS', e.target.value)
              }
              fullWidth
              size="small"
              multiline
              rows={3}
              helperText="Örn: İstifa, Vefat, İhraç, Diğer"
              placeholder="İstifa, Vefat, İhraç, Diğer"
              disabled={!canManage || loading}
            />
            {localSettings['MEMBERSHIP_DEFAULT_CANCELLATION_REASONS'] !== undefined && (
              <Chip label="Kaydedilmemiş" size="small" color="warning" />
            )}
          </Stack>
        </Box>
      </Card>
      {/* Zorunlu Alanlar */}
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
              <AssignmentIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                Başvuru Zorunlu Alanları
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Üye başvurusunda hangi alanların zorunlu olduğunu belirleyin
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Aşağıdaki alanlar üye başvurusu için her zaman zorunludur: TC Kimlik No, Ad, Soyad,
            Çalıştığı İl, Çalıştığı İlçe, Kurum, Kadro Ünvanı, Bağlı Olduğu Şube
          </Alert>

          <Grid container spacing={2.5}>
              {[
                { key: 'MEMBERSHIP_REQUIRE_MOTHER_NAME', label: 'Anne Adı' },
                { key: 'MEMBERSHIP_REQUIRE_FATHER_NAME', label: 'Baba Adı' },
                { key: 'MEMBERSHIP_REQUIRE_BIRTHPLACE', label: 'Doğum Yeri' },
                { key: 'MEMBERSHIP_REQUIRE_GENDER', label: 'Cinsiyet' },
                { key: 'MEMBERSHIP_REQUIRE_EDUCATION', label: 'Öğrenim Durumu' },
                { key: 'MEMBERSHIP_REQUIRE_PHONE', label: 'Telefon' },
                { key: 'MEMBERSHIP_REQUIRE_EMAIL', label: 'E-posta' },
                { key: 'MEMBERSHIP_REQUIRE_PROVINCE_DISTRICT', label: 'İkamet İl/İlçe' },
                { key: 'MEMBERSHIP_REQUIRE_INSTITUTION_REG_NO', label: 'Kurum Sicil No' },
                { key: 'MEMBERSHIP_REQUIRE_WORK_UNIT', label: 'Görev Yaptığı Birim' },
            ].map((field) => (
              <Grid
                key={field.key}
                size={{
                  xs: 12,
                  sm: 6,
                  md: 4
                }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={getValue(field.key) === 'true'}
                      onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                      disabled={!canManage || loading}
                    />
                  }
                  label={field.label}
                />
                {localSettings[field.key] !== undefined && (
                  <Chip label="Kaydedilmemiş" size="small" color="warning" sx={{ ml: 4, mt: 0.5 }} />
                )}
              </Grid>
            ))}
          </Grid>
        </Box>
      </Card>
      {/* Üye Grupları Yönetimi */}
      <MemberGroupsManagement canManage={canManage} />
    </Stack>
  );
};

export default MembershipSettings;