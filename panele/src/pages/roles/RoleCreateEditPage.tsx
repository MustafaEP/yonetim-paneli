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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

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

      if (isEditMode && id) {
        const updateDto: UpdateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
        };
        await updateRole(id, updateDto);
        await updateRolePermissions(id, { permissions: permissionsArray });
      } else {
        const createDto: CreateRoleDto = {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: permissionsArray,
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
                        <Paper
                          key={permission}
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
                              <Typography sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                {PERMISSION_LABELS[permission]}
                              </Typography>
                            }
                            sx={{ m: 0, width: '100%' }}
                          />
                        </Paper>
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