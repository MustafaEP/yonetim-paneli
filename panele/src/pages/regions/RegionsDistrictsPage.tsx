// src/pages/regions/RegionsDistrictsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import FilterListIcon from '@mui/icons-material/FilterList';
import MapIcon from '@mui/icons-material/Map';

import type { Province, District } from '../../types/region';
import {
  getProvinces,
  getDistricts,
} from '../../api/regionsApi';
import PageHeader from '../../components/layout/PageHeader';

const RegionsDistrictsPage: React.FC = () => {
  const theme = useTheme();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [rows, setRows] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProvinces = async () => {
    try {
      const data = await getProvinces();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İller alınırken hata:', e);
      setProvinces([]);
    }
  };

  const loadDistricts = async (provinceId?: string) => {
    setLoading(true);
    try {
      const data = await getDistricts(provinceId);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('İlçeler alınırken hata:', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProvinces();
    loadDistricts();
  }, []);

  useEffect(() => {
    if (selectedProvinceId) {
      loadDistricts(selectedProvinceId);
    } else {
      loadDistricts();
    }
  }, [selectedProvinceId]);

  const columns: GridColDef<District>[] = [
    {
      field: 'name',
      headerName: 'İlçe Adı',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationCityIcon sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
          <Typography sx={{ fontWeight: 500 }}>{params.row.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'province',
      headerName: 'İl',
      flex: 1,
      minWidth: 200,
      valueGetter: (params: { row?: District }) => params?.row?.province?.name ?? '',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MapIcon sx={{ color: theme.palette.info.main, fontSize: '1.1rem' }} />
          <Typography>{params.row.province?.name ?? ''}</Typography>
        </Box>
      ),
    },
  ];

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
      <PageHeader
        icon={<LocationCityIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
        title="İlçeler"
        description="İllere bağlı ilçeleri görüntüleyin ve filtreleyin"
        color={theme.palette.primary.main}
        darkColor={theme.palette.primary.dark}
        lightColor={theme.palette.primary.light}
      />

      {/* Ana Kart */}
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
        {/* Filtre Bölümü */}
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilterListIcon sx={{ color: theme.palette.primary.main }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Filtreler
            </Typography>
          </Box>
          <FormControl
            size="small"
            fullWidth
            sx={{
              maxWidth: { sm: 400 },
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
          >
            <InputLabel>İl Filtresi</InputLabel>
            <Select
              label="İl Filtresi"
              value={selectedProvinceId}
              onChange={(e) => setSelectedProvinceId(e.target.value as string)}
            >
              <MenuItem value="">
                <em>Tümü</em>
              </MenuItem>
              {provinces.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* İçerik Bölümü */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Sonuç Sayısı */}
          {!loading && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 2,
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
                <LocationCityIcon fontSize="small" />
                Toplam {rows.length} ilçe bulundu
              </Typography>
            </Paper>
          )}

          {/* Tablo */}
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
                cursor: 'default',
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
              rows={rows}
              columns={columns}
              getRowId={(row) => row.id}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 25, page: 0 },
                },
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

export default RegionsDistrictsPage;