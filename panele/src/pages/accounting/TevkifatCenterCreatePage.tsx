// src/pages/accounting/TevkifatCenterCreatePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  createTevkifatCenter,
  updateTevkifatCenter,
  getTevkifatCenterById,
  type CreateTevkifatCenterDto,
  type UpdateTevkifatCenterDto,
  type TevkifatCenter,
} from '../../api/accountingApi';
import { getProvinces, getDistricts, type Province, type District } from '../../api/regionsApi';

const TevkifatCenterCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [center, setCenter] = useState<TevkifatCenter | null>(null);
  const [form, setForm] = useState<CreateTevkifatCenterDto>({
    name: '',
    provinceId: undefined,
    districtId: undefined,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const canManage = hasPermission('ACCOUNTING_VIEW'); // ACCOUNTING_VIEW yetkisi yeterli

  useEffect(() => {
    if (canManage) {
      loadProvinces();
      if (isEditMode && id) {
        loadCenter(id);
      }
    }
  }, [canManage, isEditMode, id]);

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İller alınırken hata:', e);
      setProvinces([]);
    }
  };

  const loadDistrictsForProvince = async (provinceId?: string) => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    try {
      const data = await getDistricts(provinceId);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İlçeler alınırken hata:', e);
      setDistricts([]);
    }
  };

  const loadCenter = async (centerId: string) => {
    setLoading(true);
    try {
      const data = await getTevkifatCenterById(centerId);
      setCenter(data);
      // Düzenleme modunda tüm alanlar set edilir
      setForm({
        name: data.name,
        provinceId: data.provinceId || undefined,
        districtId: data.districtId || undefined,
      });
      
      // İl seçilmişse ilçeleri yükle
      if (data.provinceId) {
        await loadDistrictsForProvince(data.provinceId);
      }
    } catch (e: any) {
      console.error('Tevkifat merkezi yüklenirken hata:', e);
      toast.showError('Tevkifat merkezi yüklenirken bir hata oluştu');
      navigate('/accounting/tevkifat-centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Tevkifat merkezi adı gereklidir');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEditMode && id) {
        // Düzenleme modunda tüm alanlar gönderilir
        const payload: UpdateTevkifatCenterDto = {
          name: form.name.trim(),
          provinceId: form.provinceId || null,
          districtId: form.districtId || null,
        };
        await updateTevkifatCenter(id, payload);
        toast.showSuccess('Tevkifat merkezi başarıyla güncellendi');
        navigate(`/accounting/tevkifat-centers/${id}`);
      } else {
        // Oluşturma modunda tüm alanlar gönderilir
        const payload: CreateTevkifatCenterDto = {
          name: form.name.trim(),
          provinceId: form.provinceId,
          districtId: form.districtId,
        };
        const created = await createTevkifatCenter(payload);
        toast.showSuccess('Tevkifat merkezi başarıyla oluşturuldu');
        navigate(`/accounting/tevkifat-centers/${created.id}`);
      }
    } catch (e: any) {
      console.error('Tevkifat merkezi kaydedilirken hata:', e);
      setError(e.response?.data?.message || 'Tevkifat merkezi kaydedilirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceChange = (provinceId: string) => {
    setForm((prev) => ({
      ...prev,
      provinceId: provinceId || undefined,
      districtId: undefined, // İl değiştiğinde ilçe sıfırlanır
    }));
    loadDistrictsForProvince(provinceId);
  };

  const handleDistrictChange = (districtId: string) => {
    setForm((prev) => ({
      ...prev,
      districtId: districtId || undefined,
    }));
  };

  if (!canManage) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <BusinessIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
    }}>
      {/* Back Button */}
      <Box sx={{ mb: 3, pt: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accounting/tevkifat-centers')}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
          }}
        >
          Geri Dön
        </Button>

        {/* Modern Header Card */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            overflow: 'visible',
            position: 'relative',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 4,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <BusinessIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    mb: 1,
                    wordBreak: 'break-word',
                  }}
                >
                  {isEditMode ? 'Tevkifat Merkezi Düzenle' : 'Yeni Tevkifat Merkezi Oluştur'}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                >
                  {isEditMode
                    ? 'Tevkifat merkezi bilgilerini güncelleyin'
                    : 'Yeni bir tevkifat merkezi kaydı oluşturun'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2.5,
                  boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }} 
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="Tevkifat Merkezi Adı"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                  helperText="Tevkifat merkezinin resmi adını girin"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2.5,
                      transition: 'all 0.3s ease',
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="province-label">İl (Opsiyonel)</InputLabel>
                  <Select
                    labelId="province-label"
                    label="İl (Opsiyonel)"
                    value={form.provinceId || ''}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    sx={{ 
                      borderRadius: 2.5,
                      transition: 'all 0.3s ease',
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Seçiniz</em>
                    </MenuItem>
                    {provinces.map((province) => (
                      <MenuItem key={province.id} value={province.id}>
                        {province.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Tevkifat merkezini bir ile bağlayabilirsiniz</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!form.provinceId}>
                  <InputLabel id="district-label">İlçe (Opsiyonel)</InputLabel>
                  <Select
                    labelId="district-label"
                    label="İlçe (Opsiyonel)"
                    value={form.districtId || ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    sx={{ 
                      borderRadius: 2.5,
                      transition: 'all 0.3s ease',
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Seçiniz</em>
                    </MenuItem>
                    {districts.map((district) => (
                      <MenuItem key={district.id} value={district.id}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {form.provinceId 
                      ? 'Tevkifat merkezini bir ilçeye bağlayabilirsiniz' 
                      : 'İlçe seçmek için önce bir il seçmelisiniz'}
                  </FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/accounting/tevkifat-centers')}
                    disabled={saving}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 3,
                      py: 1.25,
                      borderWidth: 1.5,
                      '&:hover': {
                        borderWidth: 1.5,
                      },
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={16} /> : isEditMode ? <SaveIcon /> : <AddIcon />}
                    disabled={saving}
                    sx={{ 
                      borderRadius: 2, 
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.25,
                      minWidth: 140,
                      boxShadow: 'none',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    }}
                  >
                    {saving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Card>
    </Box>
  );
};

export default TevkifatCenterCreatePage;

