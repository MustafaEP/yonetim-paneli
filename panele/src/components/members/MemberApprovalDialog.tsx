// src/components/members/MemberApprovalDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  Grid,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookIcon from '@mui/icons-material/Book';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import PersonIcon from '@mui/icons-material/Person';
import { getBranches } from '../../api/branchesApi';
import type { Branch } from '../../api/branchesApi';
import { getTevkifatCenters, getTevkifatTitles } from '../../api/accountingApi';

export interface ApproveFormData {
  registrationNumber: string;
  boardDecisionDate: string;
  boardDecisionBookNo: string;
  tevkifatCenterId: string;
  tevkifatTitleId: string;
  branchId: string;
  memberGroupId: string;
}

interface MemberApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ApproveFormData) => Promise<void>;
  loading?: boolean;
  initialFormData?: Partial<ApproveFormData>;
  successMessage?: string;
}

const MemberApprovalDialog: React.FC<MemberApprovalDialogProps> = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  initialFormData,
  successMessage = 'Bu başvuruyu onaylamak istediğinize emin misiniz? Onaylandıktan sonra üye aktif hale gelecektir.',
}) => {
  const theme = useTheme();
  const [approveForm, setApproveForm] = useState<ApproveFormData>({
    registrationNumber: '',
    boardDecisionDate: '',
    boardDecisionBookNo: '',
    tevkifatCenterId: '',
    tevkifatTitleId: '',
    branchId: '',
    memberGroupId: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tevkifatCenters, setTevkifatCenters] = useState<Array<{ id: string; name: string; title: string | null }>>([]);
  const [tevkifatTitles, setTevkifatTitles] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [memberGroups, setMemberGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Dialog açıldığında verileri yükle
  useEffect(() => {
    if (open) {
      loadData();
      // Initial form data varsa set et
      if (initialFormData) {
        setApproveForm((prev) => ({
          ...prev,
          ...initialFormData,
        }));
      } else {
        // Varsayılan "Üye" grubunu bul
        const defaultMemberGroup = memberGroups.find((g) => g.name === 'Üye');
        const defaultMemberGroupId = defaultMemberGroup?.id || '';
        setApproveForm({
          registrationNumber: '',
          boardDecisionDate: '',
          boardDecisionBookNo: '',
          tevkifatCenterId: '',
          tevkifatTitleId: '',
          branchId: '',
          memberGroupId: defaultMemberGroupId,
        });
      }
    }
  }, [open]);

  // Üye grupları yüklendiğinde varsayılan grubu set et
  useEffect(() => {
    if (memberGroups.length > 0 && !approveForm.memberGroupId && !initialFormData?.memberGroupId) {
      const defaultMemberGroup = memberGroups.find((g) => g.name === 'Üye');
      const defaultMemberGroupId = defaultMemberGroup?.id || '';
      if (defaultMemberGroupId) {
        setApproveForm((prev) => ({ ...prev, memberGroupId: defaultMemberGroupId }));
      }
    }
  }, [memberGroups]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [branchesData, centersData, titlesData] = await Promise.all([
        getBranches({ isActive: true }),
        getTevkifatCenters(),
        getTevkifatTitles(),
      ]);

      setBranches(branchesData);
      const activeCenters = centersData
        .filter((c) => c.isActive)
        .map((c) => ({ id: c.id, name: c.name, title: c.title }));
      setTevkifatCenters(activeCenters);
      const activeTitles = titlesData.filter((t) => t.isActive);
      setTevkifatTitles(activeTitles);

      // Üye gruplarını yükle
      try {
        const { getMemberGroups } = await import('../../api/memberGroupsApi');
        const groupsData = await getMemberGroups();
        setMemberGroups(groupsData || []);
      } catch (e) {
        console.error('Üye grupları yüklenirken hata:', e);
      }
    } catch (error) {
      console.error('Onaylama verileri yüklenirken hata:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleConfirm = async () => {
    // Form validasyonu
    if (!approveForm.registrationNumber.trim()) {
      return;
    }
    if (!approveForm.boardDecisionDate) {
      return;
    }
    if (!approveForm.boardDecisionBookNo.trim()) {
      return;
    }
    if (!approveForm.tevkifatCenterId) {
      return;
    }
    if (!approveForm.tevkifatTitleId) {
      return;
    }
    if (!approveForm.branchId) {
      return;
    }
    if (!approveForm.memberGroupId) {
      return;
    }

    await onConfirm(approveForm);
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isFormValid =
    approveForm.registrationNumber.trim() &&
    approveForm.boardDecisionDate &&
    approveForm.boardDecisionBookNo.trim() &&
    approveForm.tevkifatCenterId &&
    approveForm.tevkifatTitleId &&
    approveForm.branchId &&
    approveForm.memberGroupId;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.2)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2.5,
          pt: 3,
          px: 3,
          borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.02)} 0%, ${alpha(theme.palette.success.light, 0.01)} 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.35)}`,
            }}
          >
            <CheckIcon sx={{ fontSize: '2rem', color: '#fff' }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
              Başvuruyu Onayla
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Üyelik bilgilerini tamamlayın
            </Typography>
          </Box>
        </Box>
        {!loading && (
          <IconButton
            onClick={handleClose}
            size="medium"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 3.5, pb: 3, px: 3 }}>
        {loadingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3.5,
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              {successMessage} Aşağıdaki bilgileri doldurarak üyelik kaydını tamamlayabilirsiniz.
            </Typography>

            {/* Yönetici Bilgileri Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <BadgeIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.info.dark }}>
                  Yönetici Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    label="Üye Numarası *"
                    value={approveForm.registrationNumber}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, registrationNumber: e.target.value }))
                    }
                    fullWidth
                    required
                    placeholder="Örn: UYE-00001"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 300,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Yönetim Karar Defteri No *"
                    value={approveForm.boardDecisionBookNo}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, boardDecisionBookNo: e.target.value }))
                    }
                    fullWidth
                    required
                    placeholder="Örn: 2025/01"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BookIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Yönetim Kurulu Karar Tarihi *"
                    type="date"
                    value={approveForm.boardDecisionDate}
                    onChange={(e) =>
                      setApproveForm((prev) => ({ ...prev, boardDecisionDate: e.target.value }))
                    }
                    fullWidth
                    required
                    disabled={loading}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      minWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2.5,
                        backgroundColor: '#fff',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.12)}`,
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Tevkifat Bilgileri Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.06)} 0%, ${alpha(theme.palette.secondary.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                  }}
                >
                  <AccountBalanceIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.secondary.dark }}>
                  Tevkifat Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={tevkifatCenters}
                    value={tevkifatCenters.find((c) => c.id === approveForm.tevkifatCenterId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, tevkifatCenterId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tevkifat Kurumu *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <CorporateFareIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 250,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={tevkifatTitles}
                    value={tevkifatTitles.find((t) => t.id === approveForm.tevkifatTitleId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, tevkifatTitleId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tevkifat Ünvanı *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 250,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Şube Seçimi Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.06)} 0%, ${alpha(theme.palette.info.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                >
                  <CorporateFareIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.info.dark }}>
                  Şube Seçimi
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={branches}
                    value={branches.find((b) => b.id === approveForm.branchId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, branchId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => `${option.name}${option.code ? ` (${option.code})` : ''}`}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Şube *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <AccountBalanceIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 300,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Üyelik Bilgileri Bölümü */}
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.06)} 0%, ${alpha(theme.palette.success.light, 0.03)} 100%)`,
                border: `2px dashed ${alpha(theme.palette.success.main, 0.2)}`,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1.5,
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                  }}
                >
                  <PersonIcon sx={{ color: '#fff', fontSize: '1.2rem' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.success.dark }}>
                  Üyelik Bilgileri
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={memberGroups}
                    value={memberGroups.find((g) => g.id === approveForm.memberGroupId) || null}
                    onChange={(_, newValue) =>
                      setApproveForm((prev) => ({ ...prev, memberGroupId: newValue?.id || '' }))
                    }
                    getOptionLabel={(option) => option.name}
                    isOptionEqualTo={(option, value) => option.id === value.id}
                    disabled={loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Üye Grubu *"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.3rem' }} />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          minWidth: 300,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2.5,
                            backgroundColor: '#fff',
                          },
                        }}
                      />
                    )}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          gap: 1.5,
          borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
          justifyContent: 'flex-end',
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          size="large"
          sx={{
            borderRadius: 2.5,
            px: 4,
            py: 1.25,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem',
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: alpha(theme.palette.grey[500], 0.08),
            },
          }}
        >
          İptal
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || !isFormValid}
          variant="contained"
          size="large"
          color="success"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckIcon />}
          sx={{
            borderRadius: 2.5,
            px: 4,
            py: 1.25,
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem',
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            boxShadow: `0 8px 24px ${alpha(theme.palette.success.main, 0.35)}`,
            '&:hover': {
              boxShadow: `0 12px 32px ${alpha(theme.palette.success.main, 0.45)}`,
              background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
            },
          }}
        >
          {loading ? 'Onaylanıyor...' : 'Onayla ve Kaydet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberApprovalDialog;

