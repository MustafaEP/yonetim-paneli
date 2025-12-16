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
  Stack,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import BusinessIcon from '@mui/icons-material/Business';
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
    birthplace: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | '';
    educationStatus: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE' | '';
    workingProvinceId: string;
    workingDistrictId: string;
    institutionId: string;
    positionTitle: 'KADRO_657' | 'SOZLESMELI_4B' | 'KADRO_663' | 'AILE_HEKIMLIGI' | 'UNVAN_4924' | 'DIGER_SAGLIK_PERSONELI' | '';
    institutionRegNo: string;
    workUnit: string;
    workUnitAddress: string;
    branchId: string;
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
    birthplace: '',
    gender: '',
    educationStatus: '',
    workingProvinceId: '',
    workingDistrictId: '',
    institutionId: '',
    positionTitle: '',
    institutionRegNo: '',
    workUnit: '',
    workUnitAddress: '',
    branchId: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [workingDistricts, setWorkingDistricts] = useState<District[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

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
          birthplace: data.birthplace || '',
          gender: (data.gender as any) || '',
          educationStatus: (data.educationStatus as any) || '',
          workingProvinceId: data.workingProvince?.id || '',
          workingDistrictId: data.workingDistrict?.id || '',
          institutionId: data.institution?.id || '',
          positionTitle: (data.positionTitle as any) || '',
          institutionRegNo: data.institutionRegNo || '',
          workUnit: data.workUnit || '',
          workUnitAddress: data.workUnitAddress || '',
          branchId: data.branch?.id || '',
        });

        // Çalıştığı il seçildiyse ilçeleri yükle
        if (data.workingProvince?.id) {
          const districts = await getDistricts(data.workingProvince.id);
          setWorkingDistricts(districts);
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

  // İlleri yükle
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

  // Çalıştığı il değiştiğinde ilçeleri yükle
  useEffect(() => {
    const loadWorkingDistricts = async () => {
      if (!form.workingProvinceId) {
        setWorkingDistricts([]);
        setForm(prev => ({ ...prev, workingDistrictId: '' }));
        return;
      }

      try {
        const districts = await getDistricts(form.workingProvinceId);
        setWorkingDistricts(districts);
        // Eğer mevcut district yeni province'e ait değilse, temizle
        if (form.workingDistrictId) {
          const currentDistrictExists = districts.some(d => d.id === form.workingDistrictId);
          if (!currentDistrictExists) {
            setForm(prev => ({ ...prev, workingDistrictId: '' }));
          }
        }
      } catch (e) {
        console.error('İlçeler alınırken hata:', e);
      }
    };

    loadWorkingDistricts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.workingProvinceId]);

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
      if (form.birthplace !== (member?.birthplace || '')) updateData.birthplace = form.birthplace || undefined;
      if (form.gender !== (member?.gender || '')) updateData.gender = form.gender || undefined;
      if (form.educationStatus !== (member?.educationStatus || '')) updateData.educationStatus = form.educationStatus || undefined;
      if (form.workingProvinceId !== (member?.workingProvince?.id || '')) updateData.workingProvinceId = form.workingProvinceId || undefined;
      if (form.workingDistrictId !== (member?.workingDistrict?.id || '')) updateData.workingDistrictId = form.workingDistrictId || undefined;
      if (form.institutionId !== (member?.institution?.id || '')) updateData.institutionId = form.institutionId || undefined;
      if (form.positionTitle !== (member?.positionTitle || '')) updateData.positionTitle = form.positionTitle || undefined;
      if (form.institutionRegNo !== (member?.institutionRegNo || '')) updateData.institutionRegNo = form.institutionRegNo || undefined;
      if (form.workUnit !== (member?.workUnit || '')) updateData.workUnit = form.workUnit || undefined;
      if (form.workUnitAddress !== (member?.workUnitAddress || '')) updateData.workUnitAddress = form.workUnitAddress || undefined;
      if (form.branchId !== (member?.branch?.id || '')) updateData.branchId = form.branchId || undefined;

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
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <EditIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Üye Bilgilerini Güncelle
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {member.firstName} {member.lastName} - {member.registrationNumber || member.nationalId}
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/members/${id}`)}
            sx={{ mr: 1 }}
          >
            Geri Dön
          </Button>
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

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Cinsiyet</InputLabel>
                <Select
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  label="Cinsiyet"
                  sx={{
                    borderRadius: 2,
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
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Baba Adı"
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Doğum Yeri"
                value={form.birthplace}
                onChange={(e) => handleChange('birthplace', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Öğrenim Durumu</InputLabel>
                <Select
                  value={form.educationStatus}
                  onChange={(e) => handleChange('educationStatus', e.target.value)}
                  label="Öğrenim Durumu"
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="PRIMARY">İlkokul</MenuItem>
                  <MenuItem value="HIGH_SCHOOL">Lise</MenuItem>
                  <MenuItem value="COLLEGE">Yüksekokul/Üniversite</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Üyelik & Yönetim Kurulu Bilgileri */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
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
              <AccountBalanceWalletIcon sx={{ fontSize: '1.1rem', color: theme.palette.info.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Üyelik & Yönetim Kurulu Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Üye Kayıt No"
                value={form.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Üyelik Bilgisi Seçeneği ID"
                value={form.membershipInfoOptionId}
                onChange={(e) => handleChange('membershipInfoOptionId', e.target.value)}
                fullWidth
                helperText="Admin tarafından yönetilen seçeneklerden bir ID girin"
              />
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
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Yönetim Kurulu Karar Defter No"
                value={form.boardDecisionBookNo}
                onChange={(e) => handleChange('boardDecisionBookNo', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* İş Bilgileri */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WorkIcon sx={{ fontSize: '1.1rem', color: theme.palette.warning.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              İş Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Çalıştığı İl</InputLabel>
                <Select
                  value={form.workingProvinceId}
                  onChange={(e) => handleChange('workingProvinceId', e.target.value)}
                  label="Çalıştığı İl"
                  sx={{
                    borderRadius: 2,
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
              <FormControl fullWidth disabled={!form.workingProvinceId}>
                <InputLabel>Çalıştığı İlçe</InputLabel>
                <Select
                  value={form.workingDistrictId}
                  onChange={(e) => handleChange('workingDistrictId', e.target.value)}
                  label="Çalıştığı İlçe"
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  {workingDistricts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kurum</InputLabel>
                <Select
                  value={form.institutionId}
                  onChange={(e) => handleChange('institutionId', e.target.value)}
                  label="Kurum"
                  sx={{
                    borderRadius: 2,
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
              <FormControl fullWidth>
                <InputLabel>Şube</InputLabel>
                <Select
                  value={form.branchId}
                  onChange={(e) => handleChange('branchId', e.target.value)}
                  label="Şube"
                  sx={{
                    borderRadius: 2,
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kadro Ünvanı</InputLabel>
                <Select
                  value={form.positionTitle}
                  onChange={(e) => handleChange('positionTitle', e.target.value)}
                  label="Kadro Ünvanı"
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="KADRO_657">657 Kadrolu</MenuItem>
                  <MenuItem value="SOZLESMELI_4B">4/B Sözleşmeli</MenuItem>
                  <MenuItem value="KADRO_663">663 Kadrolu</MenuItem>
                  <MenuItem value="AILE_HEKIMLIGI">Aile Hekimliği</MenuItem>
                  <MenuItem value="UNVAN_4924">4924 Ünvanlı</MenuItem>
                  <MenuItem value="DIGER_SAGLIK_PERSONELI">Diğer Sağlık Personeli</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Kurum Sicil No"
                value={form.institutionRegNo}
                onChange={(e) => handleChange('institutionRegNo', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Görev Birimi"
                value={form.workUnit}
                onChange={(e) => handleChange('workUnit', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Birim Adresi"
                value={form.workUnitAddress}
                onChange={(e) => handleChange('workUnitAddress', e.target.value)}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          {/* Kaydet Butonu */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/members/${id}`)}
              disabled={saving}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
              sx={{
                px: 4,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
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
