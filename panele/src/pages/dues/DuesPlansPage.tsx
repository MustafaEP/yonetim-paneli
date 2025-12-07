import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { type DuesPlan } from '../../types/dues';
import { getDuesPlans } from '../../api/duesApi';
import { useAuth } from '../../context/AuthContext';
import { canManageDuesPlans, hasAnyRole } from '../../utils/permissions';

const DuesPlansPage: React.FC = () => {
  const [rows, setRows] = useState<DuesPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const isManager = canManageDuesPlans(user);
  const isHighLevel = hasAnyRole(user, ['ADMIN', 'GENEL_BASKAN', 'GENEL_SEKRETER']);

  const columns: GridColDef<DuesPlan>[] = [
    { field: 'name', headerName: 'Plan Adı', flex: 1 },
    { field: 'description', headerName: 'Açıklama', flex: 1 },
    {
      field: 'amount',
      headerName: 'Tutar (TL)',
      width: 140,
    },
    {
      field: 'period',
      headerName: 'Periyot',
      width: 140,
      valueFormatter: (params) =>
        params.value === 'MONTHLY' ? 'Aylık' : 'Yıllık',
    },
    {
      field: 'isActive',
      headerName: 'Durum',
      width: 140,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Aktif" color="success" size="small" />
        ) : (
          <Chip label="Pasif" size="small" />
        ),
    },
  ];

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Üst seviye roller pasif planları da görebilir
        const data = await getDuesPlans(isHighLevel);
        setRows(data);
      } catch (error) {
        console.error('Aidat planları alınırken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [isHighLevel]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Aidat Planları
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sistemde tanımlı aidat planları listelenir.{' '}
          {isHighLevel
            ? '(Aktif + pasif planlar görünüyor.)'
            : '(Sadece aktif planlar görünüyor.)'}
        </Typography>

        {/* İleride: isManager ise "Yeni Plan Ekle" butonu vs. ekleyebiliriz */}
        {isManager && (
          <Typography variant="caption" color="text.secondary">
            (Bu ekranda plan yönetimi yapmaya yetkilisiniz.)
          </Typography>
        )}

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
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DuesPlansPage;
