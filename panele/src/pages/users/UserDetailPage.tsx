import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import type { UserDetail } from '../../types/user';
import { getUserById } from '../../api/usersApi';
import type {
  UserScope,
  Province,
  District,
  Workplace,
  Dealer,
} from '../../types/region';
import {
  getUserScopes,
  getProvinces,
  getDistricts,
  getWorkplaces,
  getDealers,
  createUserScope,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { canManageBranches } from '../../utils/permissions';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // 🔹 Kullanıcı ve scope state'leri
  const [user, setUser] = useState<UserDetail | null>(null);
  const [scopes, setScopes] = useState<UserScope[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingScopes, setLoadingScopes] = useState(true);

  // 🔹 Mevcut user (login olan) & branch manage kontrolü
  const { user: currentUser } = useAuth();
  const isBranchManager = canManageBranches(currentUser);

  // 🔹 Scope ekleme dialog state'leri
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeSaving, setScopeSaving] = useState(false);
  const [scopeProvinces, setScopeProvinces] = useState<Province[]>([]);
  const [scopeDistricts, setScopeDistricts] = useState<District[]>([]);
  const [scopeWorkplaces, setScopeWorkplaces] = useState<Workplace[]>([]);
  const [scopeDealers, setScopeDealers] = useState<Dealer[]>([]);

  const [scopeForm, setScopeForm] = useState<{
    provinceId: string;
    districtId: string;
    workplaceId: string;
    dealerId: string;
  }>({
    provinceId: '',
    districtId: '',
    workplaceId: '',
    dealerId: '',
  });

  // 🔹 Kullanıcı & ilk scope load
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const data = await getUserById(id);
        setUser(data);
      } catch (e) {
        console.error('Kullanıcı detay alınırken hata:', e);
      } finally {
        setLoadingUser(false);
      }
    };

    const fetchScopes = async () => {
      setLoadingScopes(true);
      try {
        const data = await getUserScopes(id);
        // 🔹 Gelen veriyi mutlaka diziye çevir
        const safe = Array.isArray(data) ? data : [];
        setScopes(safe);
      } catch (e) {
        // 404 gelirse: scope yok gibi davran
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setScopes([]);
        } else {
          console.error('User scope alınırken hata:', e);
          // Her durumda en azından dizi olsun
          setScopes([]);
        }
      } finally {
        setLoadingScopes(false);
      }
    };
    

    fetchUser();
    fetchScopes();
  }, [id]);

  // 🔹 Scope'ları yeniden yükleme (save sonrası)
  const reloadScopes = async () => {
    if (!id) return;
    setLoadingScopes(true);
    try {
      const data = await getUserScopes(id);
      const safe = Array.isArray(data) ? data : [];
      setScopes(safe);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setScopes([]);
      } else {
        console.error('User scope yeniden alınırken hata:', e);
        setScopes([]);
      }
    } finally {
      setLoadingScopes(false);
    }
  };
  

  // 🔹 Scope form değişimi
  const handleScopeFormChange = (field: keyof typeof scopeForm, value: string) => {
    setScopeForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'provinceId'
        ? { districtId: '', workplaceId: '', dealerId: '' }
        : {}),
      ...(field === 'districtId' ? { workplaceId: '', dealerId: '' } : {}),
      ...(field === 'workplaceId' ? { dealerId: '' } : {}),
      ...(field === 'dealerId' ? { workplaceId: '' } : {}),
    }));
  };

  // 🔹 Scope dialog açıldığında & il değiştiğinde alt verileri yükle
  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = scopeForm.provinceId;
      if (!provinceId) {
        setScopeDistricts([]);
        setScopeWorkplaces([]);
        setScopeDealers([]);
        return;
      }

      try {
        const [districts, workplaces, dealers] = await Promise.all([
          getDistricts(provinceId),
          getWorkplaces({ provinceId }),
          getDealers({ provinceId }),
        ]);
        setScopeDistricts(districts);
        setScopeWorkplaces(workplaces);
        setScopeDealers(dealers);
      } catch (e) {
        console.error('Scope province change load error:', e);
      }
    };

    if (scopeDialogOpen) {
      loadForProvince();
    }
  }, [scopeForm.provinceId, scopeDialogOpen]);

  // 🔹 İlçe değişince işyeri/bayi verilerini filtrele
  useEffect(() => {
    const loadForDistrict = async () => {
      const provinceId = scopeForm.provinceId || undefined;
      const districtId = scopeForm.districtId || undefined;

      try {
        const [workplaces, dealers] = await Promise.all([
          getWorkplaces({ provinceId, districtId }),
          getDealers({ provinceId, districtId }),
        ]);
        setScopeWorkplaces(workplaces);
        setScopeDealers(dealers);
      } catch (e) {
        console.error('Scope district change load error:', e);
      }
    };

    if (scopeDialogOpen && scopeForm.districtId) {
      loadForDistrict();
    }
  }, [scopeForm.districtId, scopeDialogOpen, scopeForm.provinceId]);

  // 🔹 Scope dialog aç/kapat
  const openScopeDialog = async () => {
    setScopeDialogOpen(true);
    setScopeSaving(false);
    setScopeForm({
      provinceId: '',
      districtId: '',
      workplaceId: '',
      dealerId: '',
    });

    try {
      const provinces = await getProvinces();
      setScopeProvinces(provinces);
      setScopeDistricts([]);
      setScopeWorkplaces([]);
      setScopeDealers([]);
    } catch (e) {
      console.error('Provinces load error (scope dialog):', e);
    }
  };

  const closeScopeDialog = () => {
    if (scopeSaving) return;
    setScopeDialogOpen(false);
  };

  // 🔹 Scope save
  const handleScopeSave = async () => {
    if (!id) return;
    const { provinceId, districtId, workplaceId, dealerId } = scopeForm;

    if (!provinceId && !districtId && !workplaceId && !dealerId) {
      window.alert('En az bir yetki alanı (il, ilçe, işyeri veya bayi) seçmelisiniz.');
      return;
    }

    setScopeSaving(true);
    try {
      await createUserScope({
        userId: id,
        provinceId: provinceId || undefined,
        districtId: districtId || undefined,
        workplaceId: workplaceId || undefined,
        dealerId: dealerId || undefined,
      });
      await reloadScopes();
      setScopeDialogOpen(false);
    } catch (e) {
      console.error('Scope eklenirken hata:', e);
      window.alert('Scope eklenirken bir hata oluştu.');
    } finally {
      setScopeSaving(false);
    }
  };

  // 🔹 Render kısmı – hook'lardan SONRA koşullu return
  if (loadingUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Typography>Kullanıcı bulunamadı.</Typography>;
  }

  const fullName = `${user.firstName} ${user.lastName}`;

  const formatScopeRow = (scope: UserScope) => {
    if (scope.dealer) {
      return {
        type: 'Bayi',
        description: `${scope.province?.name ?? ''} / ${
          scope.district?.name ?? ''
        } / ${scope.dealer.name}`,
      };
    }
    if (scope.workplace) {
      return {
        type: 'İşyeri',
        description: `${scope.province?.name ?? ''} / ${
          scope.district?.name ?? ''
        } / ${scope.workplace.name}`,
      };
    }
    if (scope.district) {
      return {
        type: 'İlçe',
        description: `${scope.province?.name ?? ''} / ${scope.district.name}`,
      };
    }
    if (scope.province) {
      return {
        type: 'İl',
        description: `${scope.province.name}`,
      };
    }
    return {
      type: '-',
      description: '-',
    };
  };

  const hasScopes = Array.isArray(scopes) && scopes.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Kullanıcı bilgiler */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Kullanıcı Detayı
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Ad Soyad
              </Typography>
              <Typography variant="body1">{fullName}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                E-posta
              </Typography>
              <Typography variant="body1">{user.email}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Durum
              </Typography>
              <Chip
                label={user.isActive ? 'Aktif' : 'Pasif'}
                color={user.isActive ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Roller
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {user.roles.map((r) => (
                  <Chip key={r} label={r} size="small" />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                İzinler
              </Typography>
              {user.permissions && user.permissions.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                  {user.permissions.map((p) => (
                    <Chip key={p} label={p} size="small" variant="outlined" />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Kayıtlı izin bulunmuyor.
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Kullanıcı Scope'ları */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="h6" gutterBottom>
                Yetki Alanları (Scope)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bu kullanıcı, aşağıdaki il / ilçe / işyeri / bayiler üzerinde yetkilidir.
              </Typography>
            </Box>

            {isBranchManager && (
              <Button variant="contained" size="small" onClick={openScopeDialog}>
                Scope Ekle
              </Button>
            )}
          </Box>

          {loadingScopes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : !hasScopes ? (
            <Typography variant="body2" color="text.secondary">
              Bu kullanıcıya atanmış bir scope bulunmuyor.
            </Typography>
          ) : (
            <Paper sx={{ width: '100%', overflowX: 'auto', mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tür</TableCell>
                    <TableCell>Tanım</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scopes.map((s) => {
                    const formatted = formatScopeRow(s);
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{formatted.type}</TableCell>
                        <TableCell>{formatted.description}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Scope Ekle Dialog */}
      <Dialog
        open={scopeDialogOpen}
        onClose={closeScopeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yeni Scope Ekle</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <Typography variant="body2" color="text.secondary">
            En az bir alan (il, ilçe, işyeri veya bayi) seçmelisiniz. Daha spesifik yetki
            vermek için il → ilçe → işyeri/bayi şeklinde daraltabilirsiniz.
          </Typography>

          <FormControl fullWidth size="small">
            <InputLabel>İl</InputLabel>
            <Select
              label="İl"
              value={scopeForm.provinceId}
              onChange={(e) =>
                handleScopeFormChange('provinceId', e.target.value as string)
              }
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
              </MenuItem>
              {scopeProvinces.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!scopeForm.provinceId}>
            <InputLabel>İlçe</InputLabel>
            <Select
              label="İlçe"
              value={scopeForm.districtId}
              onChange={(e) =>
                handleScopeFormChange('districtId', e.target.value as string)
              }
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
              </MenuItem>
              {scopeDistricts.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
            disabled={!scopeForm.provinceId}
          >
            <InputLabel>İşyeri</InputLabel>
            <Select
              label="İşyeri"
              value={scopeForm.workplaceId}
              onChange={(e) =>
                handleScopeFormChange('workplaceId', e.target.value as string)
              }
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
              </MenuItem>
              {scopeWorkplaces.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            fullWidth
            size="small"
            disabled={!scopeForm.provinceId}
          >
            <InputLabel>Bayi</InputLabel>
            <Select
              label="Bayi"
              value={scopeForm.dealerId}
              onChange={(e) =>
                handleScopeFormChange('dealerId', e.target.value as string)
              }
            >
              <MenuItem value="">
                <em>Seçilmedi</em>
              </MenuItem>
              {scopeDealers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeScopeDialog} disabled={scopeSaving}>
            İptal
          </Button>
          <Button
            onClick={handleScopeSave}
            disabled={scopeSaving}
            variant="contained"
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetailPage;
