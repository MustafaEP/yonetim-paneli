import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { duesApi } from '../../api/duesApi';
import { membersApi } from '../../api/membersApi';
import type { CreateDuesPaymentDto, DuesPayment } from '../../types/dues';

const DuesMemberPaymentsPage: React.FC = () => {
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

  // Tüm üyelerin ödemelerini topla
  const { data: allPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['all-dues-payments'],
    queryFn: async () => {
      if (!members || members.length === 0) return [];
      
      const paymentPromises = members.map((member) =>
        duesApi.getMemberPayments(member.id).catch(() => [])
      );
      
      const paymentsArrays = await Promise.all(paymentPromises);
      const allPayments: (DuesPayment & { memberName: string })[] = [];
      
      paymentsArrays.forEach((payments, index) => {
        const member = members[index];
        payments.forEach((payment) => {
          allPayments.push({
            ...payment,
            memberName: `${member.firstName} ${member.lastName}`,
          });
        });
      });
      
      // Tarihe göre sırala (en yeni önce)
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

  if (membersLoading || paymentsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Aidat Ödemeleri</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Yeni Ödeme
        </Button>
      </Box>

      {allPayments && allPayments.length > 0 && (
        <Box mb={3}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">
              Toplam Ödeme: ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2">
              Toplam {allPayments.length} ödeme kaydı
            </Typography>
          </Paper>
        </Box>
      )}

      {allPayments && allPayments.length === 0 ? (
        <Alert severity="info">Henüz ödeme kaydı bulunmamaktadır.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Üye</strong></TableCell>
                <TableCell><strong>Tutar</strong></TableCell>
                <TableCell><strong>Ödeme Tarihi</strong></TableCell>
                <TableCell><strong>Dönem</strong></TableCell>
                <TableCell><strong>Not</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allPayments?.map((payment) => (
                <TableRow key={payment.id} hover>
                  <TableCell>
                    <strong>{payment.memberName}</strong>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`₺${payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(payment.paidAt).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    {payment.periodYear && payment.periodMonth ? (
                      <Chip
                        label={`${payment.periodYear}/${String(payment.periodMonth).padStart(2, '0')}`}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{payment.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Ödeme Kaydı</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Üye"
                value={formData.memberId}
                onChange={(e) =>
                  setFormData({ ...formData, memberId: e.target.value })
                }
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Yıl"
                type="number"
                value={formData.periodYear || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periodYear: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ay"
                type="number"
                value={formData.periodMonth || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periodMonth: parseInt(e.target.value) || undefined,
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Not"
                multiline
                rows={2}
                value={formData.note || ''}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
              />
            </Grid>
          </Grid>
          {createMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Ödeme kaydedilemedi
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>İptal</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DuesMemberPaymentsPage;

