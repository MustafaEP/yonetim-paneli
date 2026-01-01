import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
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
  FormHelperText,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PlaceIcon from '@mui/icons-material/Place';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { getMemberById, exportMemberDetailToPdf, updateMember } from '../../api/membersApi';
import MemberStatusChangeDialog from '../../components/members/MemberStatusChangeDialog';
import { getMemberPayments, createPayment, type CreateMemberPaymentDto, type PaymentType } from '../../api/paymentsApi';
import { 
  getMemberDocuments, 
  viewDocument, 
  downloadDocument, 
  uploadMemberDocument,
  generateDocument,
  getDocumentTemplates,
  type MemberDocument,
  type DocumentTemplate,
  type GenerateDocumentDto,
} from '../../api/documentsApi';
import { getDocumentTypeLabel, DOCUMENT_TYPES } from '../../utils/documentTypes';
import type { MemberDetail, MemberStatus } from '../../types/member';
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
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

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
  const canUploadDocument = hasPermission('DOCUMENT_GENERATE_PDF');
  const canChangeStatus = hasPermission('MEMBER_STATUS_CHANGE');

  // Durum değiştirme dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Evrak ekleme dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('UPLOADED');
  const [description, setDescription] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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

  // Evrakları yükle
  useEffect(() => {
    if (!id) return;

    const loadDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const data = await getMemberDocuments(id);
        setDocuments(data);
      } catch (error) {
        console.error('Evraklar alınırken hata:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [id]);

  // Evrak yükleme handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Sadece PDF dosyalarını kabul et
      if (file.type !== 'application/pdf') {
        toast.showError('Sadece PDF dosyaları yüklenebilir');
        return;
      }
      setSelectedFile(file);
      // Dosya adından doküman tipini çıkar (opsiyonel)
      if (!documentType || documentType === 'UPLOADED') {
        const fileName = file.name.toLowerCase();
        if (fileName.includes('kayit') || fileName.includes('uye')) {
          setDocumentType('MEMBER_REGISTRATION');
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!id || !selectedFile) return;

    setUploading(true);
    try {
      const fileName = customFileName.trim() || selectedFile.name.replace(/\.pdf$/i, '');
      await uploadMemberDocument(id, selectedFile, documentType, description, fileName);
      toast.showSuccess('Evrak başarıyla yüklendi');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('UPLOADED');
      setDescription('');
      setCustomFileName('');
      // Evrakları yeniden yükle
      const data = await getMemberDocuments(id);
      setDocuments(data);
    } catch (error: any) {
      console.error('Evrak yüklenirken hata:', error);
      toast.showError(error.response?.data?.message || 'Evrak yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getDocumentTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (error: any) {
      console.error('Şablonlar yüklenirken hata:', error);
      toast.showError('Şablonlar yüklenirken bir hata oluştu');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenGenerateDialog = () => {
    setGenerateDialogOpen(true);
    setSelectedTemplate(null);
    loadTemplates();
  };

  const handleGenerate = async () => {
    if (!id || !selectedTemplate) return;

    setGenerating(true);
    try {
      const payload: GenerateDocumentDto = {
        memberId: id,
        templateId: selectedTemplate.id,
      };
      await generateDocument(payload);
      toast.showSuccess('PDF evrak başarıyla oluşturuldu');
      setGenerateDialogOpen(false);
      setSelectedTemplate(null);
      // Evrakları yeniden yükle
      const data = await getMemberDocuments(id);
      setDocuments(data);
    } catch (error: any) {
      console.error('PDF oluşturulurken hata:', error);
      toast.showError(error.response?.data?.message || 'PDF oluşturulurken bir hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  // Durum değiştirme handler
  const handleStatusChange = async (status: MemberStatus, reason?: string) => {
    if (!id || !member) return;

    setUpdatingStatus(true);
    try {
      const updateData: { status: MemberStatus; cancellationReason?: string } = { status };
      if (reason && (status === 'RESIGNED' || status === 'EXPELLED')) {
        updateData.cancellationReason = reason;
      }
      await updateMember(id, updateData);
      toast.showSuccess('Üye durumu başarıyla güncellendi');
      setStatusDialogOpen(false);
      // Üye bilgilerini yeniden yükle
      const updatedMember = await getMemberById(id);
      setMember(updatedMember);
    } catch (error: any) {
      console.error('Durum güncellenirken hata:', error);
      toast.showError(error.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Ödeme ekleme handler
  const handleSubmitPayment = async () => {
    if (!id || !member) return;

    if (!paymentForm.amount || !paymentForm.paymentPeriodMonth || !paymentForm.paymentPeriodYear) {
      toast.showError('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

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

      setPaymentForm({
        paymentPeriodMonth: new Date().getMonth() + 1,
        paymentPeriodYear: new Date().getFullYear(),
        amount: '',
        paymentType: 'ELDEN',
        description: '',
      });

      setPaymentDialogOpen(false);

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

  const getStatusConfig = (status: string) => {
    const configs: any = {
      ACTIVE: {
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Aktif',
        bgColor: alpha(theme.palette.success.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.95)} 0%, ${theme.palette.success.dark} 100%)`,
        headerShadow: theme.palette.success.main,
      },
      PENDING: {
        color: 'warning',
        icon: <WarningIcon fontSize="small" />,
        label: 'Beklemede',
        bgColor: alpha(theme.palette.warning.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.95)} 0%, ${theme.palette.warning.dark} 100%)`,
        headerShadow: theme.palette.warning.main,
      },
      REJECTED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'Reddedildi',
        bgColor: alpha(theme.palette.error.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.95)} 0%, ${theme.palette.error.dark} 100%)`,
        headerShadow: theme.palette.error.main,
      },
      EXPELLED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'İhraç',
        bgColor: alpha(theme.palette.error.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.95)} 0%, ${theme.palette.error.dark} 100%)`,
        headerShadow: theme.palette.error.main,
      },
      RESIGNED: {
        color: 'default',
        icon: <CancelIcon fontSize="small" />,
        label: 'İstifa',
        bgColor: alpha(theme.palette.grey[500], 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.grey[600], 0.95)} 0%, ${theme.palette.grey[800]} 100%)`,
        headerShadow: theme.palette.grey[600],
      },
      INACTIVE: {
        color: 'default',
        icon: <CancelIcon fontSize="small" />,
        label: 'Pasif',
        bgColor: alpha(theme.palette.grey[500], 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.grey[600], 0.95)} 0%, ${theme.palette.grey[800]} 100%)`,
        headerShadow: theme.palette.grey[600],
      },
    };
    return configs[status] || configs.ACTIVE;
  };

  const statusConfig = getStatusConfig(member?.status || 'ACTIVE');

  const InfoRow = ({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        transition: 'all 0.2s ease',
        bgcolor: alpha(theme.palette.divider, 0.02),
        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderColor: alpha(theme.palette.primary.main, 0.15),
          transform: 'translateX(2px)',
        },
      }}
    >
      {icon && (
        <Box
          sx={{
            color: theme.palette.primary.main,
            mt: 0.2,
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            fontSize: '0.65rem',
            display: 'block',
            mb: 0.4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: '0.875rem',
            wordBreak: 'break-word',
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );

  const SectionCard = ({
    title,
    icon,
    children,
    actions,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.3),
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
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
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
            {icon}
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
            {title}
          </Typography>
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  );

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          background: statusConfig.headerGradient,
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          border: 'none',
          boxShadow: `0 12px 40px ${alpha(statusConfig.headerShadow, 0.35)}`,
        }}
      >
        {/* Dekoratif arka plan elemanları */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: alpha('#fff', 0.08),
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha('#fff', 0.05),
          }}
        />
        
        <CardContent sx={{ p: { xs: 2.5, sm: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 3 } }}>
            <Avatar
              sx={{
                width: { xs: 64, sm: 90 },
                height: { xs: 64, sm: 90 },
                fontSize: { xs: '1.6rem', sm: '2.2rem' },
                fontWeight: 700,
                bgcolor: alpha('#fff', 0.2),
                border: `4px solid ${alpha('#fff', 0.3)}`,
                boxShadow: `0 8px 24px ${alpha('#000', 0.25)}`,
              }}
            >
              {member?.firstName?.[0] || ''}
              {member?.lastName?.[0] || ''}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  wordBreak: 'break-word',
                }}
              >
                {member?.firstName || ''} {member?.lastName || ''}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  wordBreak: 'break-word',
                }}
              >
                {member?.nationalId && `TC: ${member.nationalId}`}
                {member?.nationalId && member?.registrationNumber && ' • '}
                {member?.registrationNumber && `Kayıt No: ${member.registrationNumber}`}
              </Typography>

              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                size="small"
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  '& .MuiChip-icon': { color: '#fff' },
                }}
              />
            </Box>

            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1.5}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/members/${id}/edit`)}
                fullWidth={true}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  py: { xs: 1, sm: 1.5 },
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                  },
                  transition: 'all 0.3s ease',
                  display: { xs: 'flex', sm: 'inline-flex' },
                }}
              >
                Düzenle
              </Button>
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={async () => {
                  try {
                    await exportMemberDetailToPdf(id!);
                    toast.showSuccess('PDF başarıyla indirildi');
                  } catch (error) {
                    toast.showError('PDF indirilemedi');
                  }
                }}
                fullWidth={true}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  py: { xs: 1, sm: 1.5 },
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                  },
                  transition: 'all 0.3s ease',
                  display: { xs: 'flex', sm: 'inline-flex' },
                }}
              >
                PDF İndir
              </Button>
              {canAddPayment && (
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                  fullWidth={true}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#fff', 0.3)}`,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    py: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                    },
                    transition: 'all 0.3s ease',
                    display: { xs: 'flex', sm: 'inline-flex' },
                  }}
                >
                  Ödeme Ekle
                </Button>
              )}
              {canChangeStatus && member?.status !== 'PENDING' && (
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  onClick={() => setStatusDialogOpen(true)}
                  fullWidth={true}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#fff', 0.3)}`,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    py: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                    },
                    transition: 'all 0.3s ease',
                    display: { xs: 'flex', sm: 'inline-flex' },
                  }}
                >
                  Durum Değiştir
                </Button>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* İhraç/İstifa Açıklaması */}
        {(member?.status === 'EXPELLED' || member?.status === 'RESIGNED') && member?.cancellationReason && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `2px solid ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.3
              )}`,
              background: `linear-gradient(135deg, ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.08
              )} 0%, ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.light : theme.palette.grey[400],
                0.05
              )} 100%)`,
              boxShadow: `0 4px 16px ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.15
              )}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${
                      member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600]
                    } 0%, ${
                      member.status === 'EXPELLED' ? theme.palette.error.dark : theme.palette.grey[800]
                    } 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(
                      member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                      0.3
                    )}`,
                    flexShrink: 0,
                  }}
                >
                  <CancelIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      color: member.status === 'EXPELLED' ? theme.palette.error.dark : theme.palette.grey[800],
                    }}
                  >
                    {member.status === 'EXPELLED' ? 'İhraç Nedeni' : 'İstifa Nedeni'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      lineHeight: 1.7,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {member.cancellationReason}
                  </Typography>
                  {member.cancelledAt && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 2,
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Tarih: {new Date(member.cancelledAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Kişisel Bilgiler */}
        <SectionCard title="Kişisel Bilgiler" icon={<PersonIcon />}>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
            <InfoRow label="TC Kimlik Numarası" value={member?.nationalId || '-'} icon={<BadgeIcon />} />
            <InfoRow label="Üye Numarası" value={member?.registrationNumber || '-'} icon={<BadgeIcon />} />
            <InfoRow label="Adı" value={member?.firstName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Soyadı" value={member?.lastName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Anne Adı" value={member?.motherName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Baba Adı" value={member?.fatherName || '-'} icon={<PersonIcon />} />
            <InfoRow
              label="Doğum Tarihi"
              value={member?.birthDate ? new Date(member.birthDate).toLocaleDateString('tr-TR') : '-'}
              icon={<CalendarTodayIcon />}
            />
            <InfoRow label="Doğum Yeri" value={member?.birthplace || '-'} icon={<PlaceIcon />} />
            <InfoRow
              label="Cinsiyet"
              value={member?.gender === 'MALE' ? 'Erkek' : member?.gender === 'FEMALE' ? 'Kadın' : '-'}
              icon={<PersonIcon />}
            />
            <InfoRow
              label="Öğrenim Durumu"
              value={
                member?.educationStatus === 'COLLEGE'
                  ? 'Yüksekokul'
                  : member?.educationStatus === 'HIGH_SCHOOL'
                    ? 'Lise'
                    : member?.educationStatus === 'PRIMARY'
                      ? 'İlköğretim'
                      : '-'
              }
              icon={<SchoolIcon />}
            />
            <InfoRow label="Telefon" value={member?.phone || '-'} icon={<PhoneIcon />} />
            <InfoRow label="E-posta" value={member?.email || '-'} icon={<EmailIcon />} />
            <InfoRow 
              label="İl (Kayıtlı Olduğu Yer)" 
              value={member?.province?.name || '-'} 
              icon={<PlaceIcon />} 
            />
            <InfoRow 
              label="İlçe (Kayıtlı Olduğu Yer)" 
              value={member?.district?.name || '-'} 
              icon={<PlaceIcon />} 
            />
          </Box>
        </SectionCard>

        {/* Kurum ve Şube Bilgileri */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
          {/* Kurum Bilgileri */}
          <SectionCard title="Kurum Bilgileri" icon={<WorkIcon />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow label="Kurum Adı" value={member?.institution?.name || '-'} icon={<AccountBalanceIcon />} />
              <InfoRow label="Görev Birimi" value={member?.dutyUnit || '-'} icon={<WorkIcon />} />
              <InfoRow label="Kurum Adresi" value={member?.institutionAddress || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Kurum İli" value={member?.institutionProvince?.name || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Kurum İlçesi" value={member?.institutionDistrict?.name || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Meslek/Unvan" value={member?.profession?.name || '-'} icon={<WorkIcon />} />
              <InfoRow label="Kurum Sicil No" value={member?.institutionRegNo || '-'} icon={<BadgeIcon />} />
              <InfoRow label="Kadro Unvan Kodu" value={member?.staffTitleCode || '-'} icon={<BadgeIcon />} />
            </Box>
          </SectionCard>

          {/* Şube Bilgileri */}
          <SectionCard title="Şube Bilgileri" icon={<CorporateFareIcon />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow
                label="Şube"
                value={member?.branch?.name ? `${member.branch.name}${member.branch.code ? ` (${member.branch.code})` : ''}` : '-'}
                icon={<AccountBalanceIcon />}
              />
            </Box>
          </SectionCard>
        </Box>

        {/* Tevkifat ve Üyelik Bilgileri */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
          {/* Tevkifat */}
          <SectionCard title="Tevkifat Bilgileri" icon={<AccountBalanceIcon />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow label="Tevkifat Kurumu" value={member?.tevkifatCenter?.name || '-'} icon={<CorporateFareIcon />} />
              <InfoRow label="Tevkifat Ünvanı" value={member?.tevkifatTitle?.name || '-'} icon={<WorkIcon />} />
            </Box>
          </SectionCard>

          {/* Üyelik Bilgileri */}
          <SectionCard title="Üyelik Bilgileri" icon={<PersonIcon />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow label="Üyelik Durumu" value={statusConfig.label} icon={<CheckCircleIcon />} />
              <InfoRow label="Üye Grubu" value={member?.membershipInfoOption?.label || '-'} icon={<PersonIcon />} />
              <InfoRow label="Yönetim Karar Defteri No" value={member?.boardDecisionBookNo || '-'} icon={<BadgeIcon />} />
              <InfoRow
                label="Yönetim Kurulu Karar Tarihi"
                value={member?.boardDecisionDate ? new Date(member.boardDecisionDate).toLocaleDateString('tr-TR') : '-'}
                icon={<CalendarTodayIcon />}
              />
            </Box>
          </SectionCard>
        </Box>

        {/* Üyelik Evrakları */}
        <SectionCard 
          title="Üyelik Evrakları" 
          icon={<UploadFileIcon />}
          actions={
            canUploadDocument && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleOpenGenerateDialog}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                    bgcolor: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: theme.palette.error.dark,
                    },
                  }}
                >
                  PDF Oluştur
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<UploadFileIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  Evrak Yükle
                </Button>
              </Box>
            )
          }
        >
          {loadingDocuments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                bgcolor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              Bu üye için henüz evrak yüklenmemiştir.
            </Alert>
          ) : (
            <TableContainer 
              component={Paper} 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: 'none',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: alpha(theme.palette.divider, 0.05),
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.5),
                  },
                },
              }}
            >
              <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                <TableHead>
                  <TableRow 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Doküman Türü</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Dosya Adı</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Oluşturulma Tarihi</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', lg: 'table-cell' } }}>Oluşturan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map(document => (
                    <TableRow 
                      key={document.id} 
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {getDocumentTypeLabel(document.documentType)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.fileName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.generatedAt ? new Date(document.generatedAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.generatedByUser ? `${document.generatedByUser.firstName} ${document.generatedByUser.lastName}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<GetAppIcon />}
                            onClick={async () => {
                              try {
                                await viewDocument(document.id);
                              } catch (error) {
                                console.error('Dosya görüntülenirken hata:', error);
                                toast.showError('Dosya görüntülenemedi');
                              }
                            }}
                            sx={{
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              px: { xs: 1, sm: 1.5 },
                              py: { xs: 0.5, sm: 0.75 },
                              minWidth: 'auto',
                            }}
                          >
                            Görüntüle
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<GetAppIcon />}
                            onClick={async () => {
                              try {
                                await downloadDocument(document.id, document.fileName);
                                toast.showSuccess('Dosya başarıyla indirildi');
                              } catch (error) {
                                console.error('Dosya indirilirken hata:', error);
                                toast.showError('Dosya indirilemedi');
                              }
                            }}
                            sx={{
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              px: { xs: 1, sm: 1.5 },
                              py: { xs: 0.5, sm: 0.75 },
                              minWidth: 'auto',
                            }}
                          >
                            İndir
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {/* Ödemeler */}
        <SectionCard title="Aidat / Ödeme Geçmişi" icon={<PaymentIcon />}>
            {loadingPayments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : payments.length === 0 ? (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                }}
              >
                Bu üye için henüz ödeme kaydı bulunmamaktadır. Yeni ödeme eklemek için yukarıdaki "Ödeme Ekle" butonunu kullanabilirsiniz.
              </Alert>
            ) : (
              <TableContainer 
                component={Paper} 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: 'none',
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: alpha(theme.palette.divider, 0.05),
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.5),
                    },
                  },
                }}
              >
                <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Dönem</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Tutar</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>Ödeme Türü</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Belge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map(payment => {
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
                      const monthName = monthNames[payment.paymentPeriodMonth - 1];

                      const paymentTypeLabels: any = {
                        TEVKIFAT: 'Tevkifat',
                        ELDEN: 'Elden',
                        HAVALE: 'Havale',
                      };

                      return (
                        <TableRow 
                          key={payment.id} 
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.03),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {monthName} {payment.paymentPeriodYear}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {parseFloat(payment.amount).toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              TL
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Chip
                              label={paymentTypeLabels[payment.paymentType]}
                              size="small"
                              color={payment.paymentType === 'TEVKIFAT' ? 'primary' : payment.paymentType === 'ELDEN' ? 'secondary' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            {payment.isApproved ? (
                              <Chip 
                                icon={<CheckCircleIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />} 
                                label="Onaylı" 
                                color="success" 
                                size="small" 
                                sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }} 
                              />
                            ) : (
                              <Chip 
                                icon={<WarningIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />} 
                                label="Beklemede" 
                                color="warning" 
                                size="small" 
                                sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }} 
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            {payment.documentUrl ? (
                              <Link 
                                href={payment.documentUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    textDecoration: 'underline',
                                  },
                                }}
                              >
                                <GetAppIcon fontSize="small" />
                                Görüntüle
                              </Link>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
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

        {/* Ödeme Ekleme Dialog */}
        <Dialog 
          open={paymentDialogOpen} 
          onClose={() => !submittingPayment && setPaymentDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.primary.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
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
                <PaymentIcon />
              </Box>
              Yeni Ödeme Ekle
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                <FormControl fullWidth>
                  <InputLabel>Ödeme Dönemi Ay</InputLabel>
                  <Select
                    value={paymentForm.paymentPeriodMonth}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentPeriodMonth: Number(e.target.value) })}
                    label="Ödeme Dönemi Ay"
                    disabled={submittingPayment}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
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
                    ].map(month => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Ödeme Dönemi Yıl"
                  type="number"
                  value={paymentForm.paymentPeriodYear}
                  onChange={e => setPaymentForm({ ...paymentForm, paymentPeriodYear: Number(e.target.value) })}
                  disabled={submittingPayment}
                  inputProps={{ min: 2020, max: 2100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <Box sx={{ gridColumn: 'span 1' }}>
                  <TextField
                    fullWidth
                    label="Tutar"
                    type="text"
                    value={paymentForm.amount}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9.,]/g, '');
                      setPaymentForm({ ...paymentForm, amount: value });
                    }}
                    disabled={submittingPayment}
                    placeholder="250.00"
                    helperText="Örnek: 250.00"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ gridColumn: 'span 1' }}>
                  <FormControl fullWidth>
                    <InputLabel>Ödeme Türü</InputLabel>
                    <Select
                      value={paymentForm.paymentType}
                      onChange={e => setPaymentForm({ ...paymentForm, paymentType: e.target.value as PaymentType })}
                      label="Ödeme Türü"
                      disabled={submittingPayment}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.divider, 0.2),
                        },
                      }}
                    >
                      <MenuItem value="ELDEN">Elden Ödeme</MenuItem>
                      <MenuItem value="HAVALE">Havale/EFT</MenuItem>
                      <MenuItem value="TEVKIFAT">Tevkifat</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ gridColumn: { xs: 'span 1', sm: 'span 2' } }}>
                  <TextField
                    fullWidth
                    label="Açıklama"
                    multiline
                    rows={3}
                    value={paymentForm.description}
                    onChange={e => setPaymentForm({ ...paymentForm, description: e.target.value })}
                    disabled={submittingPayment}
                    placeholder="Ödeme açıklaması (opsiyonel)"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
            <Button 
              onClick={() => setPaymentDialogOpen(false)} 
              disabled={submittingPayment}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleSubmitPayment}
              variant="contained"
              disabled={submittingPayment || !paymentForm.amount || !paymentForm.paymentPeriodMonth || !paymentForm.paymentPeriodYear}
              startIcon={submittingPayment ? <CircularProgress size={16} /> : <PaymentIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {submittingPayment ? 'Ekleniyor...' : 'Ödeme Ekle'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Evrak Yükleme Dialog */}
        <Dialog 
          open={uploadDialogOpen} 
          onClose={() => {
            if (!uploading) {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setDocumentType('UPLOADED');
              setDescription('');
              setCustomFileName('');
            }
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.primary.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
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
                <UploadFileIcon />
              </Box>
              Evrak Yükle
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: 'application/pdf' }}
                onChange={handleFileSelect}
                label="PDF Dosyası Seç"
                InputLabelProps={{ shrink: true }}
                helperText="Sadece PDF dosyaları yüklenebilir"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              {selectedFile && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Seçilen dosya: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Alert>
              )}
              <TextField
                fullWidth
                label="Dosya Adı"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Dosya adını girin (uzantı otomatik eklenir)"
                helperText="Dosya adını değiştirmek için buraya yeni adı yazın. PDF uzantısı otomatik eklenir."
                disabled={uploading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Doküman Tipi</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Doküman Tipi"
                  disabled={uploading}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.2),
                    },
                  }}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Dokümanın türünü seçin</FormHelperText>
              </FormControl>
              <TextField
                fullWidth
                label="Açıklama (Opsiyonel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Doküman hakkında ek bilgiler..."
                disabled={uploading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
            <Button 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setDocumentType('UPLOADED');
                setDescription('');
                setCustomFileName('');
              }} 
              disabled={uploading}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={uploading || !selectedFile || !documentType}
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* PDF Oluşturma Dialog */}
        <Dialog 
          open={generateDialogOpen} 
          onClose={() => {
            if (!generating) {
              setGenerateDialogOpen(false);
              setSelectedTemplate(null);
            }
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.primary.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                }}
              >
                <PictureAsPdfIcon />
              </Box>
              PDF Doküman Oluştur
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {loadingTemplates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Şablon Seç</InputLabel>
                  <Select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                    }}
                    label="Şablon Seç"
                    disabled={generating}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {templates.length === 0 && (
                    <FormHelperText>
                      Aktif şablon bulunamadı. Önce bir şablon oluşturun.
                    </FormHelperText>
                  )}
                </FormControl>
              )}
              {selectedTemplate && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    Seçilen Şablon: {selectedTemplate.name}
                  </Typography>
                  {selectedTemplate.description && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedTemplate.description}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
            <Button
              onClick={() => {
                setGenerateDialogOpen(false);
                setSelectedTemplate(null);
              }}
              disabled={generating}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleGenerate}
              variant="contained"
              disabled={!selectedTemplate || generating}
              startIcon={generating ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                bgcolor: theme.palette.error.main,
                '&:hover': {
                  bgcolor: theme.palette.error.dark,
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
                },
              }}
            >
              {generating ? 'Oluşturuluyor...' : 'PDF Oluştur'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Onay Bilgileri */}
        {member?.approvedBy && member?.approvedAt && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              bgcolor: alpha(theme.palette.success.main, 0.08),
              '& .MuiAlert-icon': { 
                fontSize: '1.8rem',
                color: theme.palette.success.main,
              },
              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.1)}`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, fontSize: '1rem', color: theme.palette.success.dark }}>
              ✓ Üyelik Onayı
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              <strong>
                {member.approvedBy.firstName} {member.approvedBy.lastName}
              </strong>{' '}
              tarafından{' '}
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
        )}
      </Box>

      {/* Durum Değiştirme Dialog */}
      {member && (
        <MemberStatusChangeDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          onConfirm={handleStatusChange}
          currentStatus={member.status}
          memberName={`${member.firstName} ${member.lastName}`}
          loading={updatingStatus}
        />
      )}
    </Box>
  );
};

export default MemberDetailPage;
