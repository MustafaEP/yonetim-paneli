// src/pages/users/UsersListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  InputAdornment,
  useTheme,
  alpha,
  Paper,
  Stack,
  Grid,
  Fade,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import type { UserListItem } from '../../types/user';
import { getUsers, getUserById } from '../../api/usersApi';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/layout/PageHeader';

const UsersListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filtrelenmiş veriler
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Durum filtresi
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((row) =>
        statusFilter === 'ACTIVE' ? row.isActive : !row.isActive,
      );
    }

    // Arama filtresi
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower) ||
          row.email.toLowerCase().includes(searchLower) ||
          row.roles.some((role) => role.toLowerCase().includes(searchLower)),
      );
    }

    return filtered;
  }, [rows, statusFilter, searchText]);

  const columns: GridColDef<UserListItem>[] = [
    {
      field: 'fullName',
      headerName: 'Kullanıcı',
      flex: 1.5,
      minWidth: 200,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<UserListItem>) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {params.row.firstName} {params.row.lastName}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.25 }}>
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'roles',
      headerName: 'Roller',
      flex: 2,
      minWidth: 250,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
          {params.row.roles.map((r, idx) => (
            <Chip 
              key={`${r}-${idx}`}
              label={r} 
              size="small"
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-label': { px: 1.5 }
              }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<UserListItem>) =>
        params.row.isActive ? (
          <Chip 
            icon={<CheckCircleIcon />}
            label="Aktif" 
            color="success" 
            size="small" 
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { fontSize: '1rem' }
            }} 
          />
        ) : (
          <Chip 
            icon={<CancelIcon />}
            label="Pasif" 
            color="default"
            size="small"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { fontSize: '1rem' }
            }}
          />
        ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<UserListItem>) => (
        <Tooltip title="Detay Görüntüle" arrow placement="top">
          <IconButton
            size="small"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                // Kullanıcı detayını çek ve member bilgisini kontrol et
                const userDetail = await getUserById(params.row.id);
                if (userDetail.member?.id) {
                  // Üye varsa üye detay sayfasına yönlendir
                  navigate(`/members/${userDetail.member.id}`);
                } else {
                  // Admin kullanıcı veya üye bilgisi yok
                  toast.showWarning('Bu kullanıcının üye bilgisi bulunmuyor. Admin kullanıcılar üye detay sayfasına sahip değildir.');
                }
              } catch (error) {
                console.error('Kullanıcı detayı alınırken hata:', error);
                toast.showError('Kullanıcı bilgileri alınırken bir hata oluştu.');
              }
            }}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setRows(data);
      } catch (e) {
        console.error('Kullanıcılar alınırken hata:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const activeUsersCount = filteredRows.filter(u => u.isActive).length;
  const inactiveUsersCount = filteredRows.filter(u => !u.isActive).length;

  return (
    <Fade in timeout={300}>
      <Box sx={{ pb: 4 }}>
        {/* Başlık Bölümü */}
        <PageHeader
          icon={<PeopleIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title="Panel Kullanıcıları"
          description="Sistemde tanımlı tüm kullanıcıları ve rollerini görüntüleyin"
          color={theme.palette.primary.main}
          darkColor={theme.palette.primary.dark}
          lightColor={theme.palette.primary.light}
          sx={{ mb: 0 }}
        />
        <Box sx={{ mb: 4 }}>

          {/* İstatistik Kartları */}
          {!loading && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Toplam Kullanıcı
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, textAlign: 'left' }}>
                        {filteredRows.length}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: alpha(theme.palette.primary.main, 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Aktif Kullanıcı
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, textAlign: 'left' }}>
                        {activeUsersCount}
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: alpha(theme.palette.success.main, 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.grey[500], 0.1)} 0%, ${alpha(theme.palette.grey[300], 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.grey[500], 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Pasif Kullanıcı
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.grey[600], textAlign: 'left' }}>
                        {inactiveUsersCount}
                      </Typography>
                    </Box>
                    <CancelIcon sx={{ fontSize: 40, color: alpha(theme.palette.grey[500], 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Ana Kart */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* Filtre Bölümü */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                placeholder="Ad, Soyad, E-posta, Rol..."
                size="medium"
                fullWidth
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.primary.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  },
                }}
              />
              <FormControl
                size="medium"
                sx={{
                  minWidth: { xs: '100%', sm: 240 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  },
                }}
              >
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon fontSize="small" />
                    Durum Filtrele
                  </Box>
                </InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum Filtrele"
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                  }
                >
                  <MenuItem value="ALL">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" />
                      Tüm Kullanıcılar
                    </Box>
                  </MenuItem>
                  <MenuItem value="ACTIVE">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                      Aktif
                    </Box>
                  </MenuItem>
                  <MenuItem value="INACTIVE">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon fontSize="small" sx={{ color: theme.palette.grey[500] }} />
                      Pasif
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* DataGrid */}
          <Box
            sx={{
              height: { xs: 500, sm: 600, md: 700 },
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                display: 'flex',
                alignItems: 'center',
                '&:focus': {
                  outline: 'none',
                },
                '&:focus-within': {
                  outline: 'none',
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 0,
                minHeight: '56px !important',
                maxHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'center',
              },
              '& .MuiDataGrid-row': {
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  transform: 'scale(1.001)',
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.grey[50], 0.5),
              },
              '& .MuiDataGrid-virtualScroller': {
                minHeight: '300px',
              },
            }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              onRowClick={async (params) => {
                try {
                  // Kullanıcı detayını çek ve member bilgisini kontrol et
                  const userDetail = await getUserById(params.row.id);
                  if (userDetail.member?.id) {
                    // Üye varsa üye detay sayfasına yönlendir
                    navigate(`/members/${userDetail.member.id}`);
                  } else {
                    // Admin kullanıcı veya üye bilgisi yok
                    toast.showWarning('Bu kullanıcının üye bilgisi bulunmuyor. Admin kullanıcılar üye detay sayfasına sahip değildir.');
                  }
                } catch (error) {
                  console.error('Kullanıcı detayı alınırken hata:', error);
                  toast.showError('Kullanıcı bilgileri alınırken bir hata oluştu.');
                }
              }}
            />
          </Box>
        </Card>
      </Box>
    </Fade>
  );
};

export default UsersListPage;