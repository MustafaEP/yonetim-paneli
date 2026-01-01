// src/pages/members/MemberUpdatePage.tsx
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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import PlaceIcon from '@mui/icons-material/Place';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WorkIcon from '@mui/icons-material/Work';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getMemberById, updateMember } from '../../api/membersApi';
import type { MemberDetail } from '../../types/member';
import type {
  Province,
  District,
} from '../../types/region';
import {
  getProvinces,
  getDistricts,
} from '../../api/regionsApi';
import { getInstitutions } from '../../api/institutionsApi';
import type { Institution } from '../../api/institutionsApi';
import { getBranches } from '../../api/branchesApi';
import type { Branch } from '../../api/branchesApi';
import { getProfessions } from '../../api/professionsApi';
import type { Profession } from '../../api/professionsApi';
import { getTevkifatCenters, getTevkifatTitles } from '../../api/accountingApi';
import type { TevkifatCenter, TevkifatTitle } from '../../api/accountingApi';
import httpClient from '../../api/httpClient';

const MemberUpdatePage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const canUpdateMember = hasPermission('MEMBER_UPDATE');

  const [loadingMember, setLoadingMember] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<MemberDetail | null>(null);

  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    membershipInfoOptionId: string;
    registrationNumber: string;
    boardDecisionDate: string;
    boardDecisionBookNo: string;
    motherName: string;
    fatherName: string;
    birthDate: string;
    birthplace: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
    educationStatus: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE' | '';
    provinceId: string;
    districtId: string;
    institutionId: string;
    branchId: string;
    tevkifatCenterId: string;
    tevkifatTitleId: string;
    // Kurum Detay Bilgileri
    dutyUnit: string;
    institutionAddress: string;
    institutionProvinceId: string;
    institutionDistrictId: string;
    professionId: string;
    institutionRegNo: string;
    staffTitleCode: string;
  }>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    membershipInfoOptionId: '',
    registrationNumber: '',
    boardDecisionDate: '',
    boardDecisionBookNo: '',
    motherName: '',
    fatherName: '',
    birthDate: '',
    birthplace: '',
    gender: '',
    educationStatus: '',
    provinceId: '',
    districtId: '',
    institutionId: '',
    branchId: '',
    tevkifatCenterId: '',
    tevkifatTitleId: '',
    dutyUnit: '',
    institutionAddress: '',
    institutionProvinceId: '',
    institutionDistrictId: '',
    professionId: '',
    institutionRegNo: '',
    staffTitleCode: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [institutionProvinces, setInstitutionProvinces] = useState<Province[]>([]);
  const [institutionDistricts, setInstitutionDistricts] = useState<District[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [tevkifatCenters, setTevkifatCenters] = useState<TevkifatCenter[]>([]);
  const [tevkifatTitles, setTevkifatTitles] = useState<TevkifatTitle[]>([]);
  const [membershipInfoOptions, setMembershipInfoOptions] = useState<Array<{ id: string; label: string; value: string }>>([]);

  // Member verisini yükle
  useEffect(() => {
    if (!id) return;

    const loadMember = async () => {
      setLoadingMember(true);
      try {
        const data = await getMemberById(id);
        setMember(data);
        
        // Form'u mevcut verilerle doldur
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          email: data.email || '',
          membershipInfoOptionId: data.membershipInfoOption?.id || '',
          registrationNumber: data.registrationNumber || '',
          boardDecisionDate: data.boardDecisionDate 
            ? new Date(data.boardDecisionDate).toISOString().split('T')[0]
            : '',
          boardDecisionBookNo: data.boardDecisionBookNo || '',
          motherName: data.motherName || '',
          fatherName: data.fatherName || '',
          birthDate: data.birthDate 
            ? new Date(data.birthDate).toISOString().split('T')[0]
            : '',
          birthplace: data.birthplace || '',
          gender: (data.gender as any) || '',
          educationStatus: (data.educationStatus as any) || '',
          provinceId: data.province?.id || '',
          districtId: data.district?.id || '',
          institutionId: data.institution?.id || '',
          branchId: data.branch?.id || '',
          tevkifatCenterId: (data as any).tevkifatCenter?.id || '',
          tevkifatTitleId: (data as any).tevkifatTitle?.id || '',
          dutyUnit: (data as any).dutyUnit || '',
          institutionAddress: (data as any).institutionAddress || '',
          institutionProvinceId: (data as any).institutionProvince?.id || '',
          institutionDistrictId: (data as any).institutionDistrict?.id || '',
          professionId: (data as any).profession?.id || '',
          institutionRegNo: (data as any).institutionRegNo || '',
          staffTitleCode: (data as any).staffTitleCode || '',
        });

        // İl seçildiyse ilçeleri yükle
        if (data.province?.id) {
          const dists = await getDistricts(data.province.id);
          setDistricts(dists);
        }

        // Kurum ili seçildiyse ilçeleri yükle
        if ((data as any).institutionProvince?.id) {
          const dists = await getDistricts((data as any).institutionProvince.id);
          setInstitutionDistricts(dists);
        }
      } catch (error: any) {
        console.error('Üye detayı alınırken hata:', error);
        setError(error?.response?.data?.message || 'Üye bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoadingMember(false);
      }
    };

    loadMember();
  }, [id]);

  // İlleri yükle (Kayıtlı Olduğu Yer)
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

  // İl değiştiğinde ilçeleri yükle (Kayıtlı Olduğu Yer)
  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = form.provinceId;
      if (!provinceId) {
        setDistricts([]);
        return;
      }

      try {
        const dists = await getDistricts(provinceId);
        setDistricts(dists);
      } catch (e) {
        console.error('İl değişince ilçe verisi alınırken hata:', e);
      }
    };

    loadForProvince();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.provinceId]);

  // Kurumları yükle
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await getInstitutions();
        setInstitutions(data);
      } catch (e) {
        console.error('Kurumlar alınırken hata:', e);
      }
    };
    loadInstitutions();
  }, []);

  // Şubeleri yükle
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches({ isActive: true });
        setBranches(data);
      } catch (e) {
        console.error('Şubeler alınırken hata:', e);
      }
    };
    loadBranches();
  }, []);

  // Meslek/Unvanları yükle
  useEffect(() => {
    const loadProfessions = async () => {
      try {
        const data = await getProfessions();
        setProfessions(data);
      } catch (e) {
        console.error('Meslek/Unvanlar yüklenirken hata:', e);
      }
    };
    loadProfessions();
  }, []);

  // Tevkifat merkezlerini yükle
  useEffect(() => {
    const loadTevkifatCenters = async () => {
      try {
        const data = await getTevkifatCenters();
        setTevkifatCenters(data);
      } catch (e) {
        console.error('Tevkifat merkezleri yüklenirken hata:', e);
      }
    };
    loadTevkifatCenters();
  }, []);

  // Tevkifat ünvanlarını yükle
  useEffect(() => {
    const loadTevkifatTitles = async () => {
      try {
        const data = await getTevkifatTitles();
        setTevkifatTitles(data);
      } catch (e) {
        console.error('Tevkifat ünvanları yüklenirken hata:', e);
      }
    };
    loadTevkifatTitles();
  }, []);

  // Üyelik bilgisi seçeneklerini yükle
  useEffect(() => {
    const loadMembershipInfoOptions = async () => {
      try {
        const res = await httpClient.get('/members/membership-info-options');
        setMembershipInfoOptions(res.data || []);
      } catch (e) {
        console.error('Üyelik bilgisi seçenekleri yüklenirken hata:', e);
      }
    };
    loadMembershipInfoOptions();
  }, []);

  // Kurum İli için illeri yükle
  useEffect(() => {
    const loadInstitutionProvinces = async () => {
      try {
        const data = await getProvinces();
        setInstitutionProvinces(data);
      } catch (e) {
        console.error('Kurum illeri yüklenirken hata:', e);
      }
    };
    loadInstitutionProvinces();
  }, []);

  // Kurum İli değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadForInstitutionProvince = async () => {
      const provinceId = form.institutionProvinceId;
      if (!provinceId) {
        setInstitutionDistricts([]);
        return;
      }

      try {
        const dists = await getDistricts(provinceId);
        setInstitutionDistricts(dists);
      } catch (e) {
        console.error('Kurum ili değişince ilçe verisi alınırken hata:', e);
      }
    };

    loadForInstitutionProvince();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.institutionProvinceId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    return true;
  };

  const handleSubmit = async () => {
    if (!canUpdateMember) {
      setError('Bu işlem için yetkiniz yok.');
      return;
    }

    if (!id) {
      setError('Üye ID bulunamadı.');
      return;
    }

    if (!validate()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Sadece değiştirilmiş alanları gönder
      const updateData: any = {};

      if (form.firstName !== member?.firstName) updateData.firstName = form.firstName;
      if (form.lastName !== member?.lastName) updateData.lastName = form.lastName;
      if (form.phone !== (member?.phone || '')) updateData.phone = form.phone || undefined;
      if (form.email !== (member?.email || '')) updateData.email = form.email || undefined;
      if (form.membershipInfoOptionId !== (member?.membershipInfoOption?.id || '')) updateData.membershipInfoOptionId = form.membershipInfoOptionId || undefined;
      if (form.registrationNumber !== (member?.registrationNumber || '')) updateData.registrationNumber = form.registrationNumber || undefined;
      if (form.boardDecisionDate !== (member?.boardDecisionDate ? new Date(member.boardDecisionDate).toISOString().split('T')[0] : '')) {
        updateData.boardDecisionDate = form.boardDecisionDate || undefined;
      }
      if (form.boardDecisionBookNo !== (member?.boardDecisionBookNo || '')) updateData.boardDecisionBookNo = form.boardDecisionBookNo || undefined;
      if (form.motherName !== (member?.motherName || '')) updateData.motherName = form.motherName || undefined;
      if (form.fatherName !== (member?.fatherName || '')) updateData.fatherName = form.fatherName || undefined;
      if (form.birthDate !== (member?.birthDate ? new Date(member.birthDate).toISOString().split('T')[0] : '')) {
        updateData.birthDate = form.birthDate || undefined;
      }
      if (form.birthplace !== (member?.birthplace || '')) updateData.birthplace = form.birthplace || undefined;
      if (form.gender !== (member?.gender || '')) updateData.gender = form.gender || undefined;
      if (form.educationStatus !== (member?.educationStatus || '')) updateData.educationStatus = form.educationStatus || undefined;
      if (form.provinceId !== (member?.province?.id || '')) updateData.provinceId = form.provinceId || undefined;
      if (form.districtId !== (member?.district?.id || '')) updateData.districtId = form.districtId || undefined;
      if (form.institutionId !== (member?.institution?.id || '')) updateData.institutionId = form.institutionId || undefined;
      if (form.branchId !== (member?.branch?.id || '')) updateData.branchId = form.branchId || undefined;
      if (form.tevkifatCenterId !== ((member as any)?.tevkifatCenter?.id || '')) updateData.tevkifatCenterId = form.tevkifatCenterId || undefined;
      if (form.tevkifatTitleId !== ((member as any)?.tevkifatTitle?.id || '')) updateData.tevkifatTitleId = form.tevkifatTitleId || undefined;
      // Kurum Detay Bilgileri
      if (form.dutyUnit !== ((member as any)?.dutyUnit || '')) updateData.dutyUnit = form.dutyUnit || undefined;
      if (form.institutionAddress !== ((member as any)?.institutionAddress || '')) updateData.institutionAddress = form.institutionAddress || undefined;
      if (form.institutionProvinceId !== ((member as any)?.institutionProvince?.id || '')) updateData.institutionProvinceId = form.institutionProvinceId || undefined;
      if (form.institutionDistrictId !== ((member as any)?.institutionDistrict?.id || '')) updateData.institutionDistrictId = form.institutionDistrictId || undefined;
      if (form.professionId !== ((member as any)?.profession?.id || '')) updateData.professionId = form.professionId || undefined;
      if (form.institutionRegNo !== ((member as any)?.institutionRegNo || '')) updateData.institutionRegNo = form.institutionRegNo || undefined;
      if (form.staffTitleCode !== ((member as any)?.staffTitleCode || '')) updateData.staffTitleCode = form.staffTitleCode || undefined;

      await updateMember(id, updateData);
      
      toast.success('Üye bilgileri başarıyla güncellendi');
      navigate(`/members/${id}`);
    } catch (error: any) {
      console.error('Üye güncellenirken hata:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Üye güncellenirken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!canUpdateMember) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 2,
          }}
        >
          <EditIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Üye bilgilerini güncellemek için gerekli izne sahip değilsiniz.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (loadingMember) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Üye bulunamadı
      </Alert>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Modern Başlık Bölümü */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: `radial-gradient(circle, ${alpha(theme.palette.info.main, 0.1)} 0%, transparent 70%)`,
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: { xs: 56, sm: 64 },
                height: { xs: 56, sm: 64 },
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${alpha(theme.palette.info.main, 0.35)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: `0 12px 32px ${alpha(theme.palette.info.main, 0.45)}`,
                },
              }}
            >
              <EditIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />
            </Box>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  letterSpacing: '-0.02em',
                }}
              >
                Üye Bilgilerini Güncelle
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 500,
                }}
              >
                {member.firstName} {member.lastName} - {member.registrationNumber || 'Kayıt No Yok'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
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
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Kişisel Bilgiler Bölümü */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <PersonIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Kişisel Bilgiler
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
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
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
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
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
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
                      <PhoneIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
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
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '200px' } }}>
                <InputLabel>Cinsiyet</InputLabel>
                <Select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  label="Cinsiyet"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="MALE">Erkek</MenuItem>
                  <MenuItem value="FEMALE">Kadın</MenuItem>
                  <MenuItem value="OTHER">Diğer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Anne Adı"
                value={form.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Baba Adı"
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Doğum Tarihi"
                type="date"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Doğum Yeri"
                value={form.birthplace}
                onChange={(e) => handleChange('birthplace', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '200px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '200px' } }}>
                <InputLabel>Öğrenim Durumu</InputLabel>
                <Select
                  value={form.educationStatus}
                  onChange={(e) => handleChange('educationStatus', e.target.value)}
                  label="Öğrenim Durumu"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="PRIMARY">İlkokul</MenuItem>
                  <MenuItem value="HIGH_SCHOOL">Lise</MenuItem>
                  <MenuItem value="COLLEGE">Yüksekokul/Üniversite</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>İl (Kayıtlı Olduğu Yer)</InputLabel>
                <Select
                  value={form.provinceId}
                  onChange={(e) => handleChange('provinceId', e.target.value)}
                  label="İl (Kayıtlı Olduğu Yer)"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {provinces.map((province) => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>İlçe (Kayıtlı Olduğu Yer)</InputLabel>
                <Select
                  value={form.districtId}
                  onChange={(e) => handleChange('districtId', e.target.value)}
                  label="İlçe (Kayıtlı Olduğu Yer)"
                  disabled={!form.provinceId}
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 3.5, sm: 4.5 }, borderWidth: 1.5, opacity: 0.5 }} />

          {/* Üyelik & Yönetim Kurulu Bilgileri */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: { xs: 2.5, sm: 3.5 },
              pb: { xs: 1.5, sm: 2.5 },
              borderBottom: `3px solid ${alpha(theme.palette.success.main, 0.12)}`,
            }}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48 },
                height: { xs: 44, sm: 48 },
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.35)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(-5deg) scale(1.05)',
                },
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.3rem' }, letterSpacing: '-0.3px' }}>
              Üyelik & Yönetim Kurulu Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Üye Kayıt No"
                value={form.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Üye Grubu</InputLabel>
                <Select
                  value={form.membershipInfoOptionId}
                  onChange={(e) => handleChange('membershipInfoOptionId', e.target.value)}
                  label="Üye Grubu"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {membershipInfoOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Yönetim Kurulu Karar Tarihi"
                type="date"
                value={form.boardDecisionDate}
                onChange={(e) => handleChange('boardDecisionDate', e.target.value)}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Yönetim Kurulu Karar Defter No"
                value={form.boardDecisionBookNo}
                onChange={(e) => handleChange('boardDecisionBookNo', e.target.value)}
                fullWidth
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 3.5, sm: 4.5 }, borderWidth: 1.5, opacity: 0.5 }} />

          {/* İş Bilgileri */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: { xs: 2.5, sm: 3.5 },
              pb: { xs: 1.5, sm: 2.5 },
              borderBottom: `3px solid ${alpha(theme.palette.warning.main, 0.12)}`,
            }}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48 },
                height: { xs: 44, sm: 48 },
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 16px ${alpha(theme.palette.warning.main, 0.35)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(-5deg) scale(1.05)',
                },
              }}
            >
              <WorkIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.3rem' }, letterSpacing: '-0.3px' }}>
              İş Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Kurum</InputLabel>
                <Select
                  value={form.institutionId}
                  onChange={(e) => handleChange('institutionId', e.target.value)}
                  label="Kurum"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {institutions.map((institution) => (
                    <MenuItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Şube</InputLabel>
                <Select
                  value={form.branchId}
                  onChange={(e) => handleChange('branchId', e.target.value)}
                  label="Şube"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Görev Birimi */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Görev Birimi"
                value={form.dutyUnit}
                onChange={(e) => handleChange('dutyUnit', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            {/* Meslek(Unvan) */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Meslek(Unvan)</InputLabel>
                <Select
                  value={form.professionId}
                  onChange={(e) => handleChange('professionId', e.target.value)}
                  label="Meslek(Unvan)"
                  startAdornment={
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.25rem', ml: 1 }} />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Meslek/Unvan Seçin</MenuItem>
                  {professions.map((profession) => (
                    <MenuItem key={profession.id} value={profession.id}>
                      {profession.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Kurum Adresi */}
            <Grid item xs={12}>
              <TextField
                label="Kurum Adresi"
                value={form.institutionAddress}
                onChange={(e) => handleChange('institutionAddress', e.target.value)}
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '300px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            {/* Kurum İli - Kurum İlçesi */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Kurum İli</InputLabel>
                <Select
                  value={form.institutionProvinceId}
                  onChange={(e) => handleChange('institutionProvinceId', e.target.value)}
                  label="Kurum İli"
                  startAdornment={
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.25rem', ml: 1 }} />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">İl Seçin</MenuItem>
                  {institutionProvinces.map((province) => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Kurum İlçesi</InputLabel>
                <Select
                  value={form.institutionDistrictId}
                  onChange={(e) => handleChange('institutionDistrictId', e.target.value)}
                  label="Kurum İlçesi"
                  disabled={!form.institutionProvinceId}
                  startAdornment={
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.25rem', ml: 1 }} />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">İlçe Seçin</MenuItem>
                  {institutionDistricts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Kurum Sicil No - Kadro Unvan Kodu */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Kurum Sicil No"
                value={form.institutionRegNo}
                onChange={(e) => handleChange('institutionRegNo', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Kadro Unvan Kodu"
                value={form.staffTitleCode}
                onChange={(e) => handleChange('staffTitleCode', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: '250px' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.25)}`,
                    },
                  },
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: { xs: 3.5, sm: 4.5 }, borderWidth: 1.5, opacity: 0.5 }} />

          {/* Tevkifat Bilgileri */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              mb: { xs: 2.5, sm: 3.5 },
              pb: { xs: 1.5, sm: 2.5 },
              borderBottom: `3px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
            }}
          >
            <Box
              sx={{
                width: { xs: 44, sm: 48 },
                height: { xs: 44, sm: 48 },
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.35)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(-5deg) scale(1.05)',
                },
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' }, color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.3rem' }, letterSpacing: '-0.3px' }}>
              Tevkifat Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Tevkifat Kurumu</InputLabel>
                <Select
                  value={form.tevkifatCenterId}
                  onChange={(e) => handleChange('tevkifatCenterId', e.target.value)}
                  label="Tevkifat Kurumu"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {tevkifatCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: '250px' } }}>
                <InputLabel>Tevkifat Ünvanı</InputLabel>
                <Select
                  value={form.tevkifatTitleId}
                  onChange={(e) => handleChange('tevkifatTitleId', e.target.value)}
                  label="Tevkifat Ünvanı"
                  sx={{
                    borderRadius: 2.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.25)}`,
                    },
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {tevkifatTitles.map((title) => (
                    <MenuItem key={title.id} value={title.id}>
                      {title.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Kaydet Butonu */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-end', 
              gap: { xs: 1.5, sm: 2.5 }, 
              mt: { xs: 4, sm: 5, md: 6 },
              pt: { xs: 3, sm: 4 },
              borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(`/members/${id}`)}
              disabled={saving}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 3, sm: 4, md: 5 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
                borderWidth: 2,
                minWidth: { xs: '100%', sm: '140px' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.text.primary, 0.15)}`,
                },
              }}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 700,
                px: { xs: 3, sm: 4, md: 5 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.95rem', sm: '1rem' },
                minWidth: { xs: '100%', sm: '160px' },
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: `0 8px 28px 0 ${alpha(theme.palette.primary.main, 0.5)}`,
                  transform: 'translateY(-3px)',
                },
                '&:active': {
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {saving ? 'Güncelleniyor...' : 'Güncelle'}
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default MemberUpdatePage;
