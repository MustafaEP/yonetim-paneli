// src/pages/users/UsersListPage.tsx
import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, CircularProgress } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import type { UserListItem } from '../../types/user';
import { getUsers } from '../../api/usersApi';

const UsersListPage: React.FC = () => {
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

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
      renderCell: (params) =>
        params.row.isActive ? (
          <Chip label="Aktif" color="success" size="small" />
        ) : (
          <Chip label="Pasif" size="small" />
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
          Sistemde tanımlı kullanıcılar ve rollerini görüntülersiniz.
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
              onRowClick={(params) => navigate(`/users/${params.id}`)}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersListPage;
