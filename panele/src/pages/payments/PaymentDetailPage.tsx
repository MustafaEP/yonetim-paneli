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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getPaymentById,
  type MemberPayment,
  type PaymentType,
} from '../../api/paymentsApi';
import { httpClient } from '../../api/httpClient';
import PageHeader from '../../components/layout/PageHeader';

const PaymentDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [payment, setPayment] = useState<MemberPayment | null>(null);
  const [loading, setLoading] = useState(true);

  const canView = hasPermission('MEMBER_PAYMENT_VIEW');

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
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
    }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/payments')}
          sx={{ 
            mb: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
          }}
        >
          Geri Dön
        </Button>
      </Box>

      {/* Modern Header Card */}
      <PageHeader
        icon={<PaymentIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="Ödeme Detayı"
        description={payment ? `${payment.member.firstName} ${payment.member.lastName} - ${paymentTypeLabels[payment.type]} - ${payment.amount} TL` : 'Ödeme detay bilgileri'}
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />

      <Grid container spacing={3}>
        {/* Üye Bilgisi */}
        <Grid item xs={12} md={6}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-2px)',
              },
              height: '100%',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <PaymentIcon />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: theme.palette.text.primary,
                  letterSpacing: 0.2,
                }}
              >
                Üye Bilgisi
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
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
                <Typography variant="body1" fontWeight={600}>
                  {payment.member?.firstName && payment.member?.lastName
                    ? `${payment.member.firstName} ${payment.member.lastName}`
                    : payment.createdByUser
                    ? `${payment.createdByUser.firstName} ${payment.createdByUser.lastName}`
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
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-2px)',
              },
              height: '100%',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <PaymentIcon />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: theme.palette.text.primary,
                  letterSpacing: 0.2,
                }}
              >
                Ödeme Bilgileri
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
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
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              '&:hover': {
                boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Box
              sx={{
                p: 2.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <PictureAsPdfIcon />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  color: theme.palette.text.primary,
                  letterSpacing: 0.2,
                }}
              >
                Belge ve İşlem Bilgileri
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2}>
              {payment.documentUrl && (
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PictureAsPdfIcon color="error" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Ödeme Evrakı (PDF)
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => {
                          // Backend base URL'ini kullan
                          const baseURL = httpClient.defaults.baseURL || 'http://localhost:3000';
                          const fileUrl = payment.documentUrl?.startsWith('/') 
                            ? `${baseURL}${payment.documentUrl}` 
                            : payment.documentUrl;
                          if (fileUrl) {
                            window.open(fileUrl, '_blank');
                          }
                        }}
                        sx={{ 
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                      >
                        Evrakı Görüntüle
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ödeme Yapan
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {payment.createdByUser
                      ? `${payment.createdByUser.firstName} ${payment.createdByUser.lastName}`
                      : '-'}
                  </Typography>
                </Box>
              </Grid>
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
            </Box>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default PaymentDetailPage;
