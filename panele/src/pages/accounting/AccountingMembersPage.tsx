// src/pages/accounting/AccountingMembersPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getAccountingMembers } from '../../api/accountingApi';
import type { AccountingMember } from '../../api/accountingApi';
import { getBranches } from '../../api/branchesApi';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../utils/exportUtils';

const AccountingMembersPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canExport = hasPermission('ACCOUNTING_EXPORT');

  const [members, setMembers] = useState<AccountingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [monthFilter, setMonthFilter] = useState<number>(new Date().getMonth() + 1);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    loadBranches();
    loadMembers();
  }, [branchFilter, yearFilter, monthFilter]);

  const loadBranches = async () => {
    try {
      const data = await getBranches({ isActive: true });
      setBranches(data.map(b => ({ id: b.id, name: b.name })));
    } catch (e) {
      console.error('Şubeler yüklenirken hata:', e);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    try {
      const filters: any = {
        year: yearFilter,
        month: monthFilter,
      };
      if (branchFilter !== 'ALL') {
        filters.branchId = branchFilter;
      }
      const data = await getAccountingMembers(filters);
      setMembers(data);
    } catch (e: any) {
      console.error('Muhasebe üyeleri yüklenirken hata:', e);
      toast.showError('Muhasebe üyeleri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const exportColumns: ExportColumn[] = columns.map((col) => ({
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width || col.flex ? (col.flex as number) * 10 : 15,
        valueGetter: col.valueGetter,
      }));
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const filename = `muhasebe-uyeleri-${yearFilter}-${monthNames[monthFilter - 1]}-${new Date().getTime()}`;
      exportToExcel(members, exportColumns, filename);
      toast.showSuccess('Excel dosyası indirildi');
    } catch (error: any) {
      console.error('Excel export hatası:', error);
      toast.showError('Excel export sırasında bir hata oluştu');
    }
  };

  const handleExportPDF = () => {
    try {
      const exportColumns: ExportColumn[] = columns.map((col) => ({
        field: col.field,
        headerName: col.headerName || col.field,
        width: col.width || col.flex ? (col.flex as number) * 10 : 15,
        valueGetter: col.valueGetter,
      }));
      const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      const filename = `muhasebe-uyeleri-${yearFilter}-${monthNames[monthFilter - 1]}-${new Date().getTime()}`;
      const title = `Muhasebe Üyeleri - ${monthNames[monthFilter - 1]} ${yearFilter}`;
      exportToPDF(members, exportColumns, filename, title);
      toast.showSuccess('PDF dosyası indirildi');
    } catch (error: any) {
      console.error('PDF export hatası:', error);
      toast.showError('PDF export sırasında bir hata oluştu');
    }
  };

  const columns: GridColDef<AccountingMember>[] = [
    {
      field: 'registrationNumber',
      headerName: 'Üye Kayıt No',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row) => row.registrationNumber ?? '-',
    },
    {
      field: 'firstName',
      headerName: 'Ad',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'lastName',
      headerName: 'Soyad',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'institution',
      headerName: 'Kurum',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row) => row.institution?.name ?? '-',
    },
    {
      field: 'tevkifatCenter',
      headerName: 'Tevkifat Kurumu',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row) => row.tevkifatCenter?.name ?? '-',
    },
    {
      field: 'monthlyInfo',
      headerName: 'Aylık Bilgi',
      flex: 1.5,
      minWidth: 200,
      valueGetter: (_value, row) => {
        const payments = row.duesPayments || [];
        if (payments.length === 0) return 'Ödeme yok';
        const total = payments.reduce((sum, p) => sum + (typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount), 0);
        return `${payments.length} ödeme, Toplam: ${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`;
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Muhasebe Üyeler
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Muhasebe için üye listesi - Excel ve PDF export mevcut
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
                rows={members}
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

export default AccountingMembersPage;
