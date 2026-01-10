// src/pages/users/PanelUserApplicationsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  InputAdornment,
  Stack,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Fade,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useNavigate } from 'react-router-dom';

import type { PanelUserApplication } from '../../api/panelUserApplicationsApi';
import {
  getPanelUserApplications,
  approvePanelUserApplication,
  rejectPanelUserApplication,
} from '../../api/panelUserApplicationsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import ApprovePanelUserApplicationDialog from '../../components/users/ApprovePanelUserApplicationDialog';
import RejectPanelUserApplicationDialog from '../../components/users/RejectPanelUserApplicationDialog';

const PanelUserApplicationsPage: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<PanelUserApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedApplication, setSelectedApplication] = useState<PanelUserApplication | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { hasPermission } = useAuth();
  const canApprove = hasPermission('PANEL_USER_APPLICATION_APPROVE');
  const canReject = hasPermission('PANEL_USER_APPLICATION_REJECT');

  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Durum filtresi
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Metin araması
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.member.firstName.toLowerCase().includes(searchLower) ||
          row.member.lastName.toLowerCase().includes(searchLower) ||
          row.member.nationalId.toLowerCase().includes(searchLower) ||
          row.member.email?.toLowerCase().includes(searchLower) ||
          row.requestedRole.name.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, statusFilter, searchText]);

  const pendingCount = filteredRows.filter(r => r.status === 'PENDING').length;
  const approvedCount = filteredRows.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = filteredRows.filter(r => r.status === 'REJECTED').length;

  const columns: GridColDef<PanelUserApplication>[] = [
    {
      field: 'memberName',
      headerName: 'Başvuran Üye',
      flex: 1.5,
      minWidth: 220,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            {params.row.member.firstName} {params.row.member.lastName}
          </Typography>
          {params.row.member.email && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mt: 0.25 }}>
              {params.row.member.email}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'requestedRole',
      headerName: 'İstenen Rol',
      flex: 1,
      minWidth: 160,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) => (
        <Chip
          label={params.row.requestedRole.name}
          size="small"
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            height: 28,
            '& .MuiChip-label': { px: 1.5 }
          }}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 140,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) => {
        const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info'; icon: JSX.Element }> = {
          PENDING: { 
            label: 'Beklemede', 
            color: 'warning',
            icon: <PendingIcon sx={{ fontSize: '1rem' }} />
          },
          APPROVED: { 
            label: 'Onaylandı', 
            color: 'success',
            icon: <CheckCircleIcon sx={{ fontSize: '1rem' }} />
          },
          REJECTED: { 
            label: 'Reddedildi', 
            color: 'error',
            icon: <CancelIcon sx={{ fontSize: '1rem' }} />
          },
        };
        const config = statusConfig[params.row.status] || { label: params.row.status, color: 'info' as const, icon: <PersonIcon sx={{ fontSize: '1rem' }} /> };
        return (
          <Chip
            icon={config.icon}
            label={config.label}
            color={config.color}
            size="small"
            sx={{ 
              fontWeight: 600,
              '& .MuiChip-icon': { ml: 1 }
            }}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Başvuru Tarihi',
      width: 140,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {new Date(params.row.createdAt).toLocaleDateString('tr-TR')}
        </Typography>
      ),
    },
    {
      field: 'reviewedBy',
      headerName: 'İşlem Yapan',
      flex: 1,
      minWidth: 140,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) =>
        params.row.reviewedByUser ? (
          <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
            {params.row.reviewedByUser.firstName} {params.row.reviewedByUser.lastName}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
            -
          </Typography>
        ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 180,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<PanelUserApplication>) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Üye Detayı" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/members/${params.row.memberId}`);
              }}
              sx={{
                color: theme.palette.primary.main,
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.1)',
                },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'PENDING' && (
            <>
              {canApprove && (
                <Tooltip title="Başvuruyu Onayla" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(params.row);
                      setApproveDialogOpen(true);
                    }}
                    sx={{
                      color: theme.palette.success.main,
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <CheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canReject && (
                <Tooltip title="Başvuruyu Reddet" arrow placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(params.row);
                      setRejectDialogOpen(true);
                    }}
                    sx={{
                      color: theme.palette.error.main,
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Box>
      ),
    },
  ];

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const data = await getPanelUserApplications();
        setRows(data);
      } catch (e) {
        console.error('Başvurular alınırken hata:', e);
        toast.showError('Başvurular alınırken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const handleApproveSuccess = () => {
    const fetchApplications = async () => {
      try {
        const data = await getPanelUserApplications();
        setRows(data);
      } catch (e) {
        console.error('Başvurular alınırken hata:', e);
      }
    };
    fetchApplications();
  };

  const handleRejectSuccess = () => {
    const fetchApplications = async () => {
      try {
        const data = await getPanelUserApplications();
        setRows(data);
      } catch (e) {
        console.error('Başvurular alınırken hata:', e);
      }
    };
    fetchApplications();
  };

  return (
    <Fade in timeout={300}>
      <Box sx={{ pb: 4 }}>
        {/* Başlık Bölümü */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: `0 8px 16px 0 ${alpha(theme.palette.warning.main, 0.3)}`,
              }}
            >
              <BadgeIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  color: theme.palette.text.primary,
                  mb: 0.5,
                  textAlign: 'left',
                }}
              >
                Panel Kullanıcı Başvuruları
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                  textAlign: 'left',
                }}
              >
                Üyelerin panel kullanıcılığına terfi başvurularını görüntüleyin ve yönetin
              </Typography>
            </Box>
          </Box>

          {/* İstatistik Kartları */}
          {!loading && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.warning.main, 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Bekleyen Başvuru
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, textAlign: 'left' }}>
                        {pendingCount}
                      </Typography>
                    </Box>
                    <PendingIcon sx={{ fontSize: 40, color: alpha(theme.palette.warning.main, 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Onaylanan Başvuru
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, textAlign: 'left' }}>
                        {approvedCount}
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: alpha(theme.palette.success.main, 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.light, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.15)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 0.5, textAlign: 'left' }}>
                        Reddedilen Başvuru
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.error.main, textAlign: 'left' }}>
                        {rejectedCount}
                      </Typography>
                    </Box>
                    <CancelIcon sx={{ fontSize: 40, color: alpha(theme.palette.error.main, 0.3) }} />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>

        {/* Ana Kart */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.08)}`,
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* Filtreler */}
          <Box
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.02)} 0%, ${alpha(theme.palette.warning.light, 0.01)} 100%)`,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Üye adı, email veya rol ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.warning.main }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.warning.main,
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.warning.main, 0.1)}`,
                    },
                  },
                }}
              />
              <FormControl
                size="medium"
                sx={{
                  minWidth: { xs: '100%', sm: 240 },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    transition: 'all 0.3s',
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.warning.main, 0.1)}`,
                    },
                  },
                }}
              >
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon fontSize="small" />
                    Durum Filtrele
                  </Box>
                </InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum Filtrele"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <MenuItem value="ALL">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BadgeIcon fontSize="small" />
                      Tüm Başvurular
                    </Box>
                  </MenuItem>
                  <MenuItem value="PENDING">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PendingIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                      Beklemede
                    </Box>
                  </MenuItem>
                  <MenuItem value="APPROVED">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
                      Onaylandı
                    </Box>
                  </MenuItem>
                  <MenuItem value="REJECTED">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CancelIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                      Reddedildi
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* DataGrid */}
          <Box
            sx={{
              height: { xs: 500, sm: 600, md: 700 },
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                display: 'flex',
                alignItems: 'center',
                '&:focus': {
                  outline: 'none',
                },
                '&:focus-within': {
                  outline: 'none',
                },
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
                borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 0,
                minHeight: '56px !important',
                maxHeight: '56px !important',
              },
              '& .MuiDataGrid-columnHeaderTitleContainer': {
                justifyContent: 'center',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
              },
              '& .MuiDataGrid-row': {
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.warning.main, 0.04),
                  transform: 'scale(1.001)',
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.grey[50], 0.5),
              },
              '& .MuiDataGrid-virtualScroller': {
                minHeight: '300px',
              },
            }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25 },
                },
              }}
            />
          </Box>
        </Card>

        {/* Onay Dialog */}
        {selectedApplication && (
          <ApprovePanelUserApplicationDialog
            open={approveDialogOpen}
            onClose={() => {
              setApproveDialogOpen(false);
              setSelectedApplication(null);
            }}
            applicationId={selectedApplication.id}
            memberName={`${selectedApplication.member.firstName} ${selectedApplication.member.lastName}`}
            memberEmail={selectedApplication.member.email}
            onSuccess={handleApproveSuccess}
          />
        )}

        {/* Red Dialog */}
        {selectedApplication && (
          <RejectPanelUserApplicationDialog
            open={rejectDialogOpen}
            onClose={() => {
              setRejectDialogOpen(false);
              setSelectedApplication(null);
            }}
            applicationId={selectedApplication.id}
            memberName={`${selectedApplication.member.firstName} ${selectedApplication.member.lastName}`}
            onSuccess={handleRejectSuccess}
          />
        )}
      </Box>
    </Fade>
  );
};

export default PanelUserApplicationsPage;

