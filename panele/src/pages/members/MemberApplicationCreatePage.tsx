// src/pages/members/MemberApplicationCreatePage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
  InputAdornment,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import SourceIcon from '@mui/icons-material/Source';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { useAuth } from '../../context/AuthContext';
import { createMemberApplication, checkCancelledMemberByNationalId } from '../../api/membersApi';
import type { MemberDetail } from '../../types/member';
import type {
  Province,
  District,
  Workplace,
  Dealer,
} from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getWorkplaces,
  getDealers,
} from '../../api/regionsApi';
import { getDuesPlans } from '../../api/duesApi';
import type { DuesPlanRow } from '../../types/dues';

const MemberApplicationCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreateApplication = hasPermission('MEMBER_CREATE_APPLICATION');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [cancelledMemberDialogOpen, setCancelledMemberDialogOpen] = useState(false);
  const [cancelledMember, setCancelledMember] = useState<MemberDetail | null>(null);
  const [previousCancelledMemberId, setPreviousCancelledMemberId] = useState<string | undefined>(undefined);

  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    nationalId: string;
    phone: string;
    email: string;
    source: 'DIRECT' | 'WORKPLACE' | 'DEALER' | 'OTHER';
    provinceId: string;
    districtId: string;
    workplaceId: string;
    dealerId: string;
    duesPlanId: string;
  }>({
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    email: '',
    source: 'DIRECT',
    provinceId: '',
    districtId: '',
    workplaceId: '',
    dealerId: '',
    duesPlanId: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [duesPlans, setDuesPlans] = useState<DuesPlanRow[]>([]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (e) {
        console.error('İller alınırken hata:', e);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    const loadDuesPlans = async () => {
      try {
        const data = await getDuesPlans(false); // Sadece aktif planları getir
        setDuesPlans(data);
      } catch (e) {
        console.error('Aidat planları alınırken hata:', e);
      }
    };
    loadDuesPlans();
  }, []);

  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = form.provinceId;
      if (!provinceId) {
        setDistricts([]);
        setWorkplaces([]);
        setDealers([]);
        return;
      }

      try {
        const [dists, works, dels] = await Promise.all([
          getDistricts(provinceId),
          getWorkplaces({ provinceId }),
          getDealers({ provinceId }),
        ]);
        setDistricts(dists);
        setWorkplaces(works);
        setDealers(dels);
      } catch (e) {
        console.error('İl değişince bölge verisi alınırken hata:', e);
      }
    };

    loadForProvince();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.provinceId]);

  useEffect(() => {
    const loadForDistrict = async () => {
      const provinceId = form.provinceId || undefined;
      const districtId = form.districtId || undefined;
      if (!provinceId && !districtId) return;

      try {
        const [works, dels] = await Promise.all([
          getWorkplaces({ provinceId, districtId }),
          getDealers({ provinceId, districtId }),
        ]);
        setWorkplaces(works);
        setDealers(dels);
      } catch (e) {
        console.error('İlçe değişince işyeri/bayi alınırken hata:', e);
      }
    };

    if (form.districtId) {
      loadForDistrict();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.districtId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'provinceId'
        ? {
            districtId: '',
            workplaceId: '',
            dealerId: '',
          }
        : {}),
      ...(field === 'districtId'
        ? {
            workplaceId: '',
            dealerId: '',
          }
        : {}),
      ...(field === 'workplaceId'
        ? {
            dealerId: '',
          }
        : {}),
      ...(field === 'dealerId'
        ? {
            workplaceId: '',
          }
        : {}),
    }));

    // TC kimlik numarası değiştiğinde kontrol yap
    if (field === 'nationalId' && value && value.trim().length === 11) {
      checkNationalId(value.trim());
    } else if (field === 'nationalId' && (!value || value.trim().length !== 11)) {
      // TC boş veya 11 haneli değilse dialog'u kapat
      setCancelledMember(null);
      setPreviousCancelledMemberId(undefined);
    }
  };

  const checkNationalId = async (nationalId: string) => {
    if (!nationalId || nationalId.trim().length !== 11) {
      return;
    }

    setCheckingNationalId(true);
    try {
      const cancelled = await checkCancelledMemberByNationalId(nationalId);
      if (cancelled) {
        setCancelledMember(cancelled);
        setPreviousCancelledMemberId(cancelled.id);
        setCancelledMemberDialogOpen(true);
      } else {
        setCancelledMember(null);
        setPreviousCancelledMemberId(undefined);
      }
    } catch (e) {
      console.error('TC kontrolü sırasında hata:', e);
      // Hata durumunda sessizce devam et
    } finally {
      setCheckingNationalId(false);
    }
  };

  const validate = () => {
    if (!form.firstName.trim()) {
      setError('Ad alanı zorunludur.');
      return false;
    }
    if (!form.lastName.trim()) {
      setError('Soyad alanı zorunludur.');
      return false;
    }
    if (!form.duesPlanId) {
      setError('Aidat planı seçimi zorunludur.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (skipDialog = false) => {
    if (!canCreateApplication) {
      setError('Bu işlem için yetkiniz yok.');
      return;
    }

    if (!validate()) return;

    // Eğer iptal edilmiş üye varsa ve dialog açık değilse, dialog'u aç
    if (cancelledMember && !skipDialog && !cancelledMemberDialogOpen) {
      setCancelledMemberDialogOpen(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalId: form.nationalId.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        source: form.source,
        provinceId: form.provinceId || undefined,
        districtId: form.districtId || undefined,
        workplaceId: form.workplaceId || undefined,
        dealerId: form.dealerId || undefined,
        duesPlanId: form.duesPlanId,
        previousCancelledMemberId: previousCancelledMemberId,
      };

      const created = await createMemberApplication(payload);
      navigate(`/members/${created.id}`);
    } catch (e: any) {
      console.error('Üye başvurusu oluşturulurken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Başvuru oluşturulurken bir hata oluştu.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateApplication) {
    return (
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Üye başvurusu oluşturmak için gerekli izne sahip değilsiniz.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <PersonAddIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Yeni Üye Başvurusu
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Panel üzerinden yeni bir üye başvurusu oluşturun. Zorunlu alanlar: Ad, Soyad, Aidat Planı
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Kişisel Bilgiler Bölümü */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Kişisel Bilgiler
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ad *"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Soyad *"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="TC Kimlik No"
                value={form.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                fullWidth
                inputProps={{ maxLength: 11 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Telefon"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="E-posta"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
          </Grid>

          {/* Başvuru Kaynağı */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SourceIcon sx={{ fontSize: '1.1rem', color: theme.palette.info.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Başvuru Kaynağı
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Başvuru Kaynağı</InputLabel>
                <Select
                  label="Başvuru Kaynağı"
                  value={form.source}
                  onChange={(e) =>
                    handleChange('source', e.target.value as typeof form.source)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <SourceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="DIRECT">Doğrudan (Panel)</MenuItem>
                  <MenuItem value="WORKPLACE">İşyeri Temsilcisi</MenuItem>
                  <MenuItem value="DEALER">Bayi</MenuItem>
                  <MenuItem value="OTHER">Diğer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
          </Grid>

          {/* Aidat Planı */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: '1.1rem', color: theme.palette.secondary.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Aidat Planı
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Aidat Planı *</InputLabel>
                <Select
                  label="Aidat Planı *"
                  value={form.duesPlanId}
                  onChange={(e) =>
                    handleChange('duesPlanId', e.target.value as string)
                  }
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <AccountBalanceWalletIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  {duesPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL ({plan.period === 'MONTHLY' ? 'Aylık' : 'Yıllık'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
          </Grid>

          {/* Bölge Bilgileri */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocationOnIcon sx={{ fontSize: '1.1rem', color: theme.palette.success.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bölge Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İl</InputLabel>
                <Select
                  label="İl"
                  value={form.provinceId}
                  onChange={(e) =>
                    handleChange('provinceId', e.target.value as string)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                disabled={!form.provinceId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İlçe</InputLabel>
                <Select
                  label="İlçe"
                  value={form.districtId}
                  onChange={(e) =>
                    handleChange('districtId', e.target.value as string)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {districts.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!form.provinceId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İşyeri</InputLabel>
                <Select
                  label="İşyeri"
                  value={form.workplaceId}
                  onChange={(e) =>
                    handleChange('workplaceId', e.target.value as string)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {workplaces.map((w) => (
                    <MenuItem key={w.id} value={w.id}>
                      {w.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!form.provinceId}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Bayi</InputLabel>
                <Select
                  label="Bayi"
                  value={form.dealerId}
                  onChange={(e) =>
                    handleChange('dealerId', e.target.value as string)
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <StoreIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {dealers.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Butonlar */}
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: 2, 
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={saving}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              Geri
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* İptal Edilmiş Üye Uyarı Dialog'u */}
      <Dialog
        open={cancelledMemberDialogOpen}
        onClose={() => setCancelledMemberDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <Alert severity="warning" sx={{ flex: 1 }}>
              İptal Edilmiş Üye Tespit Edildi
            </Alert>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {cancelledMember && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Bu TC kimlik numarasına sahip daha önce üyeliği iptal edilmiş bir kayıt bulundu. 
                Aşağıdaki bilgileri inceleyerek devam edebilirsiniz.
              </Alert>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Önceki Üye Bilgileri
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Ad Soyad</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.firstName} {cancelledMember.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">TC Kimlik No</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.nationalId || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">İptal Tarihi</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.cancelledAt
                        ? new Date(cancelledMember.cancelledAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">İptal Nedeni</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.cancellationReason || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Durum</Typography>
                    <Chip
                      label={cancelledMember.status}
                      size="small"
                      color="error"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  {cancelledMember.province && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">İl/İlçe</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {cancelledMember.province.name}
                        {cancelledMember.district ? ` / ${cancelledMember.district.name}` : ''}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setCancelledMemberDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button
            onClick={() => {
              setCancelledMemberDialogOpen(false);
              handleSubmit(true);
            }}
            variant="contained"
            disabled={saving}
          >
            Devam Et ve Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberApplicationCreatePage;