// src/pages/dues/DuesDebtsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  Stack,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';

import type { DuesDebtRow } from '../../types/dues';
import { getDuesDebts } from '../../api/duesApi';

const DuesDebtsPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<DuesDebtRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [since, setSince] = useState<string>('');
  const [appliedSince, setAppliedSince] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const columns: GridColDef<DuesDebtRow>[] = [
    {
      field: 'memberName',
      headerName: 'Üye',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row: DuesDebtRow) =>
        row.member
          ? `${row.member.firstName} ${row.member.lastName}`
          : 'Bilinmeyen Üye',
    },
    {
      field: 'monthsOverdue',
      headerName: 'Geciken Ay',
      width: 130,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'totalDebt',
      headerName: 'Toplam Borç',
      width: 160,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (_value, row: DuesDebtRow) => {
        const debt = row.totalDebt;
        if (debt == null || debt === undefined) return 0;
        return typeof debt === 'number' ? debt : Number(debt) || 0;
      },
      valueFormatter: (value: number | null | undefined) => {
        if (value == null || value === undefined) return '₺0,00';
        const num = typeof value === 'number' ? value : Number(value) || 0;
        if (Number.isNaN(num)) return '₺0,00';
        return num.toLocaleString('tr-TR', { 
          style: 'currency', 
          currency: 'TRY',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        });
      },
    },
    {
      field: 'lastPaymentDate',
      headerName: 'Son Ödeme Tarihi',
      width: 180,
      valueFormatter: (params: { value: string | null; field: string }) => {
        const raw = params?.value as string | null | undefined;
        if (!raw) return 'Ödeme yok';
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return 'Ödeme yok';
        return d.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
  ];

  const fetchDebts = async (sinceParam?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDuesDebts(sinceParam);
      setRows(data);
      setAppliedSince(sinceParam);
    } catch (error: any) {
      console.error('Borçlu üyeler alınırken hata:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Borçlu üyeler alınırken bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleFilterApply = () => {
    fetchDebts(since || undefined);
  };

  const totalDebt = rows.reduce((sum, row) => {
    const debt = typeof row.totalDebt === 'number' ? row.totalDebt : Number(row.totalDebt) || 0;
    return sum + debt;
  }, 0);

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
              background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            <AccountBalanceWalletIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Borçlu Üyeler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Belirli bir tarihten beri ödeme yapmayan üyeleri görüntüleyin
            </Typography>
          </Box>
        </Box>
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
            backgroundColor: alpha(theme.palette.error.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <TextField
              label="Başlangıç Tarihi"
              type="date"
              size="small"
              fullWidth
              value={since}
              onChange={(e) => setSince(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
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
            <Button
              variant="contained"
              onClick={handleFilterApply}
              startIcon={<FilterListIcon />}
              sx={{
                minWidth: { xs: '100%', sm: 140 },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              Filtrele
            </Button>
          </Stack>
          {appliedSince && (
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1.5, 
                display: 'block',
                color: theme.palette.text.secondary,
                fontStyle: 'italic',
              }}
            >
              Uygulanan filtre: {new Date(appliedSince).toLocaleDateString('tr-TR')}
            </Typography>
          )}
        </Box>

        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* İstatistik Kartları */}
          {!loading && rows.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.error.dark,
                    mb: 1,
                  }}
                >
                  Toplam Borçlu Üye
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.error.main,
                  }}
                >
                  {rows.length}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  backgroundColor: alpha(theme.palette.warning.main, 0.08),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.warning.dark,
                    mb: 1,
                  }}
                >
                  Toplam Borç Tutarı
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.warning.main,
                  }}
                >
                  {totalDebt.toLocaleString('tr-TR', { 
                    style: 'currency', 
                    currency: 'TRY',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Tablo */}
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
                backgroundColor: alpha(theme.palette.error.main, 0.04),
                borderBottom: `2px solid ${alpha(theme.palette.error.main, 0.1)}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.02),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              },
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.memberId}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              onRowClick={(params) => navigate(`/members/${params.row.memberId}`)}
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

export default DuesDebtsPage;