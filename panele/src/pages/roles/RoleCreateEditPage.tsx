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
  IconButton,
  Divider,
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
import {
  getAllDependencies,
  getMissingDependencies,
  getRequiredBy,
} from '../../utils/permissionDependencies';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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

  // Yetki alanı state'i
  const [hasScopeRestriction, setHasScopeRestriction] = useState(false);

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
          
          // Yetki alanı bilgilerini yükle
          if (role.hasScopeRestriction) {
            setHasScopeRestriction(true);
          }
          
          // Tüm grupları başlangıçta aç
          setExpandedGroups(new Set(Object.keys(PERMISSION_GROUPS)));
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
        // İzin kaldırılıyor - bağımlı izinleri kontrol et
        newSet.delete(permission);
        
        // Bu izni gerektiren diğer izinleri kontrol et
        const requiredBy = getRequiredBy(permission);
        requiredBy.forEach((reqBy) => {
          if (newSet.has(reqBy)) {
            // Eğer bu izni gerektiren başka bir izin seçiliyse, uyarı ver ama kaldırma
            // (Kullanıcı manuel olarak kaldırmak isterse kaldırabilir)
          }
        });
      } else {
        // İzin ekleniyor - bağımlı izinleri otomatik ekle
        newSet.add(permission);
        
        // Tüm bağımlı izinleri al ve ekle
        const dependencies = getAllDependencies(permission);
        dependencies.forEach((dep) => {
          newSet.add(dep);
        });
      }
      return newSet;
    });
  };

  const handleGroupToggle = (permissions: Permission[], checked: boolean) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev);
      // MEMBER_LIST_BY_PROVINCE iznini filtrele (checkbox'ta gösterilmiyor)
      const filteredPermissions = permissions.filter(p => p !== 'MEMBER_LIST_BY_PROVINCE');
      if (checked) {
        filteredPermissions.forEach((p) => newSet.add(p));
      } else {
        filteredPermissions.forEach((p) => newSet.delete(p));
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

      if (isEditMode && id) {
        const updateDto: UpdateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          hasScopeRestriction: hasScopeRestriction || undefined,
          // Scope'ları göndermiyoruz, sadece flag'i gönderiyoruz
        };
        await updateRole(id, updateDto);
        await updateRolePermissions(id, { permissions: permissionsArray });
      } else {
        const createDto: CreateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: permissionsArray,
          hasScopeRestriction: hasScopeRestriction || undefined,
          // Scope'ları göndermiyoruz, sadece flag'i gönderiyoruz
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
    INSTITUTION_MANAGEMENT: 'Kurum Yönetimi',
    ACCOUNTING: 'Muhasebe',
    MEMBER_PAYMENTS: 'Üye Ödemeleri',
    APPROVALS: 'Onay Süreçleri',
    PANEL_USER_APPLICATIONS: 'Panel Kullanıcı Başvuruları',
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
          {/* Eksik Bağımlılık Uyarısı */}
          {(() => {
            const allPermissions = Object.values(PERMISSION_GROUPS).flat() as Permission[];
            const missingDeps = getMissingDependencies(
              Array.from(selectedPermissions),
              allPermissions,
            );
            
            if (missingDeps.length > 0) {
              return (
                <Alert
                  severity="warning"
                  icon={<WarningIcon />}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.warning.main, 0.08),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    '& .MuiAlert-icon': {
                      color: theme.palette.warning.main,
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Eksik Bağımlı İzinler
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', mb: 1.5 }}>
                    Seçtiğiniz izinler için aşağıdaki bağımlı izinler otomatik olarak eklenecektir:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {missingDeps.map((dep) => (
                      <Chip
                        key={dep}
                        label={PERMISSION_LABELS[dep]}
                        size="small"
                        color="warning"
                        icon={<CheckCircleIcon />}
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Box>
                </Alert>
              );
            }
            return null;
          })()}
          
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
              // MEMBER_LIST_BY_PROVINCE iznini filtrele (checkbox'ta gösterilmiyor)
              const filteredPermissions = permissions.filter(p => p !== 'MEMBER_LIST_BY_PROVINCE');
              const allSelected = filteredPermissions.length > 0 && filteredPermissions.every((p) =>
                selectedPermissions.has(p),
              );
              const someSelected = filteredPermissions.some((p) =>
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
                          handleGroupToggle(filteredPermissions, e.target.checked);
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
                        label={`${filteredPermissions.filter((p) => selectedPermissions.has(p)).length}/${filteredPermissions.length}`}
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
                      {filteredPermissions.map((permission) => (
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
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                      {PERMISSION_LABELS[permission]}
                                    </Typography>
                                    {(() => {
                                      const deps = getAllDependencies(permission);
                                      if (deps.length > 0) {
                                        return (
                                          <Chip
                                            label={`${deps.length} bağımlı`}
                                            size="small"
                                            sx={{
                                              height: 18,
                                              fontSize: '0.65rem',
                                              backgroundColor: alpha(theme.palette.info.main, 0.1),
                                              color: theme.palette.info.main,
                                              fontWeight: 600,
                                            }}
                                          />
                                        );
                                      }
                                      return null;
                                    })()}
                                  </Box>
                                  {(() => {
                                    const deps = getAllDependencies(permission);
                                    if (deps.length > 0 && selectedPermissions.has(permission)) {
                                      return (
                                        <Box sx={{ mt: 0.5 }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              display: 'block',
                                              color: theme.palette.info.main,
                                              fontSize: '0.7rem',
                                              fontWeight: 500,
                                              mb: 0.5,
                                            }}
                                          >
                                            Otomatik eklenen bağımlı izinler:
                                          </Typography>
                                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {deps.map((dep) => (
                                              <Chip
                                                key={dep}
                                                label={PERMISSION_LABELS[dep]}
                                                size="small"
                                                sx={{
                                                  height: 20,
                                                  fontSize: '0.65rem',
                                                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                                                  color: theme.palette.success.main,
                                                  fontWeight: 500,
                                                }}
                                                icon={<CheckCircleIcon sx={{ fontSize: '0.75rem !important' }} />}
                                              />
                                            ))}
                                          </Box>
                                        </Box>
                                      );
                                    }
                                    return null;
                                  })()}
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

      {/* Yetki Alanı Seçimi Kartı */}
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
            backgroundColor: alpha(theme.palette.info.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocationOnIcon sx={{ color: theme.palette.info.main }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Yetki Alanı Ayarları
            </Typography>
          </Box>
        </Box>
        <Box sx={{ p: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasScopeRestriction}
                onChange={(e) => {
                  setHasScopeRestriction(e.target.checked);
                }}
                sx={{
                  '&.Mui-checked': {
                    color: theme.palette.info.main,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  Bu role il/ilçe bazlı yetki alanı eklenecek
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bu seçenek işaretlendiğinde, kullanıcılara bu rol atandığında (panel kullanıcı başvurusu oluşturulurken veya onaylanırken) 
                  yetki alanı (il/ilçe) seçimi zorunlu olacaktır. Rol seviyesinde scope tanımlanmaz, 
                  scope'lar her kullanıcıya rol atanırken belirlenir.
                </Typography>
              </Box>
            }
          />

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