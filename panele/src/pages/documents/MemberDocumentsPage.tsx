// src/pages/documents/MemberDocumentsPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Autocomplete from '@mui/material/Autocomplete';

import type { MemberDocument } from '../../api/documentsApi';
import { getMemberDocuments, uploadMemberDocument, downloadDocument, viewDocument } from '../../api/documentsApi';
import { getMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { MemberListItem } from '../../types/member';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '../../utils/documentTypes';

const MemberDocumentsPage: React.FC = () => {
  const { memberId: paramMemberId } = useParams<{ memberId?: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [selectedMember, setSelectedMember] = useState<MemberListItem | null>(null);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [rows, setRows] = useState<MemberDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('UPLOADED');
  const [description, setDescription] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');

  const canView = hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW');
  const canUpload = hasPermission('DOCUMENT_GENERATE_PDF');

  // Üyeleri yükle (sayfa ilk açıldığında veya paramMemberId değiştiğinde)
  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data);
      // URL'den gelen memberId varsa, o üyeyi seç
      if (paramMemberId) {
        const member = data.find((m) => m.id === paramMemberId);
        if (member) {
          setSelectedMember(member);
        } else {
          // Üye bulunamadıysa, state'i temizle
          setSelectedMember(null);
        }
      }
    } catch (e: any) {
      console.error('Üyeler yüklenirken hata:', e);
      toast.showError('Üyeler yüklenirken bir hata oluştu');
    }
  };

  useEffect(() => {
    loadMembers();
  }, [paramMemberId]); // paramMemberId değiştiğinde tekrar yükle

  useEffect(() => {
    if (selectedMember) {
      loadDocuments();
    } else {
      setRows([]);
    }
  }, [selectedMember]);

  const loadDocuments = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      const data = await getMemberDocuments(selectedMember.id);
      setRows(data);
    } catch (e: any) {
      console.error('Dokümanlar yüklenirken hata:', e);
      toast.showError('Dokümanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
    if (!selectedMember || !selectedFile) return;

    setUploading(true);
    try {
      const fileName = customFileName.trim() || selectedFile.name.replace(/\.pdf$/i, '');
      await uploadMemberDocument(selectedMember.id, selectedFile, documentType, description, fileName);
      toast.showSuccess('Doküman başarıyla yüklendi');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('UPLOADED');
      setDescription('');
      setCustomFileName('');
      loadDocuments();
    } catch (e: any) {
      console.error('Doküman yüklenirken hata:', e);
      toast.showError(e.response?.data?.message || 'Doküman yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'documentType',
      headerName: 'Doküman Türü',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => {
        return getDocumentTypeLabel(params.value || 'UPLOADED');
      },
    },
    {
      field: 'fileName',
      headerName: 'Dosya Adı',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'generatedAt',
      headerName: 'Oluşturulma Tarihi',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        return new Date(params.value).toLocaleString('tr-TR');
      },
    },
    {
      field: 'generatedByUser',
      headerName: 'Oluşturan',
      width: 150,
      renderCell: (params) => {
        const user = params.row.generatedByUser;
        if (!user) return '-';
        return `${user.firstName} ${user.lastName}`;
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const doc = params.row as MemberDocument;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Görüntüle">
              <IconButton
                size="small"
                onClick={async () => {
                  try {
                    await viewDocument(doc.id);
                  } catch (error) {
                    console.error('Dosya görüntülenirken hata:', error);
                    toast.showError('Dosya görüntülenemedi');
                  }
                }}
                sx={{ color: theme.palette.info.main }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="İndir">
              <IconButton
                size="small"
                onClick={async () => {
                  try {
                    // Dosya adını veritabanından al ve direkt kullan
                    await downloadDocument(doc.id, doc.fileName);
                  } catch (error) {
                    console.error('Dosya indirilirken hata:', error);
                    toast.showError('Dosya indirilemedi');
                  }
                }}
                sx={{ color: theme.palette.primary.main }}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
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
            <DescriptionIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
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
              {selectedMember 
                ? `${selectedMember.firstName} ${selectedMember.lastName} - Dokümanlar`
                : 'Üye Doküman Geçmişi'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              {selectedMember 
                ? `${selectedMember.firstName} ${selectedMember.lastName} adlı üyenin doküman geçmişi`
                : 'Üyelerin doküman geçmişini görüntüleyin - Üye seçin'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Autocomplete
            options={members}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName}${option.registrationNumber ? ` (${option.registrationNumber})` : ''}`
            }
            value={selectedMember}
            onChange={(_, newValue) => {
              setSelectedMember(newValue);
              // URL'yi güncelle
              if (newValue) {
                navigate(`/documents/members/${newValue.id}`, { replace: true });
              } else {
                navigate('/documents/members', { replace: true });
              }
            }}
            sx={{ flexGrow: 1, minWidth: 300, maxWidth: 500 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Üye Seçimi"
                placeholder={paramMemberId ? "Üye seçildi" : "Üye seçin"}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <PersonIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />,
                }}
              />
            )}
          />
          {paramMemberId && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => {
                setSelectedMember(null);
                navigate('/documents/members', { replace: true });
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Üye Seçimini Temizle
            </Button>
          )}
          {canUpload && selectedMember && (
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              Doküman Yükle
            </Button>
          )}
        </Box>
      </Box>

      {selectedMember ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 25 },
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              },
            }}
          />
        </Card>
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body1" color="text.secondary">
            Lütfen bir üye seçin
          </Typography>
        </Card>
      )}

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => {
          if (!uploading) {
            setUploadDialogOpen(false);
            // Form state'ini temizle
            setSelectedFile(null);
            setDocumentType('UPLOADED');
            setDescription('');
            setCustomFileName('');
          }
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Doküman Yükle</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              fullWidth
              type="file"
              inputProps={{ accept: 'application/pdf' }}
              onChange={handleFileSelect}
              label="PDF Dosyası Seç"
              InputLabelProps={{ shrink: true }}
              helperText="Sadece PDF dosyaları yüklenebilir"
            />
            {selectedFile && (
              <Alert severity="info">
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
            />
            <FormControl fullWidth>
              <InputLabel id="document-type-label">Doküman Tipi</InputLabel>
              <Select
                labelId="document-type-label"
                id="document-type-select"
                value={documentType}
                label="Doküman Tipi"
                onChange={(e) => setDocumentType(e.target.value)}
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setUploadDialogOpen(false);
              // Form state'ini temizle
              setSelectedFile(null);
              setDocumentType('UPLOADED');
              setDescription('');
            }} 
            disabled={uploading}
          >
            İptal
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploading || !selectedFile || !documentType}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberDocumentsPage;

