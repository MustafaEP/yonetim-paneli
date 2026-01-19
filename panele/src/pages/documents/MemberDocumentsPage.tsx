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
  Chip,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';

import type { MemberDocument, DocumentTemplate, GenerateDocumentDto } from '../../api/documentsApi';
import { getMemberDocuments, uploadMemberDocument, generateDocument, getDocumentTemplates } from '../../api/documentsApi';
import { getMembers } from '../../api/membersApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import type { MemberListItem } from '../../types/member';
import { DOCUMENT_TYPES, getDocumentTypeLabel } from '../../utils/documentTypes';
import httpClient from '../../api/httpClient';
import PageHeader from '../../components/layout/PageHeader';

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
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('UPLOADED');
  const [description, setDescription] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [extraVariables, setExtraVariables] = useState<Record<string, string>>({});
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);

  const canView = hasPermission('DOCUMENT_MEMBER_HISTORY_VIEW');
  const canUpload = hasPermission('DOCUMENT_GENERATE_PDF');
  const canGenerate = hasPermission('DOCUMENT_GENERATE_PDF');

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

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getDocumentTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (e: any) {
      console.error('Şablonlar yüklenirken hata:', e);
      toast.showError('Şablonlar yüklenirken bir hata oluştu');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenGenerateDialog = () => {
    setGenerateDialogOpen(true);
    setSelectedTemplate(null);
    setExtraVariables({});
    setPdfFileName('');
    setPhotoPreview('');
    loadTemplates();
  };

  const toDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  // Template'den ekstra değişkenleri çıkar (şablonda var ama backend'in otomatik doldurmadıkları)
  const getExtraVariablesFromTemplate = (template: DocumentTemplate): string[] => {
    const standardVars = new Set([
      'firstName',
      'lastName',
      'fullName',
      'memberNumber',
      'nationalId',
      'phone',
      'email',
      'province',
      'district',
      'institution',
      'branch',
      'date',
      'joinDate',
      'applicationDate',
      'validUntil',
      'birthPlace',
      'gender',
      'educationStatus',
      'position',
      'workUnitAddress',
      'birthDate',
      'motherName',
      'fatherName',
      'dutyUnit',
      'institutionAddress',
      'boardDecisionDate',
      'boardDecisionBookNo',
      'membershipInfoOption',
      'memberGroup',
    ]);

    const varRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const foundVars = new Set<string>();
    let match;

    while ((match = varRegex.exec(template.template)) !== null) {
      const varName = match[1];
      if (!standardVars.has(varName)) {
        foundVars.add(varName);
      }
    }

    // Üye kartı fotoğraf alanı: DB'de eski template olsa bile kullanıcıdan fotoğraf al
    if (template.type === 'MEMBER_CARD') {
      foundVars.add('photoDataUrl');
    }

    return Array.from(foundVars);
  };

  const getVariableLabel = (varName: string): string => {
    const labels: Record<string, string> = {
      oldProvince: 'Eski İl',
      oldDistrict: 'Eski İlçe',
      oldInstitution: 'Eski Kurum',
      oldBranch: 'Eski Şube',
      transferReason: 'Nakil Nedeni',
      photoDataUrl: 'Fotoğraf',

      eventName: 'Etkinlik Adı',
      eventDate: 'Etkinlik Tarihi',
      eventPlace: 'Etkinlik Yeri',
      eventDescription: 'Etkinlik Açıklaması',

      invitationDate: 'Davet Tarihi',
      meetingDate: 'Toplantı Tarihi',
      meetingPlace: 'Toplantı Yeri',

      subject: 'Konu',
      reason: 'Sebep',
      description: 'Açıklama',
    };

    return labels[varName] || varName.replace(/([A-Z])/g, ' $1').trim();
  };

  const handleGenerate = async () => {
    if (!selectedMember || !selectedTemplate) return;

    // Boş değişkenleri kontrol et (şablondan gelen ekstra alanlar)
    const emptyVars = Object.entries(extraVariables).filter(([key, value]) => {
      if (key === 'photoDataUrl') return !value; // foto base64 (trim anlamlı değil)
      return !value || value.trim() === '';
    });
    if (emptyVars.length > 0) {
      toast.showError(`Lütfen tüm alanları doldurun: ${emptyVars.map(([k]) => getVariableLabel(k)).join(', ')}`);
      return;
    }

    setGenerating(true);
    try {
      const payload: GenerateDocumentDto = {
        memberId: selectedMember.id,
        templateId: selectedTemplate.id,
        variables: Object.keys(extraVariables).length > 0 ? extraVariables : undefined,
        fileName: pdfFileName || undefined,
      };
      await generateDocument(payload);
      toast.showSuccess('PDF doküman başarıyla oluşturuldu');
      setGenerateDialogOpen(false);
      setSelectedTemplate(null);
      setExtraVariables({});
      setPdfFileName('');
      setPhotoPreview('');
      loadDocuments();
    } catch (e: any) {
      console.error('PDF oluşturulurken hata:', e);
      toast.showError(e.response?.data?.message || 'PDF oluşturulurken bir hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'documentType',
      headerName: 'Doküman Türü',
      flex: 1,
      minWidth: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const label = getDocumentTypeLabel(params.value || 'UPLOADED');
        const colors: Record<string, string> = {
          'MEMBER_REGISTRATION': theme.palette.primary.main,
          'PAYMENT_RECEIPT': theme.palette.success.main,
          'DOCUMENT': theme.palette.info.main,
          'UPLOADED': theme.palette.secondary.main,
        };
        const color = colors[params.value] || theme.palette.grey[500];
        
        return (
          <Chip
            label={label}
            size="small"
            sx={{
              bgcolor: alpha(color, 0.1),
              color: color,
              fontWeight: 600,
              fontSize: '0.75rem',
              height: 24,
              borderRadius: 1.5,
              border: `1px solid ${alpha(color, 0.2)}`,
            }}
          />
        );
      },
    },
    {
      field: 'fileName',
      headerName: 'Dosya Adı',
      flex: 2,
      minWidth: 250,
      align: 'left',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
          <PictureAsPdfIcon sx={{ color: theme.palette.error.main, fontSize: '1.2rem', flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {params.value || 'Belge'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'generatedAt',
      headerName: 'Oluşturulma Tarihi',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.4 }}>
              {date.toLocaleDateString('tr-TR')}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              {date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'generatedByUser',
      headerName: 'Oluşturan',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const user = params.row.generatedByUser;
        if (!user) return <Typography variant="body2" color="text.secondary">-</Typography>;
        return (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {user.firstName} {user.lastName}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const doc = params.row as MemberDocument;
        return (
          <Tooltip title="PDF Görüntüle">
            <IconButton
              size="small"
              onClick={async () => {
                try {
                  setLoadingPdf(true);
                  const token = localStorage.getItem('accessToken');
                  const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
                  const url = `${API_BASE_URL}/documents/view/${doc.id}`;
                  
                  const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  });

                  if (!response.ok) {
                    throw new Error('Dosya görüntülenemedi');
                  }

                  const blob = await response.blob();
                  const blobUrl = window.URL.createObjectURL(blob);
                  setPdfUrl(blobUrl);
                  setPdfTitle(doc.fileName || 'Belge');
                  setPdfViewerOpen(true);
                  setLoadingPdf(false);
                } catch (error) {
                  console.error('Dosya görüntülenirken hata:', error);
                  toast.showError('Dosya görüntülenemedi');
                  setLoadingPdf(false);
                }
              }}
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.info.main, 0.2),
                },
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        icon={<DescriptionIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title={selectedMember 
          ? `${selectedMember.firstName} ${selectedMember.lastName} - Dokümanlar`
          : 'Üye Doküman Geçmişi'}
        description={selectedMember 
          ? `${selectedMember.firstName} ${selectedMember.lastName} adlı üyenin doküman geçmişi`
          : 'Üyelerin doküman geçmişini görüntüleyin - Üye seçin'}
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />
      <Box sx={{ mb: 3 }}>

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
            <>
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleOpenGenerateDialog}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
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
            </>
          )}
        </Box>
      </Box>

      {selectedMember ? (
        <>
          {/* İstatistik Kartları */}
          {rows.length > 0 && (
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Toplam Doküman
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  {rows.length}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.main, 0.02)} 100%)`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Oluşturulan PDF
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                  {rows.filter(r => r.documentType !== 'UPLOADED').length}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  p: 2.5,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.main, 0.02)} 100%)`,
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
                  Yüklenen Doküman
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
                  {rows.filter(r => r.documentType === 'UPLOADED').length}
                </Typography>
              </Paper>
            </Box>
          )}

          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
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
              localeText={{
                noRowsLabel: 'Doküman bulunamadı',
                noResultsOverlayLabel: 'Sonuç bulunamadı',
                errorOverlayDefaultLabel: 'Bir hata oluştu',
                toolbarExportLabel: 'Dışa Aktar',
                toolbarExportCSV: 'CSV olarak indir',
                toolbarExportPrint: 'Yazdır',
                toolbarColumnsLabel: 'Sütunlar',
                toolbarFiltersLabel: 'Filtreler',
                toolbarDensityLabel: 'Yoğunluk',
                toolbarDensityCompact: 'Kompakt',
                toolbarDensityStandard: 'Standart',
                toolbarDensityComfortable: 'Rahat',
                filterPanelOperators: 'Operatörler',
                filterPanelColumns: 'Sütunlar',
                filterPanelInputLabel: 'Değer',
                filterPanelInputPlaceholder: 'Filtre değeri',
                columnMenuLabel: 'Menü',
                columnMenuShowColumns: 'Sütunları göster',
                columnMenuFilter: 'Filtrele',
                columnMenuHideColumn: 'Gizle',
                columnMenuUnsort: 'Sıralamayı kaldır',
                columnMenuSortAsc: 'Artan sırala',
                columnMenuSortDesc: 'Azalan sırala',
                columnsPanelTextFieldLabel: 'Sütun bul',
                columnsPanelTextFieldPlaceholder: 'Sütun başlığı',
                columnsPanelDeleteIconLabel: 'Sil',
                columnsPanelShowAllButton: 'Tümünü göster',
                columnsPanelHideAllButton: 'Tümünü gizle',
                filterPanelDeleteIconLabel: 'Sil',
                filterPanelLogicOperator: 'Mantık operatörü',
                filterPanelOperator: 'Operatör',
                filterOperatorContains: 'İçerir',
                filterOperatorEquals: 'Eşittir',
                filterOperatorStartsWith: 'İle başlar',
                filterOperatorEndsWith: 'İle biter',
                filterOperatorIs: 'Eşittir',
                filterOperatorNot: 'Eşit değildir',
                filterOperatorAfter: 'Sonrası',
                filterOperatorOnOrAfter: 'Sonrası veya eşit',
                filterOperatorBefore: 'Öncesi',
                filterOperatorOnOrBefore: 'Öncesi veya eşit',
                filterOperatorIsEmpty: 'Boş',
                filterOperatorIsNotEmpty: 'Boş değil',
                filterOperatorIsAnyOf: 'Herhangi biri',
                filterValueInputLabel: 'Değer',
                filterValueInputPlaceholder: 'Filtre değeri',
                MuiTablePagination: {
                  labelRowsPerPage: 'Sayfa başına satır:',
                  labelDisplayedRows: ({ from, to, count }) =>
                    `${from}–${to} / ${count !== -1 ? count : `${to}'den fazla`}`,
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-row': {
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 700,
                    fontSize: '0.875rem',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                  backgroundColor: alpha(theme.palette.background.default, 0.4),
                },
              }}
            />
          </Card>

          {rows.length === 0 && !loading && (
            <Box
              sx={{
                textAlign: 'center',
                py: 8,
                px: 2,
              }}
            >
              <DescriptionIcon
                sx={{
                  fontSize: 80,
                  color: alpha(theme.palette.text.secondary, 0.3),
                  mb: 2,
                }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Henüz doküman bulunmuyor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Bu üye için henüz doküman oluşturulmamış veya yüklenmemiş.
              </Typography>
              {canUpload && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={handleOpenGenerateDialog}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
                      bgcolor: theme.palette.error.main,
                      '&:hover': {
                        bgcolor: theme.palette.error.dark,
                      },
                    }}
                  >
                    PDF Oluştur
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadFileIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    Doküman Yükle
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </>
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            p: 6,
            textAlign: 'center',
          }}
        >
          <PersonIcon
            sx={{
              fontSize: 80,
              color: alpha(theme.palette.primary.main, 0.3),
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
            Üye Seçiniz
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Doküman geçmişini görüntülemek için yukarıdan bir üye seçin
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
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadFileIcon sx={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Doküman Yükle
            </Typography>
            <Typography variant="caption" color="text.secondary">
              PDF formatında doküman yükleyin
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
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
              <Alert 
                severity="success"
                icon={<PictureAsPdfIcon />}
                sx={{ 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Seçilen dosya:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </Typography>
                </Box>
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
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            gap: 1.5,
          }}
        >
          <Button 
            onClick={() => {
              setUploadDialogOpen(false);
              // Form state'ini temizle
              setSelectedFile(null);
              setDocumentType('UPLOADED');
              setDescription('');
            }} 
            disabled={uploading}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
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
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate PDF Dialog */}
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
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pb: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              PDF Doküman Oluştur
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Şablon seçerek PDF oluşturun
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 3 }}>
            {selectedMember && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.04),
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Üye Bilgileri
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedMember.firstName} {selectedMember.lastName}
                  {selectedMember.registrationNumber ? ` • Üye No: ${selectedMember.registrationNumber}` : ''}
                </Typography>
              </Paper>
            )}
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

                    if (template) {
                      const extraVars = getExtraVariablesFromTemplate(template);
                      const newExtraVariables: Record<string, string> = {};
                      extraVars.forEach((varName) => {
                        newExtraVariables[varName] = '';
                      });
                      setExtraVariables(newExtraVariables);
                      setPhotoPreview('');
                      // varsayılan dosya adı önerisi
                      setPdfFileName(`${template.name}_${selectedMember?.firstName || ''}_${selectedMember?.lastName || ''}`.trim());
                    } else {
                      setExtraVariables({});
                      setPhotoPreview('');
                      setPdfFileName('');
                    }
                  }}
                  label="Şablon Seç"
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
              <>
                <Alert 
                  severity="success"
                  icon={<PictureAsPdfIcon />}
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiAlert-message': {
                      width: '100%',
                    },
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Seçilen Şablon: {selectedTemplate.name}
                    </Typography>
                    {selectedTemplate.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedTemplate.description}
                      </Typography>
                    )}
                  </Box>
                </Alert>

                {/* Şablonda olup otomatik dolmayan alanlar */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="PDF Dosya Adı"
                    value={pdfFileName}
                    onChange={(e) => setPdfFileName(e.target.value)}
                    fullWidth
                    size="small"
                    disabled={generating}
                    placeholder="Örn: DavetMektubu_ZeynepUnal"
                    helperText="Uzantı (.pdf) otomatik eklenir"
                    sx={{ borderRadius: 2 }}
                  />

                  {Object.keys(extraVariables).length > 0 && (
                    <>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Lütfen aşağıdaki bilgileri doldurun:
                      </Typography>
                    {Object.keys(extraVariables).map((varName) => {
                      const isMulti =
                        varName.toLowerCase().includes('reason') ||
                        varName.toLowerCase().includes('description');

                      const value = extraVariables[varName] || '';
                      const isEmpty = value.trim() === '';

                      // Fotoğraf alanı
                      if (varName === 'photoDataUrl') {
                        return (
                          <Box key={varName} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                              {getVariableLabel(varName)}
                            </Typography>
                            <Button
                              component="label"
                              variant="outlined"
                              disabled={generating}
                              sx={{ borderRadius: 2, alignSelf: 'flex-start' }}
                            >
                              Fotoğraf Seç
                              <input
                                hidden
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const dataUrl = await toDataUrl(file);
                                  setExtraVariables((prev) => ({ ...prev, photoDataUrl: dataUrl }));
                                  setPhotoPreview(dataUrl);
                                }}
                              />
                            </Button>
                            {photoPreview && (
                              <Box
                                sx={{
                                  width: 96,
                                  height: 128,
                                  borderRadius: 2,
                                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                  overflow: 'hidden',
                                }}
                              >
                                <img
                                  src={photoPreview}
                                  alt="Fotoğraf Önizleme"
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                              </Box>
                            )}
                            {!photoPreview && (
                              <Typography variant="caption" color="text.secondary">
                                Bu alan zorunludur
                              </Typography>
                            )}
                          </Box>
                        );
                      }

                      return (
                        <TextField
                          key={varName}
                          label={getVariableLabel(varName)}
                          value={value}
                          onChange={(e) =>
                            setExtraVariables((prev) => ({
                              ...prev,
                              [varName]: e.target.value,
                            }))
                          }
                          fullWidth
                          size="small"
                          required
                          disabled={generating}
                          placeholder={`${getVariableLabel(varName)} girin`}
                          error={isEmpty}
                          helperText={isEmpty ? 'Bu alan zorunludur' : ''}
                          multiline={isMulti}
                          rows={isMulti ? 3 : 1}
                          sx={{ borderRadius: 2 }}
                        />
                      );
                    })}
                    </>
                  )}
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            gap: 1.5,
          }}
        >
          <Button
            onClick={() => {
              setGenerateDialogOpen(false);
              setSelectedTemplate(null);
            }}
            disabled={generating}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
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
              textTransform: 'none',
              px: 3,
              fontWeight: 600,
              bgcolor: theme.palette.error.main,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.error.main, 0.3)}`,
              '&:hover': {
                bgcolor: theme.palette.error.dark,
              },
            }}
          >
            {generating ? 'Oluşturuluyor...' : 'PDF Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Görüntüleme Dialog */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {pdfTitle}
          </Typography>
          <IconButton
            onClick={() => {
              setPdfViewerOpen(false);
              if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
              }
            }}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            height: 'calc(90vh - 80px)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadingPdf ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary">
                PDF yükleniyor...
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '& iframe': {
                  width: '100%',
                  height: '100%',
                  border: 'none',
                },
                // PDF viewer sidebar'ını gizle
                '& embed': {
                  width: '100%',
                  height: '100%',
                },
              }}
            >
              <embed
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MemberDocumentsPage;

