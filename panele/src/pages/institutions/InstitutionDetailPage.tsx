// src/pages/institutions/InstitutionDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getInstitutionById,
  approveInstitution,
  rejectInstitution,
  type Institution,
} from '../../api/institutionsApi';

const InstitutionDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const canView = hasPermission('INSTITUTION_VIEW');
  const canApprove = hasPermission('INSTITUTION_APPROVE');

  useEffect(() => {
    if (id && canView) {
      loadInstitution();
    }
  }, [id, canView]);

  const loadInstitution = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getInstitutionById(id);
      setInstitution(data);
    } catch (e: any) {
      console.error('Kurum detayı alınırken hata:', e);
      toast.showError('Kurum detayı alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!institution || !id) return;
    setApproving(true);
    try {
      await approveInstitution(id);
      toast.showSuccess('Kurum başarıyla onaylandı');
      loadInstitution();
    } catch (e: any) {
      console.error('Kurum onaylanırken hata:', e);
      toast.showError(e.response?.data?.message || 'Kurum onaylanırken bir hata oluştu');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!institution || !id) return;
    setRejecting(true);
    try {
      await rejectInstitution(id);
      toast.showSuccess('Kurum başarıyla reddedildi');
      loadInstitution();
    } catch (e: any) {
      console.error('Kurum reddedilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Kurum reddedilirken bir hata oluştu');
    } finally {
      setRejecting(false);
    }
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

  if (!institution) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Kurum bulunamadı</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/institutions')}
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
              <BusinessIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
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
                {institution.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                Kurum Detay Bilgileri
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={institution.isActive ? 'Aktif' : 'Pasif'}
              color={institution.isActive ? 'success' : 'default'}
            />
            <Chip
              label={institution.approvedAt ? 'Onaylı' : 'Onay Bekliyor'}
              color={institution.approvedAt ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Kurum Bilgileri */}
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
              Kurum Bilgileri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Kurum Adı
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {institution.name}
                </Typography>
              </Box>
              {institution.province && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    İl
                  </Typography>
                  <Typography variant="body1">{institution.province.name}</Typography>
                </Box>
              )}
              {institution.district && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    İlçe
                  </Typography>
                  <Typography variant="body1">{institution.district.name}</Typography>
                </Box>
              )}
              {institution.branch && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Şube
                  </Typography>
                  <Typography variant="body1">{institution.branch.name}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Onay Bilgileri */}
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
              Onay Bilgileri
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Onay Durumu
                </Typography>
                <Typography variant="body1">
                  {institution.approvedAt ? (
                    <Chip label="Onaylandı" color="success" size="small" />
                  ) : (
                    <Chip label="Onay Bekliyor" color="warning" size="small" />
                  )}
                </Typography>
              </Box>
              {institution.approvedAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Onay Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {new Date(institution.approvedAt).toLocaleString('tr-TR')}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Oluşturulma Tarihi
                </Typography>
                <Typography variant="body1">
                  {new Date(institution.createdAt).toLocaleString('tr-TR')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Son Güncelleme
                </Typography>
                <Typography variant="body1">
                  {new Date(institution.updatedAt).toLocaleString('tr-TR')}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* İşlemler */}
        {canApprove && !institution.approvedAt && (
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
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default InstitutionDetailPage;

