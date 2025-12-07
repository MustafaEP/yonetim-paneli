import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import type { MemberListItem, MemberStatus } from '../../types/member';
import { getMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../utils/permissions';

const MembersListPage: React.FC = () => {
  const [rows, setRows] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();

  const isHighLevel = hasAnyRole(user, [
    'ADMIN',
    'GENEL_BASKAN',
    'GENEL_BASKAN_YRD',
    'GENEL_SEKRETER',
  ]);

  const columns: GridColDef<MemberListItem>[] = [
    { field: 'firstName', headerName: 'Ad', flex: 1 },
    { field: 'lastName', headerName: 'Soyad', flex: 1 },
    {
      field: 'status',
      headerName: 'Durum',
      flex: 1,
      valueFormatter: (params: { value: MemberStatus; field: string }) => {
        switch (params.value) {
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
            return String(params.value);
        }
      },
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
          Yetkili olduğunuz bölgedeki aktif üyeler listelenir.
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

export default MembersListPage;
