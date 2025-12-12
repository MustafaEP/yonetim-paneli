// src/pages/dues/DuesMemberPaymentsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Card,
  useTheme,
  alpha,
  InputAdornment,
  Stack,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import NotesIcon from '@mui/icons-material/Notes';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import { duesApi } from '../../api/duesApi';
import { membersApi } from '../../api/membersApi';
import type { CreateDuesPaymentDto, DuesPayment } from '../../types/dues';

type PaymentWithMember = DuesPayment & { memberName: string };

const DuesMemberPaymentsPage: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDuesPaymentDto>({
    memberId: '',
    amount: 0,
  });
  const queryClient = useQueryClient();

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => membersApi.listMembers(),
  });

  const { data: allPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['all-dues-payments'],
    queryFn: async () => {
      if (!members || members.length === 0) return [];
      
      const paymentPromises = members.map((member) =>
        duesApi.getMemberPayments(member.id).catch(() => [])
      );
      
      const paymentsArrays = await Promise.all(paymentPromises);
      const allPayments: PaymentWithMember[] = [];
      
      paymentsArrays.forEach((payments, index) => {
        const member = members[index];
        payments.forEach((payment) => {
          allPayments.push({
            ...payment,
            memberName: `${member.firstName} ${member.lastName}`,
          });
        });
      });
      
      return allPayments.sort(
        (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
      );
    },
    enabled: !!members && members.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: duesApi.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-dues-payments'] });
      setOpen(false);
      setFormData({
        memberId: '',
        amount: 0,
      });
    },
  });

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const totalAmount = useMemo(() => {
    return allPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  }, [allPayments]);

  const columns: GridColDef<PaymentWithMember>[] = [
    {
      field: 'memberName',
      headerName: 'Üye',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params: GridRenderCellParams<PaymentWithMember>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <strong>{params.value}</strong>
        </Box>
      ),
    },
    {
      field: 'amount',
      headerName: 'Tutar',
      flex: 1,
      minWidth: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<PaymentWithMember>) => (
        <Chip
          label={params.value.toLocaleString('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          color="success"
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'paidAt',
      headerName: 'Ödeme Tarihi',
      flex: 1.2,
      minWidth: 150,
      valueFormatter: (value: string) => {
        return new Date(value).toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      },
    },
    {
      field: 'period',
      headerName: 'Dönem',
      flex: 0.8,
      minWidth: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PaymentWithMember>) => {
        if (params.row.periodYear && params.row.periodMonth) {
          return (
            <Chip
              label={`${params.row.periodYear}/${String(params.row.periodMonth).padStart(2, '0')}`}
              size="small"
              variant="outlined"
              color="primary"
            />
          );
        }
        return '-';
      },
    },
    {
      field: 'note',
      headerName: 'Not',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<PaymentWithMember>) => (
        params.value ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {params.value}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
            -
          </Typography>
        )
      ),
    },
  ];

  if (membersLoading || paymentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

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
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <PaymentIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Aidat Ödemeleri
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Tüm aidat ödemelerini görüntüleyin ve yeni ödeme ekleyin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
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
            Yeni Ödeme
          </Button>
        </Box>

        {/* Mobile Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          fullWidth
          onClick={() => setOpen(true)}
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
          Yeni Ödeme Kaydı
        </Button>
      </Box>

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
        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* İstatistik Kartları */}
          {allPayments && allPayments.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.dark, fontSize: '1.2rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.success.dark,
                    }}
                  >
                    Toplam Tahsilat
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.success.main,
                  }}
                >
                  {totalAmount.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  backgroundColor: alpha(theme.palette.info.main, 0.08),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ReceiptIcon sx={{ color: theme.palette.info.dark, fontSize: '1.2rem' }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.info.dark,
                    }}
                  >
                    Toplam İşlem
                  </Typography>
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.info.main,
                  }}
                >
                  {allPayments.length}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Tablo veya Boş Durum */}
          {allPayments && allPayments.length === 0 ? (
            <Alert 
              severity="info"
              sx={{
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              Henüz ödeme kaydı bulunmamaktadır.
            </Alert>
          ) : (
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
                  backgroundColor: alpha(theme.palette.success.main, 0.04),
                  borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  borderRadius: 0,
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 700,
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.success.main, 0.02),
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                },
              }}
            >
              <DataGrid
                rows={allPayments || []}
                columns={columns}
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
          )}
        </Box>
      </Card>

      {/* Yeni Ödeme Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AddIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Yeni Ödeme Kaydı
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, px: 3 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Üye Seçin"
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                {members?.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tutar"
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Yıl"
                type="number"
                placeholder="2024"
                value={formData.periodYear || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periodYear: parseInt(e.target.value) || undefined,
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ay"
                type="number"
                placeholder="1-12"
                value={formData.periodMonth || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periodMonth: parseInt(e.target.value) || undefined,
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Not (Opsiyonel)"
                multiline
                rows={3}
                value={formData.note || ''}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <NotesIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>
          {createMutation.isError && (
            <Alert 
              severity="error" 
              sx={{ 
                mt: 2.5,
                borderRadius: 2,
              }}
            >
              Ödeme kaydedilemedi
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuesMemberPaymentsPage;