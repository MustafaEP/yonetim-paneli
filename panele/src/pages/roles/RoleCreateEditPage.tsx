// src/pages/roles/RoleCreateEditPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormControl,
  FormLabel,
  Alert,
  Chip,
  useTheme,
  alpha,
  Paper,
  Collapse,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import type {
  CustomRole,
  CreateRoleDto,
  UpdateRoleDto,
  Permission,
} from '../../types/role';
import {
  getRoleById,
  createRole,
  updateRole,
  updateRolePermissions,
} from '../../api/rolesApi';
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission as PermissionType,
} from '../../types/role';
import { getProvinces, getDistricts } from '../../api/regionsApi';
import type { Province, District } from '../../types/region';

const RoleCreateEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(
    new Set(),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  useEffect(() => {
    const fetchProvinces = async () => {
      setProvincesLoading(true);
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (e) {
        console.error('İller alınırken hata:', e);
      } finally {
        setProvincesLoading(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchRole = async () => {
        try {
          const role = await getRoleById(id);
          if (role.name === 'ADMIN') {
            setError('ADMIN rolü düzenlenemez. Bu bir sistem rolüdür.');
            setTimeout(() => navigate('/roles'), 2000);
            return;
          }
          setName(role.name);
          setDescription(role.description || '');
          setIsActive(role.isActive);
          setSelectedPermissions(new Set(role.permissions));
          setSelectedProvinceId(role.provinceId || '');
          setSelectedDistrictId(role.districtId || '');
          // Tüm grupları başlangıçta aç
          setExpandedGroups(new Set(Object.keys(PERMISSION_GROUPS)));
          
          // Eğer provinceId varsa ilçeleri yükle
          if (role.provinceId) {
            const fetchDistricts = async () => {
              try {
                const districtData = await getDistricts(role.provinceId!);
                setDistricts(districtData);
              } catch (e) {
                console.error('İlçeler alınırken hata:', e);
              }
            };
            fetchDistricts();
          }
        } catch (e) {
          console.error('Rol alınırken hata:', e);
          setError('Rol bilgileri alınamadı');
        } finally {
          setLoading(false);
        }
      };
      fetchRole();
    } else {
      // Yeni rol oluştururken tüm grupları aç
      setExpandedGroups(new Set(Object.keys(PERMISSION_GROUPS)));
    }
  }, [id, isEditMode, navigate]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handlePermissionToggle = (permission: Permission) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(permission)) {
        newSet.delete(permission);
      } else {
        newSet.add(permission);
      }
      return newSet;
    });
  };

  const handleGroupToggle = (permissions: Permission[], checked: boolean) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        permissions.forEach((p) => newSet.add(p));
      } else {
        permissions.forEach((p) => newSet.delete(p));
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Rol adı gereklidir');
      return;
    }

    if (name.trim().toUpperCase() === 'ADMIN') {
      setError('ADMIN rolü oluşturulamaz. Bu bir sistem rolüdür.');
      return;
    }

    if (selectedPermissions.size === 0) {
      setError('En az bir izin seçmelisiniz');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const permissionsArray = Array.from(selectedPermissions);

      // MEMBER_LIST_BY_PROVINCE izni seçildiyse provinceId zorunlu
      const hasProvincePermission = permissionsArray.includes('MEMBER_LIST_BY_PROVINCE');
      if (hasProvincePermission && !selectedProvinceId) {
        setError('MEMBER_LIST_BY_PROVINCE izni seçildiğinde il seçimi zorunludur');
        return;
      }
      
      // İlçe seçilmişse il seçilmiş olmalı
      if (selectedDistrictId && !selectedProvinceId) {
        setError('İlçe seçmek için önce il seçmelisiniz');
        return;
      }
      
      // İlçe seçilmişse il seçilmiş olmalı
      if (selectedDistrictId && !selectedProvinceId) {
        setError('İlçe seçmek için önce il seçmelisiniz');
        return;
      }

      if (isEditMode && id) {
        const updateDto: UpdateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          provinceId: hasProvincePermission ? selectedProvinceId : undefined,
          districtId: hasProvincePermission && selectedDistrictId ? selectedDistrictId : undefined,
        };
        await updateRole(id, updateDto);
        await updateRolePermissions(id, { permissions: permissionsArray });
      } else {
        const createDto: CreateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: permissionsArray,
          provinceId: hasProvincePermission ? selectedProvinceId : undefined,
          districtId: hasProvincePermission && selectedDistrictId ? selectedDistrictId : undefined,
        };
        await createRole(createDto);
      }

      navigate('/roles');
    } catch (e: any) {
      console.error('Rol kaydedilirken hata:', e);
      setError(
        e.response?.data?.message || 'Rol kaydedilirken bir hata oluştu',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  const groupLabels: Record<string, string> = {
    USER_MANAGEMENT: 'Kullanıcı Yönetimi',
    ROLE_MANAGEMENT: 'Rol Yönetimi',
    MEMBER_MANAGEMENT: 'Üye Yönetimi',
    DUES_MANAGEMENT: 'Aidat Yönetimi',
    REGION_MANAGEMENT: 'Bölge Yönetimi',
    CONTENT_MANAGEMENT: 'İçerik Yönetimi',
    DOCUMENT_MANAGEMENT: 'Doküman Yönetimi',
    REPORTS: 'Raporlar',
    NOTIFICATIONS: 'Bildirimler',
    SYSTEM: 'Sistem',
  };

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/roles')}
          sx={{
            mb: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              color: theme.palette.primary.main,
            },
          }}
        >
          Rollere Geri Dön
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            {isEditMode ? (
              <EditIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
            ) : (
              <AddCircleIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
            )}
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
              {isEditMode ? 'Rol Düzenle' : 'Yeni Rol Oluştur'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {isEditMode
                ? 'Rol bilgilerini ve izinlerini güncelleyin'
                : 'Yeni bir rol oluşturun ve izinlerini belirleyin'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Rol Bilgileri Kartı */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AdminPanelSettingsIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Rol Bilgileri
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Rol Adı"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
            <TextField
              label="Açıklama"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
            {selectedPermissions.has('MEMBER_LIST_BY_PROVINCE') && (
              <Box sx={{ mt: 1 }}>
                <Alert
                  severity="info"
                  icon={<InfoIcon />}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    '& .MuiAlert-icon': {
                      color: theme.palette.info.main,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    İl ve İlçe Seçimi
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                    "Belirli İldeki Üyeleri Görüntüleme" iznini seçtiğiniz için aşağıda il seçmeniz zorunludur. İlçe seçimi opsiyoneldir. 
                    İlçe seçmezseniz, bu role sahip kullanıcılar seçtiğiniz ilin tüm ilçelerindeki üyeleri görebilir. 
                    İlçe seçerseniz, sadece o ilçedeki üyeleri görebilirler.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth required>
                      <InputLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon fontSize="small" />
                          İl Seçimi *
                        </Box>
                      </InputLabel>
                      <Select
                        value={selectedProvinceId || ''}
                        onChange={(e) => setSelectedProvinceId(e.target.value)}
                        label="İl Seçimi *"
                        disabled={provincesLoading}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: '#fff',
                          '&:hover': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                      >
                        <MenuItem value="">
                          <em>İl seçiniz</em>
                        </MenuItem>
                        {provinces.map((province) => (
                          <MenuItem key={province.id} value={province.id}>
                            {province.name} {province.code ? `(${province.code})` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {selectedProvinceId && (
                      <FormControl fullWidth>
                        <InputLabel>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="small" />
                            İlçe Seçimi (Opsiyonel)
                          </Box>
                        </InputLabel>
                        <Select
                          value={selectedDistrictId}
                          onChange={(e) => setSelectedDistrictId(e.target.value)}
                          label="İlçe Seçimi (Opsiyonel)"
                          disabled={districtsLoading || !selectedProvinceId}
                          sx={{
                            borderRadius: 2,
                            backgroundColor: '#fff',
                            '&:hover': {
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: theme.palette.primary.main,
                              },
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>İlçe seçmeyin (Tüm ilçeler)</em>
                          </MenuItem>
                          {districts.map((district) => (
                            <MenuItem key={district.id} value={district.id}>
                              {district.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                </Alert>
              </Box>
            )}
            {isEditMode && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      sx={{
                        '&.Mui-checked': {
                          color: theme.palette.success.main,
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500 }}>
                      Rolü Aktif Tut
                    </Typography>
                  }
                />
              </Paper>
            )}
          </Box>
        </Box>
      </Card>

      {/* İzinler Kartı */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            p: 3,
            backgroundColor: alpha(theme.palette.info.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <SecurityIcon sx={{ color: theme.palette.info.main }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                İzinler
              </Typography>
            </Box>
            <Chip
              label={`${selectedPermissions.size} izin seçildi`}
              icon={<SecurityIcon />}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 2,
            }}
          >
            {Object.entries(PERMISSION_GROUPS).map(([groupKey, permissions]) => {
              const allSelected = permissions.every((p) =>
                selectedPermissions.has(p),
              );
              const someSelected = permissions.some((p) =>
                selectedPermissions.has(p),
              );
              const isExpanded = expandedGroups.has(groupKey);

              return (
                <Box
                  key={groupKey}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  }}
                >
                <Box
                  sx={{
                    p: 2,
                    backgroundColor: someSelected
                      ? alpha(theme.palette.primary.main, 0.04)
                      : alpha(theme.palette.grey[500], 0.02),
                    borderBottom: isExpanded ? `1px solid ${alpha(theme.palette.divider, 0.08)}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: someSelected
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.grey[500], 0.04),
                    },
                  }}
                  onClick={() => toggleGroup(groupKey)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleGroupToggle(permissions, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                            color: theme.palette.primary.main,
                          },
                        }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: someSelected ? theme.palette.primary.main : theme.palette.text.primary,
                        }}
                      >
                        {groupLabels[groupKey]}
                      </Typography>
                      <Chip
                        label={`${permissions.filter((p) => selectedPermissions.has(p)).length}/${permissions.length}`}
                        size="small"
                        color={someSelected ? 'primary' : 'default'}
                        sx={{ fontWeight: 600, ml: 1 }}
                      />
                    </Box>
                    {isExpanded ? (
                      <ExpandLessIcon sx={{ color: theme.palette.text.secondary }} />
                    ) : (
                      <ExpandMoreIcon sx={{ color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>
                <Collapse in={isExpanded}>
                  <FormGroup sx={{ p: 2, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {permissions.map((permission) => (
                        <React.Fragment key={permission}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              backgroundColor: selectedPermissions.has(permission)
                                ? alpha(theme.palette.primary.main, 0.04)
                                : 'transparent',
                              border: `1px solid ${
                                selectedPermissions.has(permission)
                                  ? alpha(theme.palette.primary.main, 0.2)
                                  : 'transparent'
                              }`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.06),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              },
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedPermissions.has(permission)}
                                  onChange={() => handlePermissionToggle(permission)}
                                  sx={{
                                    '&.Mui-checked': {
                                      color: theme.palette.primary.main,
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                    {PERMISSION_LABELS[permission]}
                                  </Typography>
                                  {permission === 'MEMBER_LIST_BY_PROVINCE' && (
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        display: 'block',
                                        mt: 0.5,
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.75rem',
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      Bu izni seçersen, il ve ilçe (opsiyonel) seçmen gerekiyor. Seçmen halinde bu role sahip olan kişi sadece o il ve ilçedeki üyeleri görebilir.
                                    </Typography>
                                  )}
                                </Box>
                              }
                              sx={{ m: 0, width: '100%' }}
                            />
                          </Paper>
                        </React.Fragment>
                      ))}
                    </Box>
                  </FormGroup>
                </Collapse>
              </Box>
            );
          })}
          </Box>
        </Box>
      </Card>

      {/* Alt Butonlar */}
      <Box
        sx={{
          mt: 3,
          p: 3,
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          gap: 2,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <Button
          onClick={() => navigate('/roles')}
          disabled={saving}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            minWidth: 120,
          }}
        >
          İptal
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || !name.trim() || selectedPermissions.size === 0}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            minWidth: 120,
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            '&:hover': {
              boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
            },
            '&.Mui-disabled': {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
              color: '#fff',
            },
          }}
        >
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </Box>
    </Box>
  );
};

export default RoleCreateEditPage;