// src/pages/users/UsersListPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';

import type { UserListItem } from '../../types/user';
import { getUsers } from '../../api/usersApi';

const UsersListPage: React.FC = () => {
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
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1.5,
    },
    {
      field: 'roles',
      headerName: 'Roller',
      flex: 2,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {params.row.roles.map((r) => (
            <Chip key={r} label={r} size="small" />
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
          <Chip label="Aktif" color="success" size="small" />
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
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Kullanıcılar
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sistemde tanımlı kullanıcılar ve rollerini görüntüleyebilirsiniz.
        </Typography>

        {/* Arama ve Filtre */}
        <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
          <TextField
            placeholder="Ara (Ad, Soyad, E-posta, Rol)..."
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
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="INACTIVE">Pasif</MenuItem>
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
                Toplam {filteredRows.length} kullanıcı bulundu
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

export default UsersListPage;
