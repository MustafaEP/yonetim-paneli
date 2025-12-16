import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  InputAdornment,
  Button,
  Stack,
  Grid,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../utils/exportUtils';

import type { MemberListItem, MemberStatus } from '../../types/member';
import { getMembers } from '../../api/membersApi';
import { getBranches } from '../../api/branchesApi';
import { getInstitutions } from '../../api/institutionsApi';
import type { Province, District } from '../../types/region';
import {
  getProvinces,
  getDistricts,
} from '../../api/regionsApi';

const MembersListPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [provinceFilter, setProvinceFilter] = useState<string[]>([]);
  const [districtFilter, setDistrictFilter] = useState<string[]>([]);
  const [institutionFilter, setInstitutionFilter] = useState<string[]>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Şubeleri yükle
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches({ isActive: true });
        setBranches(data.map(b => ({ id: b.id, name: b.name })));
      } catch (e) {
        console.error('Şubeler yüklenirken hata:', e);
      }
    };
    loadBranches();
  }, []);

  // İlleri yükle
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (e) {
        console.error('İller yüklenirken hata:', e);
      }
    };
    loadProvinces();
  }, []);

  // İlçeleri yükle (seçili illere göre)
  useEffect(() => {
    const loadDistricts = async () => {
      if (provinceFilter.length === 0) {
        setDistricts([]);
        setDistrictFilter([]); // İl seçimi kaldırıldığında ilçe filtresini temizle
        return;
      }
      try {
        // Tüm seçili illerin ilçelerini birleştir
        const allDistricts: District[] = [];
        for (const provinceId of provinceFilter) {
          const data = await getDistricts(provinceId);
          allDistricts.push(...data);
        }
        setDistricts(allDistricts);
        // Seçili ilçeleri, yeni yüklenen ilçeler listesinde olmayanları temizle
        setDistrictFilter(prev => 
          prev.filter(districtId => 
            allDistricts.some(d => d.id === districtId)
          )
        );
      } catch (e) {
        console.error('İlçeler yüklenirken hata:', e);
      }
    };
    loadDistricts();
  }, [provinceFilter]);

  // Kurumları yükle
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await getInstitutions();
        setInstitutions(data.map(i => ({ id: i.id, name: i.name })));
      } catch (e) {
        console.error('Kurumlar yüklenirken hata:', e);
      }
    };
    loadInstitutions();
  }, []);

  // Filtrelenmiş veriler
  const filteredRows = useMemo(() => {
    let filtered = rows;

    // Durum filtresi
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.status === statusFilter);
    }

    // Şube filtresi
    if (branchFilter !== 'ALL') {
      filtered = filtered.filter((row) => row.branch?.id === branchFilter);
    }

    // İl filtresi
    if (provinceFilter.length > 0) {
      filtered = filtered.filter((row) => 
        row.province?.id && provinceFilter.includes(row.province.id)
      );
    }

    // İlçe filtresi
    if (districtFilter.length > 0) {
      filtered = filtered.filter((row) => 
        row.district?.id && districtFilter.includes(row.district.id)
      );
    }

    // Kurum filtresi
    if (institutionFilter.length > 0) {
      filtered = filtered.filter((row) => 
        row.institution?.id && institutionFilter.includes(row.institution.id)
      );
    }

    // Arama filtresi (Sadece Ad ve Soyad)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (row) =>
          row.firstName.toLowerCase().includes(searchLower) ||
          row.lastName.toLowerCase().includes(searchLower),
      );
    }

    return filtered;
  }, [rows, statusFilter, branchFilter, provinceFilter, districtFilter, institutionFilter, searchText]);

  const getStatusLabel = (status: MemberStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif';
      case 'PENDING':
        return 'Onay Bekliyor';
      case 'RESIGNED':
        return 'İstifa';
      case 'EXPELLED':
        return 'İhraç';
      case 'REJECTED':
        return 'Reddedildi';
      case 'INACTIVE':
        return 'Pasif';
      default:
        return String(status);
    }
  };

  const getStatusColor = (status: MemberStatus): 'success' | 'warning' | 'error' | 'default' | 'info' => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
      case 'EXPELLED':
        return 'error';
      case 'RESIGNED':
      case 'INACTIVE':
        return 'default';
      default:
        return 'info';
    }
  };

  const getPositionTitleLabel = (title?: string | null): string => {
    if (!title) return '-';
    const labels: Record<string, string> = {
      KADRO_657: '657 Kadrolu',
      SOZLESMELI_4B: '4B Sözleşmeli',
      KADRO_663: '663 Kadro Karşılığı',
      AILE_HEKIMLIGI: 'Aile Hekimliği',
      UNVAN_4924: '4924 Unvanlı',
      DIGER_SAGLIK_PERSONELI: 'Diğer Sağlık Personeli',
    };
    return labels[title] || title;
  };

  const columns: GridColDef<MemberListItem>[] = [
    { 
      field: 'registrationNumber',
      headerName: 'Üye Kayıt No',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row: MemberListItem) => row.registrationNumber ?? '-',
    },
    {
      field: 'status',
      headerName: 'Üyelik Durumu',
      flex: 1,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Chip
          label={getStatusLabel(params.row.status)}
          size="small"
          color={getStatusColor(params.row.status)}
          sx={{ fontWeight: 500 }}
        />
      ),
    },
    {
      field: 'positionTitle',
      headerName: 'Ünvan',
      flex: 1,
      minWidth: 150,
      valueGetter: (_value, row: MemberListItem) => getPositionTitleLabel(row.positionTitle),
    },
    {
      field: 'fullName',
      headerName: 'Ad Soyad',
      flex: 1.5,
      minWidth: 150,
      valueGetter: (_value, row: MemberListItem) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: 'nationalId',
      headerName: 'TC Kimlik No',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row: MemberListItem) => row.nationalId ?? '-',
    },
    {
      field: 'institution',
      headerName: 'Çalıştığı Kurum',
      flex: 1.5,
      minWidth: 180,
      valueGetter: (_value, row: MemberListItem) => row.institution?.name ?? '-',
    },
    {
      field: 'createdAt',
      headerName: 'Kayıt Tarihi',
      flex: 1,
      minWidth: 130,
      valueGetter: (_value, row: MemberListItem) => {
        if (row.createdAt) {
          return new Date(row.createdAt).toLocaleDateString('tr-TR');
        }
        return '-';
      },
    },
    {
      field: 'actions',
      headerName: 'Düzenle',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<MemberListItem>) => (
        <Tooltip title="Detay">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/members/${params.row.id}`);
            }}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setError(null);
        console.log('[MembersListPage] Fetching members...');
        const data = await getMembers();
        console.log('[MembersListPage] Received members:', data);
        setRows(data);
      } catch (error: any) {
        console.error('Üyeler alınırken hata:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Üyeler alınırken bir hata oluştu';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  return (
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
            }}
          >
            <PeopleIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
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
              Üyeler
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Yetkili olduğunuz bölgedeki tüm üyeleri görüntüleyin ve yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/members/applications/new')}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              },
            }}
          >
            Yeni Üye
          </Button>
        </Box>

        {/* Mobile New Member Button */}
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          fullWidth
          onClick={() => navigate('/members/applications/new')}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            mt: 2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            py: 1.5,
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          Yeni Üye Başvurusu
        </Button>
      </Box>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Grid container spacing={2}>
            {/* Arama */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <TextField
                placeholder="Ad, Soyad..."
                size="small"
                fullWidth
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                  },
                }}
              />
            </Grid>
            {/* Durum */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="small" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FilterListIcon fontSize="small" />
                    Durum
                  </Box>
                </InputLabel>
                <Select
                  value={statusFilter}
                  label="Durum"
                  onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">Tümü</MenuItem>
                  <MenuItem value="ACTIVE">Aktif</MenuItem>
                  <MenuItem value="PENDING">Onay Bekliyor</MenuItem>
                  <MenuItem value="INACTIVE">Pasif</MenuItem>
                  <MenuItem value="RESIGNED">İstifa</MenuItem>
                  <MenuItem value="EXPELLED">İhraç</MenuItem>
                  <MenuItem value="REJECTED">Reddedildi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Şube */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="small" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Şube</InputLabel>
                <Select
                  value={branchFilter}
                  label="Şube"
                  onChange={(e) => setBranchFilter(e.target.value)}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="ALL">Tümü</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* İl */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="small" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İl</InputLabel>
                <Select
                  multiple
                  value={provinceFilter}
                  label="İl"
                  onChange={(e) => {
                    const value = e.target.value;
                    setProvinceFilter(typeof value === 'string' ? value.split(',') : value);
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Tümü';
                    if (selected.length === 1) {
                      const province = provinces.find(p => p.id === selected[0]);
                      return province?.name || selected[0];
                    }
                    return `${selected.length} il seçildi`;
                  }}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {provinces.map((province) => (
                    <MenuItem key={province.id} value={province.id}>
                      {province.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* İlçe */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="small" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İlçe</InputLabel>
                <Select
                  multiple
                  value={districtFilter}
                  label="İlçe"
                  onChange={(e) => {
                    const value = e.target.value;
                    setDistrictFilter(typeof value === 'string' ? value.split(',') : value);
                  }}
                  disabled={provinceFilter.length === 0}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Tümü';
                    if (selected.length === 1) {
                      const district = districts.find(d => d.id === selected[0]);
                      return district?.name || selected[0];
                    }
                    return `${selected.length} ilçe seçildi`;
                  }}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Kurum */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl 
                size="small" 
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#fff',
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Kurum</InputLabel>
                <Select
                  multiple
                  value={institutionFilter}
                  label="Kurum"
                  onChange={(e) => {
                    const value = e.target.value;
                    setInstitutionFilter(typeof value === 'string' ? value.split(',') : value);
                  }}
                  renderValue={(selected) => {
                    if (selected.length === 0) return 'Tümü';
                    if (selected.length === 1) {
                      const institution = institutions.find(i => i.id === selected[0]);
                      return institution?.name || selected[0];
                    }
                    return `${selected.length} kurum seçildi`;
                  }}
                  MenuProps={{
                    disablePortal: false,
                    disableScrollLock: true,
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {institutions.map((institution) => (
                    <MenuItem key={institution.id} value={institution.id}>
                      {institution.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sonuç Sayısı ve Export Butonları */}
          {!loading && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.info.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <PeopleIcon fontSize="small" />
                  Toplam {filteredRows.length} üye bulundu
                </Typography>
              </Paper>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => {
                    const exportColumns: ExportColumn[] = columns.map((col) => ({
                      field: col.field,
                      headerName: col.headerName,
                      width: col.width,
                      valueGetter: col.valueGetter,
                    }));
                    exportToExcel(filteredRows, exportColumns, 'uyeler');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Excel
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={() => {
                    const exportColumns: ExportColumn[] = columns.map((col) => ({
                      field: col.field,
                      headerName: col.headerName,
                      width: col.width,
                      valueGetter: col.valueGetter,
                    }));
                    exportToPDF(filteredRows, exportColumns, 'uyeler', 'Üyeler Listesi');
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  PDF
                </Button>
              </Box>
            </Box>
          )}

          {/* Tablo - Her zaman render edilir, loading state'i DataGrid'e geçirilir */}
          <Box
            sx={{
              height: { xs: 400, sm: 500, md: 600 },
              minHeight: { xs: 400, sm: 500, md: 600 },
              '& .MuiDataGrid-root': {
                border: 'none',
                borderRadius: 2,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 0,
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.02),
                },
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.background.default, 0.5),
              },
            }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              initialState={{
                pagination: { paginationModel: { pageSize: 25, page: 0 } },
              }}
              pageSizeOptions={[10, 25, 50, 100]}
              disableRowSelectionOnClick
              sx={{
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: '200px',
                },
              }}
            />
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default MembersListPage;