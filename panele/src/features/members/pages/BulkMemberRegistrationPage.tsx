// src/features/members/pages/BulkMemberRegistrationPage.tsx
import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PageHeader from '../../../shared/components/layout/PageHeader';
import PageLayout from '../../../shared/components/layout/PageLayout';
import {
  validateMemberImport,
  downloadMemberImportTemplate,
  type ValidateMemberImportResponse,
} from '../services/membersApi';
import { MAX_FILE_SIZE_MB, MAX_ROWS } from '../constants/memberImportTemplate';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';
import { useToast } from '../../../shared/hooks/useToast';

const STATUS_LABELS: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  valid: { label: 'Geçerli', Icon: CheckCircleIcon, color: 'success.main' },
  warning: { label: 'Uyarı', Icon: WarningIcon, color: 'warning.main' },
  error: { label: 'Hata', Icon: ErrorIcon, color: 'error.main' },
};

/** Üye detay sayfasındaki alan etiketleriyle uyumlu önizleme sütun adları */
const PREVIEW_COLUMN_LABELS: Record<string, string> = {
  firstName: 'Adı',
  lastName: 'Soyadı',
  nationalId: 'TC Kimlik Numarası',
  phone: 'Telefon',
  email: 'E-posta',
  motherName: 'Anne Adı',
  fatherName: 'Baba Adı',
  birthDate: 'Doğum Tarihi',
  birthplace: 'Doğum Yeri',
  gender: 'Cinsiyet',
  educationStatus: 'Öğrenim Durumu',
  provinceId: 'İl (Kayıtlı Olduğu Yer)',
  districtId: 'İlçe (Kayıtlı Olduğu Yer)',
  institutionId: 'Kurum Adı',
  branchId: 'Şube',
  tevkifatCenterId: 'Tevkifat Kurumu',
  tevkifatTitleId: 'Tevkifat Ünvanı',
  memberGroupId: 'Üye Grubu',
  dutyUnit: 'Görev Birimi',
  institutionAddress: 'Kurum Adresi',
  institutionProvinceId: 'Kurum İli',
  institutionDistrictId: 'Kurum İlçesi',
  professionId: 'Meslek/Unvan',
  institutionRegNo: 'Kurum Sicil No',
  staffTitleCode: 'Kadro Unvan Kodu',
};

