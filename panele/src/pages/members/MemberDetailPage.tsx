// src/pages/members/MemberDetailPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { hasPermission as hasPermissionUtil } from '../../utils/permissions'; // eğer direkt hook içinde vardıysa buna gerek yok, aşağıda useAuth'tan kullanacağız

import type { MemberDetail } from '../../types/member'; // senin member detail tipin ne ise
import { getMemberById } from '../../api/membersApi'; // daha önce yazdığımız endpoint'e göre adı uyarlarsın

import MembersApplicationsPage from './MembersApplicationsPage';
import { approveMember, rejectMember } from '../../api/membersApi';


import type {
  MemberPaymentRow,
  DuesPlanRow,
} from '../../types/dues';
import {
  getMemberPayments,
  addDuesPayment,
  getDuesPlans,
} from '../../api/duesApi';

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { hasPermission } = useAuth();
  const canAddPayment = hasPermission('DUES_PAYMENT_ADD');

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);

  const [payments, setPayments] = useState<MemberPaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [duesPlans, setDuesPlans] = useState<DuesPlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    planId: string;
    amount: string;
    periodYear: string;
    periodMonth: string;
    note: string;
  }>({
    planId: '',
    amount: '',
    periodYear: '',
    periodMonth: '',
    note: '',
  });

  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');

  const [processingStatus, setProcessingStatus] = useState(false);


  // 🔹 Üye bilgisi
  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      setLoadingMember(true);
      try {
        const data = await getMemberById(id);
        setMember(data);
      } catch (e) {
        console.error('Üye detay alınırken hata:', e);
      } finally {
        setLoadingMember(false);
      }
    };

    fetchMember();
  }, [id]);

  // 🔹 Üye ödemeleri
  const loadPayments = async () => {
    if (!id) return;
    setLoadingPayments(true);
    try {
      const data = await getMemberPayments(id);
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Üye ödemeleri alınırken hata:', e);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 Plan listesi (sadece ödeme ekleme yetkisi olanlar için önemli)
  useEffect(() => {
    const loadPlans = async () => {
      setLoadingPlans(true);
      try {
        const data = await getDuesPlans(false);
        setDuesPlans(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Aidat planları alınırken hata:', e);
        setDuesPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    if (canAddPayment) {
      loadPlans();
    } else {
      setDuesPlans([]);
      setLoadingPlans(false);
    }
  }, [canAddPayment]);

  // 🔹 Form değişimi
  const handlePaymentFormChange = (
    field: keyof typeof paymentForm,
    value: string,
  ) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openPaymentDialog = () => {
    setPaymentDialogOpen(true);
    setPaymentSaving(false);
    setPaymentForm({
      planId: '',
      amount: '',
      periodYear: new Date().getFullYear().toString(),
      periodMonth: (new Date().getMonth() + 1).toString(),
      note: '',
    });
  };

  const closePaymentDialog = () => {
    if (paymentSaving) return;
    setPaymentDialogOpen(false);
  };

  const handlePaymentSave = async () => {
    if (!id) return;

    const amountNum = Number(paymentForm.amount.replace(',', '.'));
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      window.alert('Geçerli bir tutar giriniz.');
      return;
    }

    const periodYearNum = paymentForm.periodYear
      ? Number(paymentForm.periodYear)
      : undefined;
    const periodMonthNum = paymentForm.periodMonth
      ? Number(paymentForm.periodMonth)
      : undefined;

    setPaymentSaving(true);
    try {
      await addDuesPayment({
        memberId: id,
        planId: paymentForm.planId || undefined,
        amount: amountNum,
        periodYear: periodYearNum,
        periodMonth: periodMonthNum,
        note: paymentForm.note || undefined,
      });

      await loadPayments();
      setPaymentDialogOpen(false);
    } catch (e) {
      console.error('Ödeme eklenirken hata:', e);
      window.alert('Ödeme eklenirken bir hata oluştu.');
    } finally {
      setPaymentSaving(false);
    }
  };

  if (loadingMember) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return <Typography>Üye bulunamadı.</Typography>;
  }

  const fullName = `${member.firstName} ${member.lastName}`;

  const formatPeriod = (p: MemberPaymentRow) => {
    if (!p.periodYear && !p.periodMonth) return '-';
    if (!p.periodMonth) return `${p.periodYear}`;
    return `${p.periodMonth.toString().padStart(2, '0')}/${p.periodYear}`;
  };

  const handleApproveMember = async () => {
    if (!id || !canApprove) return;
    if (!window.confirm('Bu üye başvurusunu onaylamak istediğinize emin misiniz?')) return;
  
    setProcessingStatus(true);
    try {
      await approveMember(id);
      const updated = await getMemberById(id);
      setMember(updated);
    } catch (e) {
      console.error('Üye onaylanırken hata:', e);
      window.alert('Üye onaylanırken bir hata oluştu.');
    } finally {
      setProcessingStatus(false);
    }
  };
  
  const handleRejectMember = async () => {
    if (!id || !canReject) return;
    if (!window.confirm('Bu üye başvurusunu reddetmek istediğinize emin misiniz?')) return;
  
    setProcessingStatus(true);
    try {
      await rejectMember(id);
      const updated = await getMemberById(id);
      setMember(updated);
    } catch (e) {
      console.error('Üye reddedilirken hata:', e);
      window.alert('Üye reddedilirken bir hata oluştu.');
    } finally {
      setProcessingStatus(false);
    }
  };
  

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Üye temel bilgiler */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Üye Detayı
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Ad Soyad
              </Typography>
              <Typography variant="body1">{fullName}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Durum
              </Typography>
              <Chip
                label={member.status}
                color={member.status === 'ACTIVE' ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Telefon
              </Typography>
              <Typography variant="body1">{member.phone ?? '-'}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                E-posta
              </Typography>
              <Typography variant="body1">{member.email ?? '-'}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Bölge
              </Typography>
              <Typography variant="body1">
                {member.province?.name ?? '-'} / {member.district?.name ?? '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Aidat Planı
              </Typography>
              <Typography variant="body1">
                {member.duesPlan
                  ? `${member.duesPlan.name} - ${
                      typeof member.duesPlan.amount === 'number'
                        ? member.duesPlan.amount.toLocaleString('tr-TR', {
                            minimumFractionDigits: 2,
                          })
                        : member.duesPlan.amount
                    } TL`
                  : '-'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Aidat Ödemeleri */}
      <Card>
        <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5">
            Üye Detayı
          </Typography>

          {member.status === 'PENDING' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canApprove && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={handleApproveMember}
                  disabled={processingStatus}
                >
                  Onayla
                </Button>
              )}
              {canReject && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleRejectMember}
                  disabled={processingStatus}
                >
                  Reddet
                </Button>
              )}
            </Box>
          )}
        </Box>

          {loadingPayments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : payments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Bu üyeye ait kayıtlı ödeme bulunmuyor.
            </Typography>
          ) : (
            <Paper sx={{ width: '100%', overflowX: 'auto', mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Dönem</TableCell>
                    <TableCell align="right">Tutar (TL)</TableCell>
                    <TableCell>Not</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.paidAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{p.plan?.name ?? '-'}</TableCell>
                      <TableCell>{formatPeriod(p)}</TableCell>
                      <TableCell align="right">
                        {p.amount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{p.note ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Ödeme Ekle Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={closePaymentDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yeni Aidat Ödemesi</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth size="small">
            <InputLabel>Aidat Planı (opsiyonel)</InputLabel>
            <Select
              label="Aidat Planı (opsiyonel)"
              value={paymentForm.planId}
              onChange={(e) =>
                handlePaymentFormChange('planId', e.target.value as string)
              }
            >
              <MenuItem value="">
                <em>Plan seçme</em>
              </MenuItem>
              {duesPlans.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} -{' '}
                  {p.amount.toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  TL ({p.period === 'MONTHLY' ? 'Aylık' : 'Yıllık'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Tutar (TL)"
            size="small"
            value={paymentForm.amount}
            onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Yıl"
              size="small"
              value={paymentForm.periodYear}
              onChange={(e) =>
                handlePaymentFormChange('periodYear', e.target.value)
              }
              fullWidth
            />
            <TextField
              label="Ay (1-12)"
              size="small"
              value={paymentForm.periodMonth}
              onChange={(e) =>
                handlePaymentFormChange('periodMonth', e.target.value)
              }
              fullWidth
            />
          </Box>

          <TextField
            label="Not (opsiyonel)"
            size="small"
            multiline
            minRows={2}
            value={paymentForm.note}
            onChange={(e) => handlePaymentFormChange('note', e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog} disabled={paymentSaving}>
            İptal
          </Button>
          <Button
            onClick={handlePaymentSave}
            disabled={paymentSaving}
            variant="contained"
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberDetailPage;
