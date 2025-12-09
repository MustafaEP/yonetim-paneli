// src/pages/members/MemberApplicationCreatePage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { createMemberApplication } from '../../api/membersApi';
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

const MemberApplicationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canCreateApplication = hasPermission('MEMBER_CREATE_APPLICATION');

  const [saving, setSaving] = useState(false);

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
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  // 🔹 Bölge verilerini yükleme
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
  };

  const validate = () => {
    if (!form.firstName.trim()) {
      window.alert('Ad alanı zorunludur.');
      return false;
    }
    if (!form.lastName.trim()) {
      window.alert('Soyad alanı zorunludur.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canCreateApplication) {
      window.alert('Bu işlem için yetkiniz yok.');
      return;
    }

    if (!validate()) return;

    setSaving(true);
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
      };

      const created = await createMemberApplication(payload);

      window.alert('Üye başvurusu oluşturuldu.');
      // Başvuru PENDING iken üye detay sayfasına gidelim
      navigate(`/members/${created.id}`);
    } catch (e) {
      console.error('Üye başvurusu oluşturulurken hata:', e);
      window.alert('Başvuru oluşturulurken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateApplication) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Yetkisiz İşlem</Typography>
        <Typography color="text.secondary">
          Üye başvurusu oluşturmak için gerekli izne sahip değilsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Yeni Üye Başvurusu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Panel üzerinden yeni bir üye başvurusu oluşturabilirsiniz. Zorunlu alanlar: Ad, Soyad.
        </Typography>

        <Grid container spacing={2}>
          {/* Ad, Soyad */}
          <Grid item xs={12} md={6}>
            <TextField
              label="Ad"
              value={form.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Soyad"
              value={form.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>

          {/* TC, Telefon, E-posta */}
          <Grid item xs={12} md={4}>
            <TextField
              label="TC Kimlik No"
              value={form.nationalId}
              onChange={(e) => handleChange('nationalId', e.target.value)}
              fullWidth
              size="small"
              inputProps={{ maxLength: 11 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Telefon"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="E-posta"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              fullWidth
              size="small"
              type="email"
            />
          </Grid>

          {/* Başvuru Kaynağı */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Başvuru Kaynağı</InputLabel>
              <Select
                label="Başvuru Kaynağı"
                value={form.source}
                onChange={(e) =>
                  handleChange('source', e.target.value as typeof form.source)
                }
              >
                <MenuItem value="DIRECT">Doğrudan (Panel)</MenuItem>
                <MenuItem value="WORKPLACE">İşyeri Temsilcisi</MenuItem>
                <MenuItem value="DEALER">Bayi</MenuItem>
                <MenuItem value="OTHER">Diğer</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Bölge seçimi */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>İl</InputLabel>
              <Select
                label="İl"
                value={form.provinceId}
                onChange={(e) =>
                  handleChange('provinceId', e.target.value as string)
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

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small" disabled={!form.provinceId}>
              <InputLabel>İlçe</InputLabel>
              <Select
                label="İlçe"
                value={form.districtId}
                onChange={(e) =>
                  handleChange('districtId', e.target.value as string)
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

          {/* İşyeri / Bayi – biri seçilirse diğeri temizleniyor */}
          <Grid item xs={12} md={6}>
            <FormControl
              fullWidth
              size="small"
              disabled={!form.provinceId}
            >
              <InputLabel>İşyeri</InputLabel>
              <Select
                label="İşyeri"
                value={form.workplaceId}
                onChange={(e) =>
                  handleChange('workplaceId', e.target.value as string)
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
              size="small"
              disabled={!form.provinceId}
            >
              <InputLabel>Bayi</InputLabel>
              <Select
                label="Bayi"
                value={form.dealerId}
                onChange={(e) =>
                  handleChange('dealerId', e.target.value as string)
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Geri
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            Kaydet
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MemberApplicationCreatePage;
