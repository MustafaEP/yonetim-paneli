// src/pages/dues/DuesDebtsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  TextField,
  Button,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';

import type { DuesDebtRow } from '../../types/dues';
import { getDuesDebts } from '../../api/duesApi';

const DuesDebtsPage: React.FC = () => {
  const [rows, setRows] = useState<DuesDebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [since, setSince] = useState<string>(''); // ISO date string
  const [appliedSince, setAppliedSince] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  const columns: GridColDef<DuesDebtRow>[] = [
    {
      field: 'memberName',
      headerName: 'Üye',
      flex: 1.5,
      valueGetter: (_value, row: DuesDebtRow) =>
        row.member
          ? `${row.member.firstName} ${row.member.lastName}`
          : 'Bilinmeyen Üye',
    },
    {
      field: 'monthsOverdue',
      headerName: 'Geciken Ay',
      width: 130,
    },
    {
      field: 'totalDebt',
      headerName: 'Toplam Borç (TL)',
      width: 160,
      // 🔧 Güvenli formatter
      valueFormatter: (params: { value: number; field: string }) => {
        const raw = params?.value;
        if (raw == null) return '';
        const num = typeof raw === 'number' ? raw : Number(raw);
        if (Number.isNaN(num)) return '';
        return num.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
      },
    },
    {
      field: 'lastPaymentDate',
      headerName: 'Son Ödeme Tarihi',
      width: 180,
      // 🔧 Güvenli formatter
      valueFormatter: (params: { value: string | null; field: string }) => {
        const raw = params?.value as string | null | undefined;
        if (!raw) return 'Ödeme yok';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return 'Ödeme yok';
        return d.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      },
    },
  ];

  const fetchDebts = async (sinceParam?: string) => {
    setLoading(true);
    try {
      const data = await getDuesDebts(sinceParam);
      setRows(data);
      setAppliedSince(sinceParam);
    } catch (error) {
      console.error('Borçlu üyeler alınırken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // İlk yüklemede default parametreyi backend belirlesin (ör: 3 ay öncesi)
    fetchDebts();
  }, []);

  const handleFilterApply = () => {
    fetchDebts(since || undefined);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Borçlu Üyeler
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Belirli bir tarihten beri ödeme yapmayan üyeler listelenir.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            mt: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            label="Başlangıç Tarihi (since)"
            type="date"
            size="small"
            value={since}
            onChange={(e) => setSince(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <Button variant="contained" size="small" onClick={handleFilterApply}>
            Filtrele
          </Button>
          {appliedSince && (
            <Typography variant="caption" color="text.secondary">
              Uygulanan filtre: {appliedSince}
            </Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ height: 500, mt: 1 }}>
            <DataGrid
              rows={rows}
              columns={columns}
              getRowId={(row) => row.memberId}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowClick={(params) =>
                navigate(`/members/${params.row.memberId}`)
              }
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DuesDebtsPage;
