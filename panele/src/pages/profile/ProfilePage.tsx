// src/pages/profile/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  Avatar,
  Grid,
  Paper,
  CircularProgress,
} from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { useAuth } from '../../context/AuthContext';
import UserPermissionsSection from '../../components/users/UserPermissionsSection';
import { getUserScopes } from '../../api/regionsApi';
import type { UserScope } from '../../types/region';
import type { Role } from '../../types/user';

const ProfilePage: React.FC = () => {
  const { user } = useAuth(); // adın farklıysa uyarlarsın
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
        <Typography variant="h6">Profil</Typography>
        <Typography color="text.secondary">
          Kullanıcı bilgileri yüklenemedi. Oturum süresi dolmuş olabilir.
        </Typography>
      </Box>
    );
  }

  const roles = (user.roles ?? []) as Role[];
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Profilim
      </Typography>

      <Grid container spacing={3}>
        {/* Sol Taraf - Kullanıcı Bilgileri */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mb: 2,
                  }}
                >
                  {initials}
                </Avatar>
                <Typography variant="h5" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rollerim
                </Typography>
                {roles.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {roles.map((r) => (
                      <Chip key={r} label={r} size="small" color="primary" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Size henüz rol atanmadı.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sağ Taraf - Detaylar */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* İzinler */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BadgeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">İzinlerim</Typography>
                </Box>
                <UserPermissionsSection permissions={user.permissions} />
              </CardContent>
            </Card>

            {/* Yetki Alanları */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Yetkili Olduğum Bölgeler</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Bu alan, hangi il / ilçe / işyeri / bayi üzerinde yetkili olduğunuzu gösterir.
                </Typography>

                {loadingScopes ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : scopes.length === 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      bgcolor: 'action.hover',
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Herhangi bir bölgesel yetkiniz bulunmuyor.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {scopes.map((s) => (
                      <Paper
                        key={s.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                          {s.province && (
                            <Chip
                              size="small"
                              label={`İl: ${s.province.name}`}
                              color="primary"
                              variant="outlined"
                            />
                          )}

                          {s.district && (
                            <Chip
                              size="small"
                              label={`İlçe: ${s.district.name}`}
                              color="primary"
                              variant="outlined"
                            />
                          )}

                          {s.workplace && (
                            <Chip
                              size="small"
                              label={`İşyeri: ${s.workplace.name}`}
                              color="success"
                              variant="outlined"
                            />
                          )}

                          {s.dealer && (
                            <Chip
                              size="small"
                              label={`Bayi: ${s.dealer.name}`}
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;
