// src/pages/accounting/MemberPaymentsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getPaymentsForAccounting } from '../../api/paymentsApi';
import type { MemberPayment } from '../../api/paymentsApi';
import { getBranches } from '../../api/branchesApi';

const MemberPaymentsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canExport = hasPermission('ACCOUNTING_EXPORT');

  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadBranches();
    loadPayments();
  }, [branchFilter, yearFilter, monthFilter]);

  const loadBranches = async () => {
    try {
      const data = await getBranches({ isActive: true });
      setBranches(data.map(b => ({ id: b.id, name: b.name })));
    } catch (e) {
      console.error('Şubeler yüklenirken hata:', e);
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const filters: any = {
        year: yearFilter,
        month: monthFilter,
        isApproved: true, // Sadece onaylı ödemeleri göster
      };
      if (branchFilter !== 'ALL') {
        filters.branchId = branchFilter;
      }
      const data = await getPaymentsForAccounting(filters);
      setPayments(data);
    } catch (e: any) {
      console.error('Ödemeler yüklenirken hata:', e);
      toast.showError('Ödemeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    // TODO: Excel export implementasyonu
    toast.showInfo('Excel export özelliği yakında eklenecek');
  };

  const handleExportPDF = () => {
    // TODO: PDF export implementasyonu
    toast.showInfo('PDF export özelliği yakında eklenecek');
  };

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const paymentTypeLabels = {
    TEVKIFAT: 'Tevkifat',
    ELDEN: 'Elden',
    HAVALE: 'Havale',
  };

  const columns: GridColDef<MemberPayment>[] = [
    {
      field: 'registrationNumber',
      headerName: 'Üye Kayıt No',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row) => row.registrationNumber ?? row.member?.registrationNumber ?? '-',
    },
    {
      field: 'firstName',
      headerName: 'Ad',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => row.member?.firstName ?? '-',
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
      minWidth: 120,
      valueGetter: (_value, row) => row.member?.lastName ?? '-',
    },
    {
      field: 'institution',
      headerName: 'Kurum',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row) => row.member?.institution?.name ?? '-',
    },
    {
      field: 'tevkifatCenter',
      headerName: 'Tevkifat Kurumu',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row) => 
        row.tevkifatCenter?.name ?? row.member?.tevkifatCenter?.name ?? '-',
    },
    {
      field: 'month',
      headerName: 'Ay',
      flex: 0.8,
      minWidth: 100,
      valueGetter: (_value, row) => monthNames[row.paymentPeriodMonth - 1] ?? row.paymentPeriodMonth,
    },
    {
      field: 'year',
      headerName: 'Yıl',
      flex: 0.8,
      minWidth: 100,
      valueGetter: (_value, row) => row.paymentPeriodYear,
    },
    {
      field: 'amount',
      headerName: 'Ödenen Tutar',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row) => 
        parseFloat(row.amount).toLocaleString('tr-TR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + ' TL',
      align: 'right',
      headerAlign: 'right',
    },
    {
      field: 'paymentType',
      headerName: 'Ödeme Türü',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={paymentTypeLabels[params.row.paymentType]}
          size="small"
          color={
            params.row.paymentType === 'TEVKIFAT' ? 'primary' :
            params.row.paymentType === 'ELDEN' ? 'secondary' : 'default'
          }
        />
      ),
    },
    {
      field: 'isApproved',
      headerName: 'Onay Durumu',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        params.row.isApproved ? (
          <Chip
            icon={<CheckCircleIcon />}
            label="Onaylı"
            color="success"
            size="small"
          />
        ) : (
          <Chip
            icon={<WarningIcon />}
            label="Beklemede"
            color="warning"
            size="small"
          />
        )
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Üye Ödemeleri
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Muhasebe için ödeme listesi - Excel ve PDF export mevcut
        </Typography>
      </Box>

      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Şube</InputLabel>
            <Select
              value={branchFilter}
              label="Şube"
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <MenuItem value="ALL">Tümü</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

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

          {canExport && (
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportExcel}
              >
                Excel İndir
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleExportPDF}
              >
                PDF İndir
              </Button>
            </Box>
          )}
        </Stack>
      </Card>

      <Card>
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={payments}
                columns={columns}
                getRowId={(row) => row.id}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                pageSizeOptions={[10, 25, 50, 100]}
              />
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default MemberPaymentsPage;
