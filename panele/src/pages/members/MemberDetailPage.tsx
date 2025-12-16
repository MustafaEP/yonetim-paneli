import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  alpha,
  useTheme,
  IconButton,
  Collapse,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PaymentIcon from '@mui/icons-material/Payment';
import GetAppIcon from '@mui/icons-material/GetApp';
import { getMemberById } from '../../api/membersApi';
import { getMemberPayments, createPayment, type CreateMemberPaymentDto, type PaymentType } from '../../api/paymentsApi';
import type { MemberDetail } from '../../types/member';
import type { MemberPayment } from '../../api/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

const MemberDetailPage = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    work: true,
    history: false,
    payments: true,
  });
  
  // Ödeme ekleme dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    paymentPeriodMonth: number;
    paymentPeriodYear: number;
    amount: string;
    paymentType: PaymentType;
    description: string;
  }>({
    paymentPeriodMonth: new Date().getMonth() + 1,
    paymentPeriodYear: new Date().getFullYear(),
    amount: '',
    paymentType: 'ELDEN',
    description: '',
  });
  
  const canAddPayment = hasPermission('MEMBER_PAYMENT_ADD');

  // Member verisini yükle
  useEffect(() => {
    if (!id) return;

    const loadMember = async () => {
      setLoadingMember(true);
      try {
        const data = await getMemberById(id);
        setMember(data);
      } catch (error) {
        console.error('Üye detayı alınırken hata:', error);
      } finally {
        setLoadingMember(false);
      }
    };

    loadMember();
  }, [id]);

  // Ödemeleri yükle
  useEffect(() => {
    if (!id) return;

    const loadPayments = async () => {
      setLoadingPayments(true);
      try {
        const data = await getMemberPayments(id);
        setPayments(data);
      } catch (error) {
        console.error('Ödemeler alınırken hata:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    loadPayments();
  }, [id]);

  // Ödeme ekleme handler
  const handleSubmitPayment = async () => {
    if (!id || !member) return;
    
    // Validasyon
    if (!paymentForm.amount || !paymentForm.paymentPeriodMonth || !paymentForm.paymentPeriodYear) {
      toast.showError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    // Tutar formatını kontrol et
    const amountRegex = /^\d+(\.\d{1,2})?$/;
    const normalizedAmount = paymentForm.amount.replace(',', '.');
    if (!amountRegex.test(normalizedAmount)) {
      toast.showError('Tutar formatı geçersiz. Örnek: 250.00');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload: CreateMemberPaymentDto = {
        memberId: id,
        paymentPeriodMonth: paymentForm.paymentPeriodMonth,
        paymentPeriodYear: paymentForm.paymentPeriodYear,
        amount: normalizedAmount,
        paymentType: paymentForm.paymentType,
        description: paymentForm.description || undefined,
      };

      await createPayment(payload);
      toast.showSuccess('Ödeme başarıyla eklendi');
      
      // Formu sıfırla
      setPaymentForm({
        paymentPeriodMonth: new Date().getMonth() + 1,
        paymentPeriodYear: new Date().getFullYear(),
        amount: '',
        paymentType: 'ELDEN',
        description: '',
      });
      
      // Dialog'u kapat
      setPaymentDialogOpen(false);
      
      // Ödemeleri yeniden yükle
      const data = await getMemberPayments(id);
      setPayments(data);
    } catch (error: any) {
      console.error('Ödeme eklenirken hata:', error);
      toast.showError(error.response?.data?.message || 'Ödeme eklenirken bir hata oluştu');
    } finally {
      setSubmittingPayment(false);
    }
  };

  if (loadingMember) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Üye bulunamadı
      </Alert>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      ACTIVE: {
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Aktif',
        bgColor: alpha(theme.palette.success.main, 0.1),
      },
      PENDING: {
        color: 'warning',
        icon: <WarningIcon fontSize="small" />,
        label: 'Beklemede',
        bgColor: alpha(theme.palette.warning.main, 0.1),
      },
      REJECTED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'Reddedildi',
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
      EXPELLED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'İhraç',
        bgColor: alpha(theme.palette.error.main, 0.1),
      },
    };
    return configs[status] || configs.ACTIVE;
  };

  const statusConfig = getStatusConfig(member?.status || 'ACTIVE');

  const InfoRow = ({ label, value, icon }: { 
    label: string; 
    value: string | number | null | undefined; 
    icon?: React.ReactNode;
  }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5 }}>
      {icon && (
        <Box sx={{ 
          color: theme.palette.primary.main, 
          mt: 0.25,
          opacity: 0.7,
        }}>
          {icon}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
          }}
        >
          {label}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 0.25,
            fontWeight: 500,
            color: theme.palette.text.primary,
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );

  const SectionCard = ({ title, icon, children, sectionKey, actions }: { 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    sectionKey?: string; 
    actions?: React.ReactNode;
  }) => (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
          cursor: sectionKey ? 'pointer' : 'default',
        }}
        onClick={() => sectionKey && toggleSection(sectionKey)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {icon}
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              fontSize: '1.1rem',
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {actions}
          {sectionKey && (
            <IconButton size="small">
              {expandedSections[sectionKey] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>
      </Box>
      <Collapse in={!sectionKey || expandedSections[sectionKey]}>
        <CardContent sx={{ p: 3 }}>
          {children}
        </CardContent>
      </Collapse>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header Card */}
      <Card 
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          border: 'none',
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha('#fff', 0.1),
          }}
        />
        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                fontSize: '2rem',
                fontWeight: 700,
                bgcolor: alpha('#fff', 0.2),
                border: `3px solid ${alpha('#fff', 0.3)}`,
                boxShadow: `0 4px 20px ${alpha('#000', 0.2)}`,
              }}
            >
              {member?.firstName?.[0] || ''}{member?.lastName?.[0] || ''}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {member?.firstName || ''} {member?.lastName || ''}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>
                {member?.nationalId && `TC: ${member.nationalId}`}
                {member?.nationalId && member?.registrationNumber && ' • '}
                {member?.registrationNumber && `Kayıt No: ${member.registrationNumber}`}
              </Typography>
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  '& .MuiChip-icon': { color: '#fff' },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/members/${id}/update`)}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.3),
                  },
                }}
              >
                Güncelle
              </Button>
              <Button
                variant="contained"
                startIcon={<DescriptionIcon />}
                onClick={() => navigate(`/documents/members/${id}`)}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.3),
                  },
                }}
              >
                Dökümanlar
              </Button>
              {canAddPayment && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#fff', 0.3)}`,
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                    },
                  }}
                >
                  Ödeme Ekle
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Kişisel Bilgiler - Tam Genişlik */}
        <Grid item xs={12}>
          <SectionCard 
            title="Kişisel Bilgiler" 
            icon={<PersonIcon />}
            sectionKey="personal"
            actions={undefined}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Anne Adı" value={member?.motherName || '-'} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Baba Adı" value={member?.fatherName || '-'} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Doğum Yeri" value={member?.birthplace || '-'} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow 
                  label="Cinsiyet" 
                  value={member?.gender === 'MALE' ? 'Erkek' : member?.gender === 'FEMALE' ? 'Kadın' : '-'} 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow 
                  label="Öğrenim Durumu" 
                  value={member?.educationStatus === 'COLLEGE' ? 'Yüksekokul' : member?.educationStatus === 'HIGH_SCHOOL' ? 'Lise' : member?.educationStatus === 'PRIMARY' ? 'İlkokul' : member?.educationStatus || '-'} 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Telefon" value={member?.phone || '-'} />
              </Grid>
              <Grid item xs={12}>
                <InfoRow label="E-posta" value={member?.email || '-'} />
              </Grid>
              <Grid item xs={12}>
                <InfoRow 
                  label="Kayıtlı Bölge" 
                  value={member?.province?.name && member?.district?.name 
                    ? `${member.province.name} / ${member.district.name}` 
                    : '-'} 
                />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {/* İş Bilgileri - Tam Genişlik */}
        <Grid item xs={12}>
          <SectionCard 
            title="İş Bilgileri" 
            icon={<WorkIcon />}
            sectionKey="work"
            actions={undefined}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <InfoRow label="Kurum" value={member?.institution?.name || '-'} />
              </Grid>
              <Grid item xs={12}>
                <InfoRow 
                  label="Çalıştığı İl/İlçe" 
                  value={member?.workingProvince?.name && member?.workingDistrict?.name
                    ? `${member.workingProvince.name} / ${member.workingDistrict.name}`
                    : '-'} 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Şube" value={member?.branch?.name || '-'} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow 
                  label="Kadro Ünvanı" 
                  value={member?.positionTitle 
                    ? member.positionTitle.replace(/_/g, ' ').replace(/KADRO/g, 'Kadro').replace(/SOZLESMELI/g, 'Sözleşmeli')
                    : '-'} 
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Sicil No" value={member?.institutionRegNo || '-'} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <InfoRow label="Tevkifat Merkezi" value={member?.tevkifatCenter?.name || '-'} />
              </Grid>
              <Grid item xs={12}>
                <InfoRow label="Görev Birimi" value={member?.workUnit || '-'} />
              </Grid>
              <Grid item xs={12}>
                <InfoRow label="Birim Adresi" value={member?.workUnitAddress || '-'} />
              </Grid>
            </Grid>
          </SectionCard>
        </Grid>

        {/* Ödemeler */}
        <Grid item xs={12}>
          <SectionCard 
            title="Aidat / Ödeme" 
            icon={<PaymentIcon />}
            sectionKey="payments"
            actions={undefined}
          >
            {loadingPayments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : payments.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Bu üye için henüz ödeme kaydı bulunmamaktadır.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell sx={{ fontWeight: 700 }}>Ay</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Yıl</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tutar</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tür</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Onay Durumu</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Belge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => {
                      const monthNames = [
                        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
                      ];
                      const monthName = monthNames[payment.paymentPeriodMonth - 1];
                      
                      const paymentTypeLabels = {
                        TEVKIFAT: 'Tevkifat',
                        ELDEN: 'Elden',
                        HAVALE: 'Havale',
                      };

                      return (
                        <TableRow key={payment.id} hover>
                          <TableCell>{monthName}</TableCell>
                          <TableCell>{payment.paymentPeriodYear}</TableCell>
                          <TableCell>
                            {parseFloat(payment.amount).toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} TL
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={paymentTypeLabels[payment.paymentType]}
                              size="small"
                              color={
                                payment.paymentType === 'TEVKIFAT' ? 'primary' :
                                payment.paymentType === 'ELDEN' ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {payment.isApproved ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Onaylı"
                                color="success"
                                size="small"
                              />
                            ) : (
                              <Chip
                                icon={<WarningIcon />}
                                label="Beklemede"
                                color="warning"
                                size="small"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {payment.documentUrl ? (
                              <Link
                                href={payment.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                              >
                                <GetAppIcon fontSize="small" />
                                Görüntüle
                              </Link>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionCard>
        </Grid>

        {/* Ödeme Ekleme Dialog */}
        <Dialog 
          open={paymentDialogOpen} 
          onClose={() => !submittingPayment && setPaymentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Ödeme Dönemi Ay</InputLabel>
                    <Select
                      value={paymentForm.paymentPeriodMonth}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriodMonth: Number(e.target.value) })}
                      label="Ödeme Dönemi Ay"
                      disabled={submittingPayment}
                    >
                      {[
                        { value: 1, label: 'Ocak' },
                        { value: 2, label: 'Şubat' },
                        { value: 3, label: 'Mart' },
                        { value: 4, label: 'Nisan' },
                        { value: 5, label: 'Mayıs' },
                        { value: 6, label: 'Haziran' },
                        { value: 7, label: 'Temmuz' },
                        { value: 8, label: 'Ağustos' },
                        { value: 9, label: 'Eylül' },
                        { value: 10, label: 'Ekim' },
                        { value: 11, label: 'Kasım' },
                        { value: 12, label: 'Aralık' },
                      ].map((month) => (
                        <MenuItem key={month.value} value={month.value}>
                          {month.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ödeme Dönemi Yıl"
                    type="number"
                    value={paymentForm.paymentPeriodYear}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriodYear: Number(e.target.value) })}
                    disabled={submittingPayment}
                    inputProps={{ min: 2020, max: 2100 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tutar"
                    type="text"
                    value={paymentForm.amount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      setPaymentForm({ ...paymentForm, amount: value });
                    }}
                    disabled={submittingPayment}
                    placeholder="250.00"
                    helperText="Örnek: 250.00"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Ödeme Türü</InputLabel>
                    <Select
                      value={paymentForm.paymentType}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
                      label="Ödeme Türü"
                      disabled={submittingPayment}
                    >
                      <MenuItem value="ELDEN">Elden Ödeme</MenuItem>
                      <MenuItem value="HAVALE">Havale/EFT</MenuItem>
                      <MenuItem value="TEVKIFAT">Tevkifat</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Açıklama"
                    multiline
                    rows={3}
                    value={paymentForm.description}
                    onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    disabled={submittingPayment}
                    placeholder="Ödeme açıklaması (opsiyonel)"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setPaymentDialogOpen(false)} 
              disabled={submittingPayment}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitPayment}
              variant="contained"
              disabled={submittingPayment || !paymentForm.amount || !paymentForm.paymentPeriodMonth || !paymentForm.paymentPeriodYear}
              startIcon={submittingPayment ? <CircularProgress size={16} /> : <PaymentIcon />}
            >
              {submittingPayment ? 'Ekleniyor...' : 'Ödeme Ekle'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Onay Bilgileri */}
        {member?.approvedBy && member?.approvedAt && (
          <Grid item xs={12}>
            <Alert 
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Üyelik Onayı
              </Typography>
              <Typography variant="body2">
                <strong>{member.approvedBy.firstName} {member.approvedBy.lastName}</strong> tarafından{' '}
                <strong>
                  {new Date(member.approvedAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </strong>{' '}
                tarihinde onaylanmıştır.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>

    </Box>
  );
};

export default MemberDetailPage;