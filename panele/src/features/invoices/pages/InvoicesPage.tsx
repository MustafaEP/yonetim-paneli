// src/features/invoices/pages/InvoicesPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Stack,
  Divider,
  Paper,
  Alert,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import FilterListIcon from '@mui/icons-material/FilterList';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

interface Invoice {
  id: number;
  invoiceNo: string;
  recipient: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  description: string;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  paid: 'Ödendi',
  cancelled: 'İptal',
};

const STATUS_COLORS: Record<InvoiceStatus, 'default' | 'info' | 'success' | 'error'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  cancelled: 'error',
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 1,
    invoiceNo: 'FTR-2026-001',
    recipient: 'Örnek Kurum A.Ş.',
    issueDate: '2026-01-15',
    dueDate: '2026-02-15',
    amount: 12500.0,
    status: 'paid',
    description: 'Ocak 2026 hizmet bedeli',
  },
  {
    id: 2,
    invoiceNo: 'FTR-2026-002',
    recipient: 'Test Şirketi Ltd.',
    issueDate: '2026-02-01',
    dueDate: '2026-03-01',
    amount: 8750.5,
    status: 'sent',
    description: 'Şubat 2026 danışmanlık ücreti',
  },
  {
    id: 3,
    invoiceNo: 'FTR-2026-003',
    recipient: 'Deneme Holding',
    issueDate: '2026-03-01',
    dueDate: '2026-04-01',
    amount: 22000.0,
    status: 'draft',
    description: 'Mart 2026 proje bedeli',
  },
];

const InvoicesPage: React.FC = () => {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('');

  const filtered = MOCK_INVOICES.filter((inv) => {
    const matchSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.recipient.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = filtered.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = filtered
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filtered
    .filter((inv) => inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const columns: GridColDef<Invoice>[] = [
    {
      field: 'invoiceNo',
      headerName: 'Fatura No',
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'recipient',
      headerName: 'Alıcı',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'issueDate',
      headerName: 'Düzenleme Tarihi',
      width: 150,
    },
    {
      field: 'dueDate',
      headerName: 'Vade Tarihi',
      width: 130,
    },
    {
      field: 'amount',
      headerName: 'Tutar',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Durum',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={STATUS_LABELS[params.value as InvoiceStatus]}
          color={STATUS_COLORS[params.value as InvoiceStatus]}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Açıklama',
      flex: 1,
      minWidth: 180,
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      width: 100,
      sortable: false,
      renderCell: () => (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: '100%' }}>
          <Tooltip title="Görüntüle">
            <IconButton size="small" color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="İndir">
            <IconButton size="small">
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Template Uyarısı */}
      <Alert
        severity="info"
        icon={<InfoOutlinedIcon fontSize="small" />}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.info.main, 0.25)}`,
          backgroundColor: alpha(theme.palette.info.main, 0.06),
          '& .MuiAlert-message': { fontWeight: 500 },
        }}
      >
        Bu sayfa henüz geliştirme aşamasındadır. Şu an gösterilen veriler örnek (mock) verilerdir; gerçek fatura işlemleri aktif değildir.
      </Alert>

      {/* Başlık */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RequestQuoteIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>
              Fatura Sistemi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fatura oluşturma ve yönetim ekranı
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Yeni Fatura
        </Button>
      </Stack>

      {/* Özet Kartları */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          {
            label: 'Toplam Tutar',
            value: totalAmount,
            color: theme.palette.primary.main,
            bg: alpha(theme.palette.primary.main, 0.08),
          },
          {
            label: 'Ödenen',
            value: paidAmount,
            color: theme.palette.success.main,
            bg: alpha(theme.palette.success.main, 0.08),
          },
          {
            label: 'Bekleyen',
            value: pendingAmount,
            color: theme.palette.warning.main,
            bg: alpha(theme.palette.warning.main, 0.08),
          },
        ].map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            sx={{
              flex: 1,
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${alpha(card.color, 0.2)}`,
              backgroundColor: card.bg,
            }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={0.5}>
              {card.label}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: card.color }}>
              {card.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
            </Typography>
          </Paper>
        ))}
      </Stack>

      {/* Filtreler ve Tablo */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
        }}
      >
        {/* Filtre Çubuğu */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <TextField
            size="small"
            placeholder="Fatura no veya alıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Durum</InputLabel>
            <Select
              label="Durum"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
            >
              <MenuItem value="">Tümü</MenuItem>
              {(Object.keys(STATUS_LABELS) as InvoiceStatus[]).map((key) => (
                <MenuItem key={key} value={key}>
                  {STATUS_LABELS[key]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filtered.length} kayıt
          </Typography>
        </Box>

        <Divider />

        {/* DataGrid */}
        <DataGrid
          rows={filtered}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
            },
          }}
        />
      </Card>
    </Box>
  );
};

export default InvoicesPage;
