import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
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
  Stack,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  alpha,
  Fade,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SecurityIcon from '@mui/icons-material/Security';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useParams, useNavigate } from 'react-router-dom';

import type { UserDetail } from '../../types/user';
import { getUserById } from '../../api/usersApi';
import { getRoles } from '../../api/rolesApi';
import type { CustomRole } from '../../types/role';
import type {
  UserScope,
  Province,
  District,
} from '../../types/region';
import {
  getUserScopes,
  getProvinces,
  getDistricts,
  createUserScope,
  updateUserScope,
  deleteUserScope,
} from '../../api/regionsApi';
import { useAuth } from '../../context/AuthContext';
import { canManageBranches } from '../../utils/permissions';
import { useToast } from '../../hooks/useToast';

// src/pages/users/UserDetailPage.tsx (senin path’ine göre)
import UserRolesDialog from '../../components/users/UserRolesDialog';
import { updateUserRoles } from '../../api/usersApi';

import UserPermissionsSection from '../../components/users/UserPermissionsSection';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const navigate = useNavigate();

  // 🔹 Kullanıcı ve scope state'leri
  const [user, setUser] = useState<UserDetail | null>(null);
  const [scopes, setScopes] = useState<UserScope[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingScopes, setLoadingScopes] = useState(true);
  const [roles, setRoles] = useState<CustomRole[]>([]);

  // 🔹 Mevcut user (login olan) & branch manage kontrolü
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const isBranchManager = canManageBranches(currentUser);

  // 🔹 Scope ekleme/düzenleme dialog state'leri
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeSaving, setScopeSaving] = useState(false);
  const [scopeProvinces, setScopeProvinces] = useState<Province[]>([]);
  const [scopeDistricts, setScopeDistricts] = useState<District[]>([]);
  const [editingScope, setEditingScope] = useState<UserScope | null>(null);

  const [scopeForm, setScopeForm] = useState<{
    provinceId: string;
    districtId: string;
  }>({
    provinceId: '',
    districtId: '',
  });

  const { hasPermission } = useAuth();
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const canAssignRole = hasPermission('USER_ASSIGN_ROLE');

  const handleSaveRoles = async (customRoleIds: string[]) => {
    if (!user) return;
    try {
      const updated = await updateUserRoles(user.id, customRoleIds);
      setUser(updated);
    } catch (e) {
      console.error('Kullanıcı rolleri güncellenirken hata:', e);
      throw e; // Dialog içinde hata için alert gösteriyoruz
    }
  };
  
  
  // 🔹 Kullanıcı & ilk scope load
  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const data = await getUserById(id);
        setUser(data);
        
        // Rolleri detaylı olarak çek
        if (data.roles && data.roles.length > 0) {
          try {
            const allRoles = await getRoles();
            const userRoleDetails = allRoles
              .filter((r): r is CustomRole => 'id' in r && data.roles.some(roleName => typeof roleName === 'string' && r.name === roleName))
              .map(r => r as CustomRole);
            setRoles(userRoleDetails);
          } catch (e) {
            console.error('Roller alınırken hata:', e);
          }
        }
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
        console.error('User scope alınırken hata:', e);
        // Hata durumunda boş dizi döndür
        setScopes([]);
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
      console.error('User scope yeniden alınırken hata:', e);
      setScopes([]);
    } finally {
      setLoadingScopes(false);
    }
  };
  
  // 🔹 Scope form değişimi
  const handleScopeFormChange = (field: keyof typeof scopeForm, value: string) => {
    setScopeForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'provinceId' ? { districtId: '' } : {}),
    }));
  };

  // 🔹 Scope dialog açıldığında & il değiştiğinde alt verileri yükle
  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = scopeForm.provinceId;
      if (!provinceId) {
        setScopeDistricts([]);
        return;
      }

      try {
        const districts = await getDistricts(provinceId);
        setScopeDistricts(districts);
      } catch (e) {
        console.error('Scope province change load error:', e);
      }
    };

    if (scopeDialogOpen) {
      loadForProvince();
    }
  }, [scopeForm.provinceId, scopeDialogOpen]);


  // 🔹 Scope dialog aç/kapat
  const openScopeDialog = async (scope?: UserScope) => {
    setEditingScope(scope || null);
    setScopeDialogOpen(true);
    setScopeSaving(false);
    
    if (scope) {
      // Düzenleme modu
      setScopeForm({
        provinceId: scope.province?.id || '',
        districtId: scope.district?.id || '',
      });
    } else {
      // Yeni ekleme modu
      setScopeForm({
        provinceId: '',
        districtId: '',
      });
    }

    try {
      const provinces = await getProvinces();
      setScopeProvinces(provinces);
      
      // Düzenleme modunda ve il seçiliyse ilçeleri yükle
      if (scope?.province?.id) {
        try {
          const districts = await getDistricts(scope.province.id);
          setScopeDistricts(districts);
        } catch (e) {
          console.error('Districts load error (scope dialog):', e);
          setScopeDistricts([]);
        }
      } else {
        setScopeDistricts([]);
      }
    } catch (e) {
      console.error('Provinces load error (scope dialog):', e);
    }
  };

  const closeScopeDialog = () => {
    if (scopeSaving) return;
    setScopeDialogOpen(false);
    setEditingScope(null);
    setScopeForm({
      provinceId: '',
      districtId: '',
    });
  };

  // 🔹 Scope save (ekleme veya güncelleme)
  const handleScopeSave = async () => {
    if (!id) return;
    const { provinceId, districtId } = scopeForm;

    if (!provinceId && !districtId) {
      toast.showWarning('En az bir yetki alanı (il veya ilçe) seçmelisiniz.');
      return;
    }

    setScopeSaving(true);
    try {
      // Boş string'leri undefined'a çevir
      const payload: {
        provinceId?: string;
        districtId?: string;
      } = {};

      if (provinceId && provinceId.trim() !== '') {
        payload.provinceId = provinceId;
      }

      if (districtId && districtId.trim() !== '') {
        payload.districtId = districtId;
      }

      if (editingScope) {
        // Güncelleme modu
        await updateUserScope(editingScope.id, payload);
        toast.showSuccess('Yetki alanı başarıyla güncellendi.');
      } else {
        // Yeni ekleme modu
        await createUserScope({
          userId: id,
          ...payload,
        });
        toast.showSuccess('Yetki alanı başarıyla eklendi.');
      }

      await reloadScopes();
      closeScopeDialog();
    } catch (e: any) {
      console.error('Scope kaydedilirken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 
        (editingScope ? 'Yetki alanı güncellenirken bir hata oluştu.' : 'Yetki alanı eklenirken bir hata oluştu.');
      toast.showError(errorMessage);
    } finally {
      setScopeSaving(false);
    }
  };

  // 🔹 Scope silme
  const handleDeleteScope = async (scopeId: string) => {
    if (!window.confirm('Bu yetki alanını silmek istediğinize emin misiniz?')) return;

    try {
      await deleteUserScope(scopeId);
      await reloadScopes();
      toast.showSuccess('Yetki alanı başarıyla silindi.');
    } catch (e) {
      console.error('Scope silinirken hata:', e);
      toast.showError('Yetki alanı silinirken bir hata oluştu.');
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
    <Fade in timeout={300}>
      <Box sx={{ pb: 4 }}>
        {/* Başlık Bölümü */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2,
                  boxShadow: `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <PersonIcon sx={{ color: '#fff', fontSize: '2rem' }} />
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
                  {fullName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.875rem', sm: '0.9rem' },
                    }}
                  >
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Chip
              icon={user.isActive ? <CheckCircleIcon /> : <CancelIcon />}
              label={user.isActive ? 'Aktif' : 'Pasif'}
              color={user.isActive ? 'success' : 'default'}
              sx={{ 
                fontWeight: 600,
                height: 36,
                fontSize: '0.875rem',
                '& .MuiChip-icon': { fontSize: '1.1rem' }
              }}
            />
          </Box>
        </Box>

        {/* Kullanıcı Bilgileri Kartı */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PersonIcon sx={{ fontSize: '1.5rem', color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Kullanıcı Bilgileri
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                  Ad Soyad
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {fullName}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                  E-posta Adresi
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  {user.email}
                </Typography>
              </Paper>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Roller Bölümü */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ fontSize: '1.25rem', color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>Roller</Typography>
                </Box>
                {canAssignRole && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setRolesDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Rolleri Düzenle
                  </Button>
                )}
              </Box>
              {user?.roles && user.roles.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.roles.map((roleName) => {
                    const roleDetail = roles.find(r => r.name === roleName);
                    return (
                      <Box key={roleName} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip 
                          label={roleName} 
                          sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            fontWeight: 600,
                            height: 32,
                          }}
                        />
                        {roleDetail?.districtId && roleDetail?.district ? (
                          <Chip
                            icon={<LocationOnIcon />}
                            label={`${roleDetail.district.name} (İlçe)`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': { fontSize: '0.9rem' }
                            }}
                          />
                        ) : roleDetail?.provinceId && roleDetail?.province ? (
                          <Chip
                            icon={<LocationOnIcon />}
                            label={`${roleDetail.province.name} (İl)`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              '& .MuiChip-icon': { fontSize: '0.9rem' }
                            }}
                          />
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    background: alpha(theme.palette.grey[500], 0.05),
                    border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                  }}
                >
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                    Bu kullanıcıya henüz rol atanmamış.
                  </Typography>
                </Paper>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* İzinler Bölümü */}
            <UserPermissionsSection permissions={user?.permissions} />
          </CardContent>
        </Card>

        {/* Üye Bilgileri - Eğer kullanıcının bir üye ilişkisi varsa */}
        {user.member && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.08)}`,
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BadgeIcon sx={{ fontSize: '1.5rem', color: theme.palette.success.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    Üye Bilgileri
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(`/members/${user.member!.id}`)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme.palette.success.main,
                    color: theme.palette.success.main,
                    '&:hover': {
                      borderColor: theme.palette.success.dark,
                      backgroundColor: alpha(theme.palette.success.main, 0.08),
                    },
                  }}
                >
                  Üye Detayına Git
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.success.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                    Ad Soyad
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {user.member.firstName} {user.member.lastName}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.success.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                    TC Kimlik No
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {user.member.nationalId}
                  </Typography>
                </Paper>

                {user.member.registrationNumber && (
                  <Paper
                    elevation={0}
                    sx={{
                      flex: 1,
                      p: 2.5,
                      borderRadius: 2,
                      background: alpha(theme.palette.success.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                      Üye Kayıt No
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      {user.member.registrationNumber}
                    </Typography>
                  </Paper>
                )}
              </Box>

              {(user.member.phone || user.member.email) && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    {user.member.phone && (
                      <Paper
                        elevation={0}
                        sx={{
                          flex: 1,
                          p: 2.5,
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                          Telefon
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {user.member.phone}
                        </Typography>
                      </Paper>
                    )}

                    {user.member.email && (
                      <Paper
                        elevation={0}
                        sx={{
                          flex: 1,
                          p: 2.5,
                          borderRadius: 2,
                          background: alpha(theme.palette.success.main, 0.04),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                          E-posta (Üye)
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                          {user.member.email}
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Üye Durumu:
                </Typography>
                <Chip
                  label={user.member.status === 'ACTIVE' ? 'Aktif Üye' : user.member.status === 'PENDING' ? 'Beklemede' : user.member.status === 'INACTIVE' ? 'Pasif' : user.member.status === 'RESIGNED' ? 'İstifa' : user.member.status === 'EXPELLED' ? 'İhraç' : 'Reddedildi'}
                  color={user.member.status === 'ACTIVE' ? 'success' : user.member.status === 'PENDING' ? 'warning' : 'default'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Kullanıcı Scope'ları */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.08)}`,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOnIcon sx={{ fontSize: '1.5rem', color: theme.palette.info.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                    Yetki Alanları (Scope)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Bu kullanıcı, aşağıdaki il / ilçe / işyeri / anlaşmalı kurumlar üzerinde yetkilidir.
                </Typography>
              </Box>

              {isBranchManager && (
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<AddLocationIcon />}
                  onClick={() => openScopeDialog()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  Scope Ekle
                </Button>
              )}
            </Box>

            {loadingScopes ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : !hasScopes ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  background: alpha(theme.palette.grey[500], 0.05),
                  border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                  textAlign: 'center',
                }}
              >
                <LocationOnIcon sx={{ fontSize: 48, color: alpha(theme.palette.grey[500], 0.3), mb: 2 }} />
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  Bu kullanıcıya atanmış bir scope bulunmuyor.
                </Typography>
              </Paper>
            ) : (
              <Paper 
                elevation={0}
                sx={{ 
                  width: '100%', 
                  overflowX: 'auto',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Tür</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Tanım</TableCell>
                      {isBranchManager && (
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                          İşlemler
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scopes.map((s) => {
                      const formatted = formatScopeRow(s);
                      return (
                        <TableRow 
                          key={s.id}
                          sx={{
                            '&:hover': { 
                              bgcolor: alpha(theme.palette.info.main, 0.03),
                            },
                            transition: 'all 0.2s',
                          }}
                        >
                          <TableCell>
                            <Chip
                              label={formatted.type}
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                fontWeight: 600,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {formatted.description}
                              </Typography>
                            </Box>
                          </TableCell>
                          {isBranchManager && (
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Düzenle" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => openScopeDialog(s)}
                                    sx={{
                                      color: theme.palette.primary.main,
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Sil" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteScope(s.id)}
                                    sx={{
                                      color: theme.palette.error.main,
                                      transition: 'all 0.2s',
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                        transform: 'scale(1.1)',
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          )}
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
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddLocationIcon sx={{ color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editingScope ? 'Scope Düzenle' : 'Yeni Scope Ekle'}
              </Typography>
            </Box>
          </DialogTitle>
          <Divider />
          <DialogContent
            sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                En az bir alan (il veya ilçe) seçmelisiniz. Daha spesifik yetki
                vermek için il → ilçe şeklinde daraltabilirsiniz.
              </Typography>
            </Paper>

            <FormControl fullWidth>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" />
                  İl
                </Box>
              </InputLabel>
              <Select
                label="İl"
                value={scopeForm.provinceId}
                onChange={(e) =>
                  handleScopeFormChange('provinceId', e.target.value as string)
                }
                sx={{
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
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

            <FormControl fullWidth disabled={!scopeForm.provinceId}>
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" />
                  İlçe
                </Box>
              </InputLabel>
              <Select
                label="İlçe"
                value={scopeForm.districtId}
                onChange={(e) =>
                  handleScopeFormChange('districtId', e.target.value as string)
                }
                sx={{
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                }}
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
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5, gap: 1 }}>
            <Button 
              onClick={closeScopeDialog} 
              disabled={scopeSaving}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleScopeSave}
              disabled={scopeSaving}
              variant="contained"
              startIcon={scopeSaving ? <CircularProgress size={16} /> : null}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 100,
              }}
            >
              {scopeSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogActions>
        </Dialog>

        <UserRolesDialog
          open={rolesDialogOpen}
          user={user}
          onClose={() => setRolesDialogOpen(false)}
          onSave={handleSaveRoles}
        />
      </Box>
    </Fade>
  );
};

export default UserDetailPage;
