import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
  Button,
  Stack,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import type { MemberListItem, MemberStatus } from '../../types/member';
import { getMembers } from '../../api/membersApi';

const MembersListPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Filtrelenmiş veriler
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Durum filtresi
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Arama filtresi
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower) ||
          row.phone?.toLowerCase().includes(searchLower) ||
          row.email?.toLowerCase().includes(searchLower) ||
          row.province?.name.toLowerCase().includes(searchLower) ||
          row.district?.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, statusFilter, searchText]);

  const getStatusLabel = (status: MemberStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif';
      case 'PENDING':
        return 'Onay Bekliyor';
      case 'RESIGNED':
        return 'İstifa';
      case 'EXPELLED':
        return 'İhraç';
      case 'REJECTED':
        return 'Reddedildi';
      case 'INACTIVE':
        return 'Pasif';
      default:
        return String(status);
    }
  };

  const getStatusColor = (status: MemberStatus): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'EXPELLED':
        return 'error';
      case 'RESIGNED':
      case 'INACTIVE':
        return 'default';
      default:
        return 'info';
    }
  };

  const columns: GridColDef<MemberListItem>[] = [
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
      field: 'status',
      headerName: 'Durum',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          size="small"
          color={getStatusColor(params.row.status)}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 100,
      valueGetter: (_value, row: MemberListItem) => row.province?.name ?? '-',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row: MemberListItem) => row.district?.name ?? '-',
    },
    {
      field: 'duesPlan',
      headerName: 'Aidat Planı',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row: MemberListItem) => {
        if (row.duesPlan) {
          const amount = typeof row.duesPlan.amount === 'string' 
            ? parseFloat(row.duesPlan.amount) 
            : row.duesPlan.amount;
          return `${row.duesPlan.name} (${amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})`;
        }
        return '-';
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Tooltip title="Detay">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/${params.row.id}`);
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
    const fetchMembers = async () => {
      try {
        setError(null);
        console.log('[MembersListPage] Fetching members...');
        const data = await getMembers();
        console.log('[MembersListPage] Received members:', data);
        setRows(data);
      } catch (error: any) {
        console.error('Üyeler alınırken hata:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Üyeler alınırken bir hata oluştu';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
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
              Üyeler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Yetkili olduğunuz bölgedeki tüm üyeleri görüntüleyin ve yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/members/applications/new')}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            Yeni Üye
          </Button>
        </Box>

        {/* Mobile New Member Button */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          fullWidth
          onClick={() => navigate('/members/applications/new')}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            mt: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          Yeni Üye Başvurusu
        </Button>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

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
              placeholder="Ad, Soyad, Telefon, E-posta, İl, İlçe..."
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
                onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="ACTIVE">Aktif</MenuItem>
                <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
                <MenuItem value="INACTIVE">Pasif</MenuItem>
                <MenuItem value="RESIGNED">İstifa</MenuItem>
                <MenuItem value="EXPELLED">İhraç</MenuItem>
                <MenuItem value="REJECTED">Reddedildi</MenuItem>
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
                Toplam {filteredRows.length} üye bulundu
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

export default MembersListPage;