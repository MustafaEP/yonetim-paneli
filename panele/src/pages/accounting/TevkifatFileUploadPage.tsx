// src/pages/accounting/TevkifatFileUploadPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
  Stack,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { uploadTevkifatFile, getTevkifatFiles, approveTevkifatFile, rejectTevkifatFile } from '../../api/accountingApi';
import type { TevkifatFile } from '../../api/accountingApi';

const TevkifatFileUploadPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canUpload = hasPermission('TEVKIFAT_FILE_UPLOAD');
  const canApprove = hasPermission('TEVKIFAT_FILE_APPROVE');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<TevkifatFile[]>([]);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);

  const [formData, setFormData] = useState({
    tevkifatCenterId: '',
    totalAmount: '',
    memberCount: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    positionTitle: '' as '' | 'KADRO_657' | 'SOZLESMELI_4B' | 'KADRO_663' | 'AILE_HEKIMLIGI' | 'UNVAN_4924' | 'DIGER_SAGLIK_PERSONELI',
    file: null as File | null,
  });

  useEffect(() => {
    loadFiles();
  }, [yearFilter, monthFilter]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await getTevkifatFiles({
        year: yearFilter,
        month: monthFilter,
      });
      setFiles(data);
    } catch (e: any) {
      console.error('Tevkifat dosyaları yüklenirken hata:', e);
      toast.showError('Dosyalar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.showError('Sadece PDF dosyaları yüklenebilir');
        return;
      }
      setFormData({ ...formData, file });
    }
  };

  const handleSubmit = async () => {
    if (!formData.file) {
      toast.showError('Lütfen bir dosya seçin');
      return;
    }
    if (!formData.tevkifatCenterId) {
      toast.showError('Tevkifat kurumu seçilmelidir');
      return;
    }
    if (!formData.totalAmount || !formData.memberCount) {
      toast.showError('Tutar ve üye sayısı girilmelidir');
      return;
    }

    setUploading(true);
    try {
      // TODO: File upload işlemi burada yapılacak
      // Şimdilik fileUrl'i placeholder olarak gönderiyoruz
      await uploadTevkifatFile({
        tevkifatCenterId: formData.tevkifatCenterId,
        totalAmount: parseFloat(formData.totalAmount),
        memberCount: parseInt(formData.memberCount),
        month: formData.month,
        year: formData.year,
        positionTitle: formData.positionTitle || undefined,
        fileName: formData.file.name,
        fileUrl: `uploads/tevkifat/${formData.file.name}`, // TODO: Gerçek upload
        fileSize: formData.file.size,
      });
      toast.showSuccess('Dosya yüklendi (Admin onayı bekliyor)');
      setFormData({
        tevkifatCenterId: '',
        totalAmount: '',
        memberCount: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        positionTitle: '',
        file: null,
      });
      loadFiles();
    } catch (e: any) {
      console.error('Dosya yüklenirken hata:', e);
      toast.showError(e?.response?.data?.message || 'Dosya yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveTevkifatFile(id);
      toast.showSuccess('Dosya onaylandı');
      loadFiles();
    } catch (e: any) {
      toast.showError('Onaylama işlemi başarısız');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectTevkifatFile(id);
      toast.showSuccess('Dosya reddedildi');
      loadFiles();
    } catch (e: any) {
      toast.showError('Reddetme işlemi başarısız');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Onaylandı';
      case 'REJECTED':
        return 'Reddedildi';
      case 'PENDING':
        return 'Onay Bekliyor';
      default:
        return status;
    }
  };

  // TODO: TevkifatCenter listesi API'den gelecek
  const tevkifatCenters = [
    { id: '1', name: 'Tevkifat Merkezi 1' },
    { id: '2', name: 'Tevkifat Merkezi 2' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Tevkifat Dosya Yükleme
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Tevkifat dosyalarını yükleyin, admin onayı bekler
        </Typography>
      </Box>

      {canUpload && (
        <Card sx={{ mb: 3, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Yeni Dosya Yükle
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth required>
              <InputLabel>Tevkifat Kurumu</InputLabel>
              <Select
                value={formData.tevkifatCenterId}
                label="Tevkifat Kurumu"
                onChange={(e) => setFormData({ ...formData, tevkifatCenterId: e.target.value })}
              >
                {tevkifatCenters.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Gelen Tutar Toplamı"
              type="number"
              required
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <TextField
              label="Üye Sayısı"
              type="number"
              required
              value={formData.memberCount}
              onChange={(e) => setFormData({ ...formData, memberCount: e.target.value })}
              inputProps={{ min: 1 }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <InputLabel>Ay</InputLabel>
                <Select
                  value={formData.month}
                  label="Ay"
                  onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
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

              <TextField
                label="Yıl"
                type="number"
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                inputProps={{ min: 2020, max: 2100 }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Kadro (Seçmeli)</InputLabel>
              <Select
                value={formData.positionTitle}
                label="Kadro (Seçmeli)"
                onChange={(e) => setFormData({ ...formData, positionTitle: e.target.value as any })}
              >
                <MenuItem value="">Seçilmemiş</MenuItem>
                <MenuItem value="KADRO_657">657 Kadrolu</MenuItem>
                <MenuItem value="SOZLESMELI_4B">4B Sözleşmeli</MenuItem>
                <MenuItem value="KADRO_663">663 Kadro Karşılığı</MenuItem>
                <MenuItem value="AILE_HEKIMLIGI">Aile Hekimliği</MenuItem>
                <MenuItem value="UNVAN_4924">4924 Unvanlı</MenuItem>
                <MenuItem value="DIGER_SAGLIK_PERSONELI">Diğer Sağlık Personeli</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <input
                accept="application/pdf"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                >
                  {formData.file ? formData.file.name : 'PDF Dosyası Seç'}
                </Button>
              </label>
            </Box>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
            >
              {uploading ? 'Yükleniyor...' : 'Yükle (Admin Onayı Bekler)'}
            </Button>
          </Stack>
        </Card>
      )}

      <Card>
        <Box sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Yıl</InputLabel>
              <Select
                value={yearFilter}
                label="Yıl"
                onChange={(e) => setYearFilter(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ay</InputLabel>
              <Select
                value={monthFilter}
                label="Ay"
                onChange={(e) => setMonthFilter(Number(e.target.value))}
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
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : files.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Bu ay/yıl için dosya bulunmuyor.
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tevkifat Kurumu</TableCell>
                  <TableCell>Toplam Tutar</TableCell>
                  <TableCell>Üye Sayısı</TableCell>
                  <TableCell>Ay/Yıl</TableCell>
                  <TableCell>Kadro</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Yükleyen</TableCell>
                  <TableCell>İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>{file.tevkifatCenter?.name || '-'}</TableCell>
                    <TableCell>
                      {typeof file.totalAmount === 'string'
                        ? parseFloat(file.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                        : file.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                      TL
                    </TableCell>
                    <TableCell>{file.memberCount}</TableCell>
                    <TableCell>
                      {file.month}/{file.year}
                    </TableCell>
                    <TableCell>{file.positionTitle || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(file.status)}
                        size="small"
                        color={getStatusColor(file.status) as any}
                      />
                    </TableCell>
                    <TableCell>
                      {file.uploadedByUser
                        ? `${file.uploadedByUser.firstName} ${file.uploadedByUser.lastName}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {canApprove && file.status === 'PENDING' && (
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(file.id)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(file.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default TevkifatFileUploadPage;
