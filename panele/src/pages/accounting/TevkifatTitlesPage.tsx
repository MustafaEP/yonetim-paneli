// src/pages/accounting/TevkifatTitlesPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import BadgeIcon from '@mui/icons-material/Badge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  getTevkifatTitles,
  createTevkifatTitle,
  updateTevkifatTitle,
  deleteTevkifatTitle,
  type TevkifatTitle,
  type CreateTevkifatTitleDto,
} from '../../api/accountingApi';

const TevkifatTitlesPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [titles, setTitles] = useState<TevkifatTitle[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<TevkifatTitle | null>(null);
  const [titleForm, setTitleForm] = useState<CreateTevkifatTitleDto>({ name: '' });
  const [savingTitle, setSavingTitle] = useState(false);
  const [deleteTitleDialogOpen, setDeleteTitleDialogOpen] = useState(false);
  const [deactivateTitleDialogOpen, setDeactivateTitleDialogOpen] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState<TevkifatTitle | null>(null);
  const [deactivatingTitle, setDeactivatingTitle] = useState<TevkifatTitle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canView = hasPermission('ACCOUNTING_VIEW');
  const canManage = hasPermission('ACCOUNTING_VIEW');

  useEffect(() => {
    if (canView) {
      loadTitles();
    }
  }, [canView]);

  const loadTitles = async () => {
    setLoadingTitles(true);
    try {
      const data = await getTevkifatTitles();
      setTitles(data);
    } catch (e: any) {
      console.error('Tevkifat unvanları yüklenirken hata:', e);
      toast.showError('Tevkifat unvanları yüklenirken bir hata oluştu');
    } finally {
      setLoadingTitles(false);
    }
  };

  // Tevkifat Unvanları handler'ları
  const handleOpenTitleDialog = (title?: TevkifatTitle) => {
    if (title) {
      setEditingTitle(title);
      setTitleForm({ name: title.name });
    } else {
      setEditingTitle(null);
      setTitleForm({ name: '' });
    }
    setTitleDialogOpen(true);
  };

  const handleCloseTitleDialog = () => {
    setTitleDialogOpen(false);
    setEditingTitle(null);
    setTitleForm({ name: '' });
  };

  const handleSaveTitle = async () => {
    if (!titleForm.name.trim()) {
      toast.showError('Unvan adı gereklidir');
      return;
    }

    setSavingTitle(true);
    try {
      if (editingTitle) {
        await updateTevkifatTitle(editingTitle.id, titleForm);
        toast.showSuccess('Tevkifat unvanı güncellendi');
      } else {
        await createTevkifatTitle(titleForm);
        toast.showSuccess('Tevkifat unvanı oluşturuldu');
      }
      handleCloseTitleDialog();
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı kaydedilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı kaydedilirken bir hata oluştu');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleDeactivateTitle = async () => {
    if (!deactivatingTitle) return;

    setDeleting(true);
    try {
      await updateTevkifatTitle(deactivatingTitle.id, { isActive: false });
      toast.showSuccess('Tevkifat unvanı pasif yapıldı');
      setDeactivateTitleDialogOpen(false);
      setDeactivatingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı pasifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı pasifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteTitle = async () => {
    if (!deletingTitle) return;

    setDeleting(true);
    try {
      await deleteTevkifatTitle(deletingTitle.id);
      toast.showSuccess('Tevkifat unvanı silindi');
      setDeleteTitleDialogOpen(false);
      setDeletingTitle(null);
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı silinirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateTitle = async (title: TevkifatTitle) => {
    setDeleting(true);
    try {
      await updateTevkifatTitle(title.id, { isActive: true });
      toast.showSuccess('Tevkifat unvanı aktifleştirildi');
      loadTitles();
    } catch (e: any) {
      console.error('Tevkifat unvanı aktifleştirilirken hata:', e);
      toast.showError(e.response?.data?.message || 'Tevkifat unvanı aktifleştirilirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  if (!canView) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: `0 4px 16px ${alpha(theme.palette.error.main, 0.15)}`,
          }}
        >
          <BadgeIcon sx={{ fontSize: 64, color: theme.palette.error.main, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Bu sayfaya erişim yetkiniz bulunmamaktadır.
          </Typography>
        </Paper>
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
      {/* Modern Header */}
      <Box sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 3, md: 4 } }}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            overflow: 'visible',
            position: 'relative',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 4,
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: { xs: 60, md: 80 },
                  height: { xs: 60, md: 80 },
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                }}
              >
                <BadgeIcon sx={{ fontSize: { xs: 32, md: 40 }, color: 'white' }} />
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
                    mb: 1,
                  }}
                >
                  Tevkifat Unvanları
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.95,
                    fontSize: { xs: '0.875rem', md: '1rem' },
                  }}
                >
                  Tevkifat merkezlerinde kullanılan unvanların yönetimi
                </Typography>
              </Box>
              {canManage && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTitleDialog()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    backgroundColor: 'white',
                    color: theme.palette.primary.main,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.9),
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                    },
                  }}
                >
                  Yeni Unvan Ekle
                </Button>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
            transform: 'translateY(-2px)',
          }
        }}
      >
        {loadingTitles ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Unvan Adı</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Durum</TableCell>
                  {canManage && (
                    <TableCell align="right" sx={{ fontWeight: 700 }}>İşlemler</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {titles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 3 : 2} align="center" sx={{ py: 6 }}>
                      <BadgeIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                      <Typography variant="body2" color="text.secondary">
                        Henüz unvan eklenmemiş
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  titles.map((title) => (
                    <TableRow 
                      key={title.id}
                      sx={{
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.06),
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{title.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={title.isActive ? 'Aktif' : 'Pasif'}
                          color={title.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      {canManage && (
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Tooltip title="Düzenle" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleOpenTitleDialog(title)}
                                sx={{ 
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  },
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {title.isActive ? (
                              <>
                                <Tooltip title="Pasif Yap" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setDeactivatingTitle(title);
                                      setDeactivateTitleDialogOpen(true);
                                    }}
                                    sx={{ 
                                      color: theme.palette.warning.main,
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                      },
                                    }}
                                  >
                                    <BlockIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Sil" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setDeletingTitle(title);
                                      setDeleteTitleDialogOpen(true);
                                    }}
                                    sx={{ 
                                      color: theme.palette.error.main,
                                      '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.1),
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            ) : (
                              <Tooltip title="Aktifleştir" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleActivateTitle(title)}
                                  disabled={deleting}
                                  sx={{ 
                                    color: theme.palette.success.main,
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                                    },
                                  }}
                                >
                                  <RestoreIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Unvan Ekle/Düzenle Dialog */}
      <Dialog 
        open={titleDialogOpen} 
        onClose={handleCloseTitleDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <BadgeIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {editingTitle ? 'Tevkifat Unvanı Düzenle' : 'Yeni Tevkifat Unvanı Ekle'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            label="Unvan Adı"
            value={titleForm.name}
            onChange={(e) => setTitleForm({ name: e.target.value })}
            fullWidth
            margin="normal"
            required
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.primary.main, 0.04) }}>
          <Button 
            onClick={handleCloseTitleDialog} 
            disabled={savingTitle}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleSaveTitle}
            variant="contained"
            disabled={savingTitle}
            startIcon={savingTitle ? <CircularProgress size={16} /> : <AddIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            {savingTitle ? 'Kaydediliyor...' : editingTitle ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Pasifleştir Dialog */}
      <Dialog 
        open={deactivateTitleDialogOpen} 
        onClose={() => setDeactivateTitleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <BlockIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tevkifat Unvanını Pasif Yap</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deactivatingTitle?.name}" adlı tevkifat unvanını pasif yapmak istediğinize emin misiniz?
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
            Pasif yapılan unvanlar listede görünmeye devam eder ancak yeni işlemler için kullanılamaz.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.warning.main, 0.04) }}>
          <Button 
            onClick={() => setDeactivateTitleDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeactivateTitle}
            color="warning"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <BlockIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Pasif Yapılıyor...' : 'Pasif Yap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unvan Sil Dialog */}
      <Dialog 
        open={deleteTitleDialogOpen} 
        onClose={() => setDeleteTitleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
          color: 'white',
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <DeleteIcon />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Tevkifat Unvanını Sil</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ mb: 1 }}>
            "{deletingTitle?.name}" adlı tevkifat unvanını kalıcı olarak silmek istediğinize emin misiniz?
          </Typography>
          <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              Bu işlem geri alınamaz. Unvan veritabanından tamamen silinecektir.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: alpha(theme.palette.error.main, 0.04) }}>
          <Button 
            onClick={() => setDeleteTitleDialogOpen(false)} 
            disabled={deleting}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleDeleteTitle}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }
            }}
          >
            {deleting ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TevkifatTitlesPage;

