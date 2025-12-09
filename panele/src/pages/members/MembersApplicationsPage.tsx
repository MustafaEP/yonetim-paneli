// src/pages/members/MembersApplicationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';

import type { MemberApplicationRow, MemberStatus } from '../../types/member';
import {
  getMemberApplications,
  approveMember,
  rejectMember,
} from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';

const MembersApplicationsPage: React.FC = () => {
  const [rows, setRows] = useState<MemberApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');

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
      case 'PENDING':
        return 'Onay Bekliyor';
      case 'ACTIVE':
        return 'Aktif';
      case 'REJECTED':
        return 'Reddedildi';
      case 'ISTIFA':
        return 'İstifa';
      case 'IHRAC':
        return 'İhraç';
      case 'PASIF':
        return 'Pasif';
      default:
        return String(status);
    }
  };

  const getStatusColor = (
    status: MemberStatus,
  ): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACTIVE':
        return 'success';
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

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await getMemberApplications();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Üye başvuruları alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (id: string) => {
    if (!canApprove) return;
    if (!window.confirm('Bu başvuruyu onaylamak istediğinize emin misiniz?')) return;

    setProcessingId(id);
    try {
      await approveMember(id);
      await loadApplications();
    } catch (e) {
      console.error('Başvuru onaylanırken hata:', e);
      window.alert('Başvuru onaylanırken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!canReject) return;
    if (!window.confirm('Bu başvuruyu reddetmek istediğinize emin misiniz?')) return;

    setProcessingId(id);
    try {
      await rejectMember(id);
      await loadApplications();
    } catch (e) {
      console.error('Başvuru reddedilirken hata:', e);
      window.alert('Başvuru reddedilirken bir hata oluştu.');
    } finally {
      setProcessingId(null);
    }
  };

  const columns: GridColDef<MemberApplicationRow>[] = [
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
      field: 'phone',
      headerName: 'Telefon',
      flex: 1,
      valueGetter: (params: { row?: MemberApplicationRow }) => params?.row?.phone ?? '',
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1.5,
      valueGetter: (params: { row?: MemberApplicationRow }) => params?.row?.email ?? '',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params: { row?: MemberApplicationRow }) => params?.row?.province?.name ?? '',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 1,
      valueGetter: (params: { row?: MemberApplicationRow }) => params?.row?.district?.name ?? '',
    },
    {
      field: 'createdAt',
      headerName: 'Başvuru Tarihi',
      width: 150,
      valueFormatter: (params: { value: string | null | undefined }) =>
        params.value
          ? new Date(params.value).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '',
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 140,
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          size="small"
          color={getStatusColor(params.row.status)}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 180,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const disabled = processingId === params.row.id;
        const isPending = params.row.status === 'PENDING';
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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
            {canApprove && isPending && (
              <Tooltip title="Onayla">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApprove(params.row.id);
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {canReject && isPending && (
              <Tooltip title="Reddet">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(params.row.id);
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Üye Başvuruları
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Üye başvurularını görüntüleyebilir, onaylayabilir veya reddedebilirsiniz.
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
              <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="REJECTED">Reddedildi</MenuItem>
              <MenuItem value="ISTIFA">İstifa</MenuItem>
              <MenuItem value="IHRAC">İhraç</MenuItem>
              <MenuItem value="PASIF">Pasif</MenuItem>
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
                Toplam {filteredRows.length} başvuru bulundu
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

export default MembersApplicationsPage;
