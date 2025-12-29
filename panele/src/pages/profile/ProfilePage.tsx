// src/pages/profile/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Stack,
  Divider,
  Avatar,
  Grid,
  Paper,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BusinessIcon from '@mui/icons-material/Business';
import PlaceIcon from '@mui/icons-material/Place';
import StoreIcon from '@mui/icons-material/Store';

import { useAuth } from '../../context/AuthContext';
import UserPermissionsSection from '../../components/users/UserPermissionsSection';
import { getUserScopes } from '../../api/regionsApi';
import type { UserScope } from '../../types/region';
import type { Role } from '../../types/user';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [scopes, setScopes] = useState<UserScope[]>([]);
  const [loadingScopes, setLoadingScopes] = useState(false);

  useEffect(() => {
    const loadScopes = async () => {
      if (!user) return;
      setLoadingScopes(true);
      try {
        const data = await getUserScopes(user.id);
        setScopes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Kullanıcı scope alınırken hata:', e);
        setScopes([]);
      } finally {
        setLoadingScopes(false);
      }
    };

    loadScopes();
  }, [user]);

  if (!user) {
    return (
      <Box sx={{ mt: 4 }}>
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
          <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Profil Yüklenemedi
          </Typography>
          <Typography color="text.secondary">
            Kullanıcı bilgileri yüklenemedi. Oturum süresi dolmuş olabilir.
          </Typography>
        </Paper>
      </Box>
    );
  }

  const roles = (user.roles ?? []) as Role[];
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 4 }}>
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
            <PersonIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Profilim
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Kişisel bilgileriniz ve yetki alanlarınızı görüntüleyin
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Sol Taraf - Kullanıcı Bilgileri */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                height: 120,
                position: 'relative',
              }}
            />
            <Box
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mt: -8,
              }}
            >
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: '#fff',
                  color: theme.palette.primary.main,
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  border: `4px solid ${theme.palette.background.paper}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  mb: 2,
                }}
              >
                {initials}
              </Avatar>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  textAlign: 'center',
                }}
              >
                {user.firstName} {user.lastName}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'text.secondary',
                  mb: 3,
                }}
              >
                <EmailIcon sx={{ fontSize: '1rem' }} />
                <Typography variant="body2">{user.email}</Typography>
              </Box>

              <Divider sx={{ width: '100%', mb: 3 }} />

              {/* Roller */}
              <Box sx={{ width: '100%' }}>
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
                    <VerifiedUserIcon
                      sx={{
                        fontSize: '1.1rem',
                        color: theme.palette.primary.main,
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Rollerim
                  </Typography>
                </Box>
                {roles.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {roles.map((r) => (
                      <Chip
                        key={r}
                        label={r}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15),
                          },
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      backgroundColor: alpha(theme.palette.grey[500], 0.05),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Size henüz rol atanmadı.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Sağ Taraf - Detaylar */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* İzinler */}
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
                  pb: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.02),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 14px 0 ${alpha(theme.palette.info.main, 0.3)}`,
                    }}
                  >
                    <BadgeIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    İzinlerim
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ p: 3 }}>
                <UserPermissionsSection permissions={user.permissions} />
              </Box>
            </Card>

            {/* Yetki Alanları */}
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
                  pb: 2,
                  backgroundColor: alpha(theme.palette.success.main, 0.02),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                  >
                    <LocationOnIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Yetkili Olduğum Bölgeler
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', fontSize: '0.875rem', mt: 0.5 }}
                    >
                      Hangi il / ilçe / işyeri / bayi üzerinde yetkili olduğunuzu gösterir
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {loadingScopes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : scopes.length === 0 ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      backgroundColor: alpha(theme.palette.grey[500], 0.05),
                      borderRadius: 2,
                      border: `1px dashed ${alpha(theme.palette.divider, 0.2)}`,
                    }}
                  >
                    <LocationOnIcon
                      sx={{
                        fontSize: 56,
                        color: alpha(theme.palette.text.secondary, 0.5),
                        mb: 2,
                      }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      Bölgesel Yetki Yok
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Herhangi bir bölgesel yetkiniz bulunmuyor.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {scopes.map((s, index) => (
                      <Paper
                        key={s.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.02),
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: s.province || s.district || s.dealer ? 1.5 : 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1,
                              backgroundColor: alpha(theme.palette.success.main, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.success.main,
                              }}
                            >
                              {index + 1}
                            </Typography>
                          </Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, color: 'text.secondary' }}
                          >
                            Yetki Alanı #{index + 1}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {s.province && (
                            <Chip
                              icon={<PlaceIcon sx={{ fontSize: '1rem' }} />}
                              size="small"
                              label={s.province.name}
                              sx={{
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                '& .MuiChip-icon': {
                                  color: theme.palette.primary.main,
                                },
                              }}
                            />
                          )}

                          {s.district && (
                            <Chip
                              icon={<LocationOnIcon sx={{ fontSize: '1rem' }} />}
                              size="small"
                              label={s.district.name}
                              sx={{
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                color: theme.palette.info.main,
                                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                                '& .MuiChip-icon': {
                                  color: theme.palette.info.main,
                                },
                              }}
                            />
                          )}

                          {s.dealer && (
                            <Chip
                              icon={<StoreIcon sx={{ fontSize: '1rem' }} />}
                              size="small"
                              label={s.dealer.name}
                              sx={{
                                fontWeight: 600,
                                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                color: theme.palette.warning.main,
                                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                                '& .MuiChip-icon': {
                                  color: theme.palette.warning.main,
                                },
                              }}
                            />
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;