const BulkMemberRegistrationPage: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidateMemberImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = useCallback(async () => {
    setTemplateLoading(true);
    try {
      await downloadMemberImportTemplate();
      toast.showSuccess('Şablon indirildi. Örnek satır sistemdeki il/ilçe/kurum ile dolduruludur; doğrulayıp kaydedebilirsiniz.');
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Şablon indirilirken bir hata oluştu.');
      toast.showError(msg);
    } finally {
      setTemplateLoading(false);
    }
  }, [toast]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f ?? null);
    setResult(null);
    setError(null);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!file) {
      toast.showWarning('Lütfen bir CSV dosyası seçin.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.showError(`Dosya boyutu ${MAX_FILE_SIZE_MB} MB sınırını aşamaz.`);
      return;
    }
    setValidating(true);
    setError(null);
    setResult(null);
    try {
      const data = await validateMemberImport(file);
      if (data && typeof data.totalRows === 'number' && Array.isArray(data.previewRows)) {
        setResult(data);
        setError(null);
        if (data.summary.error > 0) {
          toast.showInfo(`Doğrulama tamamlandı: ${data.summary.valid} geçerli, ${data.summary.error} hatalı.`);
        } else {
          toast.showSuccess(`Doğrulama tamamlandı: ${data.summary.valid} geçerli satır.`);
        }
      } else {
        const msg = 'Sunucu beklenmeyen yanıt döndürdü.';
        setError(msg);
        toast.showError(msg);
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Dosya doğrulanırken bir hata oluştu.');
      setError(msg);
      setResult(null);
      toast.showError(msg);
    } finally {
      setValidating(false);
    }
  }, [file, toast]);

  const previewColumns = result?.previewRows[0]
    ? Object.keys(result.previewRows[0].data).filter((k) => k && !k.startsWith('col_'))
    : [];

  return (
    <PageLayout>
      <PageHeader
        icon={<GroupAddIcon />}
        title="Toplu Üye Kayıt"
        description="Birden fazla üyeyi CSV dosyası ile toplu olarak sisteme kaydedin"
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Şablon ve yönergeler */}
        <Card
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              1. Şablon indir
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Şablon Türkçe Excel uyumludur (her sütun ayrı hücrede görünür). İçinde sistemdeki gerçek
              il/ilçe/kurum ile doldurulmuş <strong>bir örnek satır</strong> vardır; bu satırı doğrulayıp
              kaydedebilirsiniz. Doğum tarihi: <strong>YYYY-MM-DD</strong>. Cinsiyet: Erkek / Kadın / Diğer.
              Öğrenim: İlkokul / Lise / Üniversite.
            </Typography>
            <Button
              variant="outlined"
              startIcon={templateLoading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              onClick={handleDownloadTemplate}
              disabled={templateLoading}
              size="medium"
            >
              {templateLoading ? 'İndiriliyor…' : 'CSV şablonunu indir'}
            </Button>
          </CardContent>
        </Card>

        {/* Dosya yükle */}
        <Card
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          }}
        >
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              2. Dosya yükle ve doğrula
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              En fazla <strong>{MAX_FILE_SIZE_MB} MB</strong>, <strong>{MAX_ROWS} satır</strong>.
              Sadece .csv dosyası yükleyebilirsiniz.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={validating}
              >
                Dosya seç
                <input
                  type="file"
                  accept=".csv,text/csv,application/csv"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {file && (
                <Typography variant="body2" color="text.secondary">
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </Typography>
              )}
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={!file || validating}
                startIcon={validating ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {validating ? 'Doğrulanıyor…' : 'Doğrula'}
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Önizleme ve doğrulama raporu – sadece kontrol; onaylamadan kayıt yapılmaz */}
        {result && (
          <Card
            sx={{
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                3. Önizleme ve doğrulama raporu
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Toplam <strong>{result.totalRows}</strong> satır: {result.summary.valid} geçerli,{' '}
                {result.summary.warning} uyarı, {result.summary.error} hatalı.
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }} variant="outlined">
                Bu önizleme sadece kontrol içindir. Üyeler &quot;İçe aktar&quot; ile onaylamadıkça sisteme kaydedilmez.
              </Alert>
              {result.errors.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Hatalı satırları düzeltip dosyayı tekrar yükleyebilir veya bir sonraki adımda
                  &quot;Hatalıları atla, geçerlileri kaydet&quot; seçeneği ile devam edebilirsiniz.
                </Alert>
              )}
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 480, overflowX: 'auto', overflowY: 'auto' }}
              >
                <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', minWidth: 56 }}>
                        Satır
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: 'background.default', minWidth: 100 }}>
                        Durum
                      </TableCell>
                      {previewColumns.map((col) => (
                        <TableCell
                          key={col}
                          sx={{
                            fontWeight: 600,
                            bgcolor: 'background.default',
                            minWidth: 100,
                            maxWidth: 180,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Tooltip title={PREVIEW_COLUMN_LABELS[col] ?? col}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {PREVIEW_COLUMN_LABELS[col] ?? col}
                            </span>
                          </Tooltip>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.previewRows.map((row) => {
                      const conf = STATUS_LABELS[row.status] ?? STATUS_LABELS.error;
                      const Icon = conf.Icon;
                      return (
                        <TableRow key={row.rowIndex}>
                          <TableCell sx={{ minWidth: 56 }}>{row.rowIndex}</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <Tooltip title={row.errors?.map((e) => e.message).join(' • ') || conf.label}>
                              <IconButton size="small" sx={{ color: conf.color }}>
                                <Icon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Typography component="span" variant="caption" sx={{ color: conf.color, ml: 0.5 }}>
                              {conf.label}
                            </Typography>
                          </TableCell>
                          {previewColumns.map((col) => (
                            <TableCell
                              key={col}
                              sx={{ minWidth: 100, maxWidth: 180 }}
                              title={String(row.data[col] ?? '')}
                            >
                              <Box
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: 180,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.data[col] || '—'}
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {result.totalRows > result.previewRows.length && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  İlk {result.previewRows.length} satır gösteriliyor. Toplam {result.totalRows} satır. Tüm sütunları görmek için sağa kaydırın.
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {!result && !validating && (
          <Card
            sx={{
              p: 4,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Toplu üye kayıt sayfasına hoş geldiniz. CSV şablonunu indirip doldurduktan sonra
              dosyayı yükleyin ve &quot;Doğrula&quot; ile önizleme ve hata raporunu görün.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bir sonraki adımda &quot;İçe aktar&quot; ile geçerli satırları sisteme kaydedebilirsiniz.
            </Typography>
          </Card>
        )}
      </Box>
    </PageLayout>
  );
};

export default BulkMemberRegistrationPage;
