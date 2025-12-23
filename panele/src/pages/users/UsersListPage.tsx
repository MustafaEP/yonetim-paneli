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
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import FilterListIcon from '@mui/icons-material/FilterList';

import type { UserListItem } from '../../types/user';
import { getUsers } from '../../api/usersApi';

const UsersListPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const navigate = useNavigate();

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
      field: 'firstName',
      headerName: 'Ad',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'roles',
      headerName: 'Roller',
      flex: 2,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
          {params.row.roles.map((r) => (
            <Chip 
              key={r} 
              label={r} 
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 500 }}
            />
          ))}
        </Box>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 120,
      renderCell: (params: GridRenderCellParams<UserListItem>) =>
        params.row.isActive ? (
          <Chip label="Aktif" color="success" size="small" sx={{ fontWeight: 500 }} />
        ) : (
          <Chip label="Pasif" size="small" />
        ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<UserListItem>) => (
        <Tooltip title="Detay">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/users/${params.row.id}`);
            }}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
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

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
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
            <PeopleIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Panel Kullanıcıları
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Sistemde tanımlı tüm kullanıcıları ve rollerini görüntüleyin
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              placeholder="Ad, Soyad, E-posta, Rol..."
              size="small"
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: { xs: '100%', sm: 220 },
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                },
              }}
            >
              <InputLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FilterListIcon fontSize="small" />
                  Durum
                </Box>
              </InputLabel>
              <Select
                value={statusFilter}
                label="Durum"
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
                }
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="ACTIVE">Aktif</MenuItem>
                <MenuItem value="INACTIVE">Pasif</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sonuç Sayısı */}
          {!loading && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.info.main,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <PeopleIcon fontSize="small" />
                Toplam {filteredRows.length} kullanıcı bulundu
              </Typography>
            </Paper>
          )}

          {/* Tablo - Her zaman render edilir, loading state'i DataGrid'e geçirilir */}
          <Box
            sx={{
              height: { xs: 400, sm: 500, md: 600 },
              minHeight: { xs: 400, sm: 500, md: 600 },
              '& .MuiDataGrid-root': {
                border: 'none',
                borderRadius: 2,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
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
              sx={{
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '200px',
                },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default UsersListPage;