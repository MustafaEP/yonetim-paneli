// src/pages/users/UsersListPage.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  Stack,
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

import type { UserListItem } from '../../../types/user';
import { getUsers, getUserById } from '../services/usersApi';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';

const UsersListPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
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

  const fetchUsers = React.useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getUsers();
      setRows(data);
    } catch (e: unknown) {
      console.error('Kullanıcılar alınırken hata:', e);
      toastRef.current.showError(getApiErrorMessage(e, 'Kullanıcılar alınırken bir hata oluştu.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Panel Kullanıcı Başvurusu onaylandığında listeyi güncelle (onaylanan üye panel kullanıcıları listesinde görünsün)
  useEffect(() => {
    const handlePanelUserApproved = () => {
      fetchUsers(false);
    };
    window.addEventListener('panelUserApproved', handlePanelUserApproved);
    return () => window.removeEventListener('panelUserApproved', handlePanelUserApproved);
  }, [fetchUsers]);

  return (
    <PageLayout>
      <PageHeader
        icon={<PeopleIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Panel Kullanıcıları"
        description="Sistemde tanımlı tüm kullanıcıları ve rollerini görüntüleyin"
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.06)}`,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Filtre Bölümü */}
        <Box
            sx={{
              p: { xs: 3, sm: 4 },
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
              borderBottom: `2px solid ${alpha(theme.palette.divider, 0.08)}`,
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
          <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              height: { xs: 450, sm: 550, md: 650 },
              minHeight: { xs: 450, sm: 550, md: 650 },
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                py: 2,
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
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                borderRadius: 0,
                minHeight: '56px !important',
                maxHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.9rem',
                color: theme.palette.text.primary,
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'center',
              },
              '& .MuiDataGrid-row': {
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.03),
                  boxShadow: `inset 4px 0 0 ${theme.palette.primary.main}`,
                },
                '&:nth-of-type(even)': {
                  backgroundColor: alpha(theme.palette.grey[50], 0.3),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.grey[50], 0.5),
                minHeight: '52px',
              },
              '& .MuiDataGrid-virtualScroller': {
                minHeight: '200px',
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
          </Box>
        </Card>
    </PageLayout>
  );
};

export default UsersListPage;