import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

import type { MemberListItem, MemberStatus } from '../../types/member';
import { getMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/permissions';

const MembersListPage: React.FC = () => {
  const [rows, setRows] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');

  const navigate = useNavigate();
  const { user } = useAuth();

  const isHighLevel = hasAnyRole(user, [
    'ADMIN',
    'GENEL_BASKAN',
    'GENEL_BASKAN_YRD',
    'GENEL_SEKRETER',
  ]);

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
      case 'ISTIFA':
        return 'İstifa';
      case 'IHRAC':
        return 'İhraç';
      case 'REJECTED':
        return 'Reddedildi';
      case 'PASIF':
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
      case 'IHRAC':
        return 'error';
      case 'ISTIFA':
      case 'PASIF':
        return 'default';
      default:
        return 'info';
    }
  };

  const columns: GridColDef<MemberListItem>[] = [
    { field: 'firstName', headerName: 'Ad', flex: 1 },
    { field: 'lastName', headerName: 'Soyad', flex: 1 },
    {
      field: 'status',
      headerName: 'Durum',
      flex: 1,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          size="small"
          color={getStatusColor(params.row.status)}
        />
      ),
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      valueGetter: (_value, row: MemberListItem) => row.province?.name ?? '-',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 1,
      valueGetter: (_value, row: MemberListItem) => row.district?.name ?? '-',
    },
    // Yüksek roller için ekstra bir id sütunu
    ...(isHighLevel
      ? ([
          {
            field: 'id',
            headerName: 'Üye ID',
            flex: 1,
          } as GridColDef<MemberListItem>,
        ] as GridColDef<MemberListItem>[])
      : []),
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
        const data = await getMembers();
        setRows(data);
      } catch (error) {
        console.error('Üyeler alınırken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Üyeler
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Yetkili olduğunuz bölgedeki üyeler listelenir.
        </Typography>

        {/* Arama ve Filtre */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
          <TextField
            placeholder="Ara (Ad, Soyad, Telefon, E-posta, İl, İlçe)..."
            size="small"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Durum Filtresi</InputLabel>
            <Select
              value={statusFilter}
              label="Durum Filtresi"
              onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
              <MenuItem value="PASIF">Pasif</MenuItem>
              <MenuItem value="ISTIFA">İstifa</MenuItem>
              <MenuItem value="IHRAC">İhraç</MenuItem>
              <MenuItem value="REJECTED">Reddedildi</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Toplam {filteredRows.length} üye bulundu
              </Typography>
            </Box>
            <Box sx={{ height: 500 }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowId={(row) => row.id}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
                disableRowSelectionOnClick
              />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersListPage;
