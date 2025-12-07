// src/pages/members/MembersApplicationsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid,type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

import type { MemberApplicationRow } from '../../types/member';
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

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');

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
      valueGetter: (params) => params.row.phone ?? '',
    },
    {
      field: 'email',
      headerName: 'E-posta',
      flex: 1.5,
      valueGetter: (params) => params.row.email ?? '',
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      valueGetter: (params) => params.row.province?.name ?? '',
    },
    {
      field: 'district',
      headerName: 'İlçe',
      flex: 1,
      valueGetter: (params) => params.row.district?.name ?? '',
    },
    {
      field: 'createdAt',
      headerName: 'Başvuru Tarihi',
      width: 150,
      valueFormatter: (params) =>
        params.value
          ? new Date(params.value as string).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : '',
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          size="small"
          color={params.row.status === 'PENDING' ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 130,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberApplicationRow>) => {
        const disabled = processingId === params.row.id;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {canApprove && (
              <Tooltip title="Onayla">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
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
            {canReject && (
              <Tooltip title="Reddet">
                <span>
                  <IconButton
                    size="small"
                    disabled={disabled}
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
          Onay bekleyen üye başvurularını görüntüleyebilir, onaylayabilir veya reddedebilirsiniz.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 500, mt: 2 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowClick={(params) => navigate(`/members/${params.id}`)}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default MembersApplicationsPage;
