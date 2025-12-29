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
    title: '',
    code: '',
    description: '',
    address: '',
  });

  const canManage = hasPermission('ACCOUNTING_VIEW'); // ACCOUNTING_VIEW yetkisi yeterli

  useEffect(() => {
    if (canManage && isEditMode && id) {
      loadCenter(id);
    }
  }, [canManage, isEditMode, id]);

  const loadCenter = async (centerId: string) => {
    setLoading(true);
    try {
      const data = await getTevkifatCenterById(centerId);
      setCenter(data);
      setForm({
        name: data.name,
        title: data.title || '',
        code: data.code || '',
        description: data.description || '',
        address: data.address || '',
      });
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
      // Boş string'leri undefined yap (backend'de opsiyonel alanlar için)
      const payload: CreateTevkifatCenterDto | UpdateTevkifatCenterDto = {
        name: form.name.trim(),
        title: form.title?.trim() || undefined,
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || undefined,
        address: form.address?.trim() || undefined,
      };

      if (isEditMode && id) {
        await updateTevkifatCenter(id, payload as UpdateTevkifatCenterDto);
        toast.showSuccess('Tevkifat merkezi başarıyla güncellendi');
        navigate(`/accounting/tevkifat-centers/${id}`);
      } else {
        const created = await createTevkifatCenter(payload as CreateTevkifatCenterDto);
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

  if (!canManage) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/accounting/tevkifat-centers')}
          sx={{ mb: 2 }}
        >
          Geri Dön
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <BusinessIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {isEditMode ? 'Tevkifat Merkezi Düzenle' : 'Yeni Tevkifat Merkezi Oluştur'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {isEditMode
                ? 'Tevkifat merkezi bilgilerini güncelleyin'
                : 'Yeni bir tevkifat merkezi kaydı oluşturun'}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          p: 3,
        }}
      >
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                sx={{ minWidth: 300 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Tevkifat Ünvanı (Opsiyonel)"
                value={form.title || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                fullWidth
                helperText="Tevkifat merkezi ünvanı"
                sx={{ minWidth: 300 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Kod (Opsiyonel)"
                value={form.code || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                fullWidth
                helperText="Benzersiz bir kod girebilirsiniz"
                sx={{ minWidth: 250 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Adres"
                value={form.address || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                helperText="Tevkifat merkezi adresi"
                sx={{ minWidth: 300 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Açıklama"
                value={form.description || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                fullWidth
                multiline
                rows={4}
                helperText="Tevkifat merkezi hakkında açıklama"
                sx={{ minWidth: 300 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/accounting/tevkifat-centers')}
                  disabled={saving}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : isEditMode ? <SaveIcon /> : <AddIcon />}
                  disabled={saving}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {saving ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Oluştur'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Box>
  );
};

export default TevkifatCenterCreatePage;

