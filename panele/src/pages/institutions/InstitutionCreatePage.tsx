// src/pages/institutions/InstitutionCreatePage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { createInstitution, type CreateInstitutionDto } from '../../api/institutionsApi';
import { getProvinces, getDistricts } from '../../api/regionsApi';
import { getBranches } from '../../api/branchesApi';
import type { Province, District } from '../../types/region';
import type { Branch } from '../../api/branchesApi';

const InstitutionCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [form, setForm] = useState<CreateInstitutionDto>({
    name: '',
    provinceId: '',
    districtId: '',
    branchId: '',
  });

  const canCreate = hasPermission('INSTITUTION_CREATE');

  useEffect(() => {
    if (canCreate) {
      loadProvinces();
      loadBranches();
    }
  }, [canCreate]);

  useEffect(() => {
    if (form.provinceId) {
      loadDistricts(form.provinceId);
    } else {
      setDistricts([]);
      setForm((prev) => ({ ...prev, districtId: '' }));
    }
  }, [form.provinceId]);

  const loadProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const data = await getProvinces();
      setProvinces(data);
    } catch (e: any) {
      console.error('İller alınırken hata:', e);
      toast.showError('İller yüklenirken bir hata oluştu');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const loadDistricts = async (provinceId: string) => {
    setLoadingDistricts(true);
    try {
      const data = await getDistricts(provinceId);
      setDistricts(data);
    } catch (e: any) {
      console.error('İlçeler alınırken hata:', e);
      toast.showError('İlçeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const data = await getBranches();
      setBranches(data);
    } catch (e: any) {
      console.error('Şubeler alınırken hata:', e);
      toast.showError('Şubeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.provinceId || !form.branchId) {
      toast.showError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    setSaving(true);
    try {
      const created = await createInstitution(form);
      toast.showSuccess('Kurum başarıyla oluşturuldu. Onay bekliyor.');
      navigate(`/institutions/${created.id}`);
    } catch (e: any) {
      console.error('Kurum oluşturulurken hata:', e);
      toast.showError(e.response?.data?.message || 'Kurum oluşturulurken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/institutions')}
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
              Yeni Kurum Ekle
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Yeni bir kurum kaydı oluşturun
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
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Kurum Adı"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
                required
                helperText="Kurumun resmi adını girin"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>İl</InputLabel>
                <Select
                  value={form.provinceId}
                  label="İl"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, provinceId: e.target.value, districtId: '' }))
                  }
                  disabled={loadingProvinces}
                >
                  {provinces.map((province) => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>İlçe</InputLabel>
                <Select
                  value={form.districtId || ''}
                  label="İlçe"
                  onChange={(e) => setForm((prev) => ({ ...prev, districtId: e.target.value }))}
                  disabled={loadingDistricts || !form.provinceId}
                >
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Şube</InputLabel>
                <Select
                  value={form.branchId}
                  label="Şube"
                  onChange={(e) => setForm((prev) => ({ ...prev, branchId: e.target.value }))}
                  disabled={loadingBranches}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/institutions')}
                  disabled={saving}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>
    </Box>
  );
};

export default InstitutionCreatePage;

