// src/pages/payments/PaymentDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getPaymentById,
  approvePayment,
  deletePayment,
  type MemberPayment,
  type PaymentType,
} from '../../api/paymentsApi';

const PaymentDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [payment, setPayment] = useState<MemberPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const canView = hasPermission('MEMBER_PAYMENT_VIEW');
  const canApprove = hasPermission('MEMBER_PAYMENT_APPROVE');

  useEffect(() => {
    if (id && canView) {
      loadPayment();
    }
  }, [id, canView]);

  const loadPayment = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getPaymentById(id);
      setPayment(data);
    } catch (e: any) {
      console.error('Ödeme detayı alınırken hata:', e);
      toast.showError('Ödeme detayı alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!payment || !id) return;
    setApproving(true);
    try {
      await approvePayment(id);
      toast.showSuccess('Ödeme başarıyla onaylandı');
      loadPayment();
    } catch (e: any) {
      console.error('Ödeme onaylanırken hata:', e);
      toast.showError(e.response?.data?.message || 'Ödeme onaylanırken bir hata oluştu');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!payment || !id) return;
    if (!window.confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    setRejecting(true);
    try {
      await deletePayment(id);
      toast.showSuccess('Ödeme başarıyla silindi');
      navigate('/payments');
    } catch (e: any) {
      console.error('Ödeme silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Ödeme silinirken bir hata oluştu');
    } finally {
      setRejecting(false);
    }
  };

  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  const paymentTypeLabels: Record<PaymentType, string> = {
    TEVKIFAT: 'Tevkifat',
    ELDEN: 'Elden',
    HAVALE: 'Havale',
  };

  if (!canView) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!payment) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Ödeme bulunamadı</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/payments')}
          sx={{ mb: 2 }}
        >
          Geri Dön
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <PaymentIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  color: theme.palette.text.primary,
                  mb: 0.5,
                }}
              >
                Ödeme Detayı
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                {payment.member
                  ? `${payment.member.firstName} ${payment.member.lastName}`
                  : 'Üye bilgisi yok'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={payment.isApproved ? 'Onaylandı' : 'Onay Bekliyor'}
              color={payment.isApproved ? 'success' : 'warning'}
            />
            <Chip
              label={paymentTypeLabels[payment.paymentType]}
              color={payment.paymentType === 'TEVKIFAT' ? 'primary' : 'default'}
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Üye Bilgisi */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Üye Bilgisi
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Üye Kayıt No
                </Typography>
                <Typography variant="body1">
                  {payment.registrationNumber || payment.member?.registrationNumber || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ad Soyad
                </Typography>
                <Typography variant="body1">
                  {payment.member
                    ? `${payment.member.firstName} ${payment.member.lastName}`
                    : '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Kurum
                </Typography>
                <Typography variant="body1">
                  {payment.member?.institution?.name || '-'}
                </Typography>
              </Box>
              {payment.member?.branch && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Şube
                  </Typography>
                  <Typography variant="body1">{payment.member.branch.name}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Ödeme Bilgileri */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Ödeme Bilgileri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ay / Yıl
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {monthNames[payment.paymentPeriodMonth - 1]} / {payment.paymentPeriodYear}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tutar
                </Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main" fontSize="1.25rem">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(Number(payment.amount))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Ödeme Türü
                </Typography>
                <Typography variant="body1">
                  {paymentTypeLabels[payment.paymentType]}
                </Typography>
              </Box>
              {payment.tevkifatCenter && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tevkifat Merkezi
                  </Typography>
                  <Typography variant="body1">{payment.tevkifatCenter.name}</Typography>
                </Box>
              )}
              {payment.description && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Açıklama
                  </Typography>
                  <Typography variant="body1">{payment.description}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Belge ve İşlem Bilgileri */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              p: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Belge ve İşlem Bilgileri
            </Typography>
            <Grid container spacing={2}>
              {payment.documentUrl && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PictureAsPdfIcon color="error" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Belge (PDF)
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => window.open(payment.documentUrl || '', '_blank')}
                        sx={{ textTransform: 'none' }}
                      >
                        Belgeyi Görüntüle
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Onaylayan Kullanıcı
                  </Typography>
                  <Typography variant="body1">
                    {payment.approvedByUser
                      ? `${payment.approvedByUser.firstName} ${payment.approvedByUser.lastName}`
                      : '-'}
                  </Typography>
                </Box>
              </Grid>
              {payment.approvedAt && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Onay Tarihi
                    </Typography>
                    <Typography variant="body1">
                      {new Date(payment.approvedAt).toLocaleString('tr-TR')}
                    </Typography>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    İşlem Zamanı
                  </Typography>
                  <Typography variant="body1">
                    {new Date(payment.createdAt).toLocaleString('tr-TR')}
                  </Typography>
                </Box>
              </Grid>
              {payment.ipAddress && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      IP Adresi
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                      {payment.ipAddress}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* İşlemler */}
        {canApprove && !payment.isApproved && (
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                İşlemler
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleApprove}
                  disabled={approving}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {approving ? 'Onaylanıyor...' : 'Onayla'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleReject}
                  disabled={rejecting}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {rejecting ? 'Reddediliyor...' : 'Reddet'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  disabled
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                  title="Düzenleme sayfası henüz mevcut değil"
                >
                  Düzeltme İste
                </Button>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default PaymentDetailPage;
