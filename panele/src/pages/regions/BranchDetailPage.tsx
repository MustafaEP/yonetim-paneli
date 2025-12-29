// src/pages/regions/BranchDetailPage.tsx
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getBranchById, type BranchDetail } from '../../api/branchesApi';

const BranchDetailPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const canView = hasPermission('BRANCH_MANAGE') || hasPermission('MEMBER_LIST_BY_PROVINCE');

  useEffect(() => {
    if (id && canView) {
      loadBranch();
    }
  }, [id, canView]);

  const loadBranch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBranchById(id);
      setBranch(data);
    } catch (e: any) {
      console.error('Şube detayı alınırken hata:', e);
      toast.showError('Şube detayı alınamadı');
    } finally {
      setLoading(false);
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

  if (!branch) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Şube bulunamadı</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/regions/branches')}
          sx={{ mb: 2 }}
        >
          Geri Dön
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
              {branch.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Şube Detayları
            </Typography>
          </Box>
          <Chip
            label={branch.isActive ? 'Aktif' : 'Pasif'}
            color={branch.isActive ? 'success' : 'default'}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Genel Bilgiler */}
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
              Genel Bilgiler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Kod
                </Typography>
                <Typography variant="body1">{branch.code || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Şube Başkanı
                </Typography>
                <Typography variant="body1">
                  {branch.president
                    ? `${branch.president.firstName} ${branch.president.lastName}`
                    : '-'}
                </Typography>
              </Box>
              {branch.address && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Adres
                  </Typography>
                  <Typography variant="body1">{branch.address}</Typography>
                </Box>
              )}
              {branch.phone && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Telefon
                  </Typography>
                  <Typography variant="body1">{branch.phone}</Typography>
                </Box>
              )}
              {branch.email && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    E-posta
                  </Typography>
                  <Typography variant="body1">{branch.email}</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        {/* İstatistikler */}
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
              İstatistikler
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Toplam Üye Sayısı
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {branch.memberCount || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Aktif Üye Sayısı
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {branch.activeMemberCount || 0}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Tevkifat Merkezlerinden Gelen Toplam Gelir
                </Typography>
                <Typography variant="body1" fontWeight={600} color="primary.main">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(Number(branch.totalRevenue || 0))}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Şube Payı ({branch.branchSharePercent || 40}%)
                </Typography>
                <Typography variant="body1" fontWeight={600} color="success.main">
                  {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                  }).format(Number(branch.branchShareAmount || 0))}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
};

export default BranchDetailPage;
