// src/pages/regions/RegionsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Checkbox,
  FormControlLabel,
  Container,
  alpha,
  Fade,
  Zoom,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BusinessIcon from '@mui/icons-material/Business';
import StoreIcon from '@mui/icons-material/Store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import type { Province, District } from '../../../types/region';
import { 
  getProvinces, 
  getDistricts,
  updateInstitution,
} from '../services/regionsApi';
import { 
  getInstitutions, 
  type Institution 
} from '../services/institutionsApi';
import { 
  getTevkifatCenters, 
  updateTevkifatCenter,
  type TevkifatCenter 
} from '../../accounting/services/accountingApi';
import { 
  getBranches, 
  updateBranch,
  type Branch 
} from '../services/branchesApi';
import { useAuth } from '../../../app/providers/AuthContext';
import PageHeader from '../../../shared/components/layout/PageHeader';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';

const RegionsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canSeeRegions = hasPermission('REGION_LIST') || hasPermission('MEMBER_LIST_BY_PROVINCE');

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');

  // İle bağlı listeler
  const [tevkifatCenters, setTevkifatCenters] = useState<TevkifatCenter[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingTevkifatCenters, setLoadingTevkifatCenters] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Dialog states
  const [institutionDialogOpen, setInstitutionDialogOpen] = useState(false);
  const [tevkifatDialogOpen, setTevkifatDialogOpen] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  
  // Unlink confirmation dialog states
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkType, setUnlinkType] = useState<'institution' | 'tevkifat' | 'branch' | null>(null);
  const [unlinkItemId, setUnlinkItemId] = useState<string | null>(null);
  const [unlinkItemName, setUnlinkItemName] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Selection states
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [allTevkifatCenters, setAllTevkifatCenters] = useState<TevkifatCenter[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [loadingAllInstitutions, setLoadingAllInstitutions] = useState(false);
  const [loadingAllTevkifatCenters, setLoadingAllTevkifatCenters] = useState(false);
  const [loadingAllBranches, setLoadingAllBranches] = useState(false);
  
  const [selectedInstitutionIds, setSelectedInstitutionIds] = useState<string[]>([]);
  const [selectedTevkifatIds, setSelectedTevkifatIds] = useState<string[]>([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // İlleri yükle
  useEffect(() => {
    if (!canSeeRegions) return;

    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data = await getProvinces();
        setProvinces(data);
      } catch (e: unknown) {
        console.error('İller alınırken hata:', e);
        const err = e as { response?: { data?: { message?: string } } };
        toast.showError(err?.response?.data?.message ?? 'İller alınırken bir hata oluştu.');
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, [canSeeRegions]);

  // İl seçildiğinde ilçeleri yükle
  useEffect(() => {
    if (!selectedProvinceId) {
      setDistricts([]);
      setSelectedDistrictId('');
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await getDistricts(selectedProvinceId);
        setDistricts(data);
        setSelectedDistrictId(''); // İl değişince ilçe seçimini sıfırla
      } catch (e: unknown) {
        console.error('İlçeler alınırken hata:', e);
        const err = e as { response?: { data?: { message?: string } } };
        toast.showError(err?.response?.data?.message ?? 'İlçeler alınırken bir hata oluştu.');
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [selectedProvinceId]);

  // İl veya ilçe seçildiğinde tevkifat merkezleri, kurumlar ve şubeleri yükle
  useEffect(() => {
    if (!selectedProvinceId) {
      setTevkifatCenters([]);
      setInstitutions([]);
      setBranches([]);
      return;
    }

    const loadRegionData = async () => {
      // Filtre parametrelerini hazırla
      const filters: { provinceId?: string; districtId?: string } = {
        provinceId: selectedProvinceId,
      };
      
      // İlçe seçildiyse, sadece o ilçenin verilerini getir
      if (selectedDistrictId) {
        filters.districtId = selectedDistrictId;
      }

      // Tevkifat merkezleri
      setLoadingTevkifatCenters(true);
      try {
        const tevkifatData = await getTevkifatCenters(filters);
        setTevkifatCenters(tevkifatData);
      } catch (e: unknown) {
        console.error('Tevkifat merkezleri alınırken hata:', e);
        const err = e as { response?: { data?: { message?: string } } };
        toast.showError(err?.response?.data?.message ?? 'Tevkifat merkezleri alınırken bir hata oluştu.');
      } finally {
        setLoadingTevkifatCenters(false);
      }

      // Kurumlar
      setLoadingInstitutions(true);
      try {
        const institutionsData = await getInstitutions(filters);
        setInstitutions(institutionsData);
      } catch (e: unknown) {
        console.error('Kurumlar alınırken hata:', e);
        const err = e as { response?: { data?: { message?: string } } };
        toast.showError(err?.response?.data?.message ?? 'Kurumlar alınırken bir hata oluştu.');
      } finally {
        setLoadingInstitutions(false);
      }

      // Şubeler
      setLoadingBranches(true);
      try {
        const branchesData = await getBranches(filters);
        setBranches(branchesData);
      } catch (e: unknown) {
        console.error('Şubeler alınırken hata:', e);
        const err = e as { response?: { data?: { message?: string } } };
        toast.showError(err?.response?.data?.message ?? 'Şubeler alınırken bir hata oluştu.');
      } finally {
        setLoadingBranches(false);
      }
    };

    loadRegionData();
  }, [selectedProvinceId, selectedDistrictId]);

  const handleProvinceChange = (event: any) => {
    setSelectedProvinceId(event.target.value);
  };

  const handleDistrictChange = (event: any) => {
    setSelectedDistrictId(event.target.value);
  };

  // Dialog handlers
  const handleOpenInstitutionDialog = async () => {
    setError(null);
    setSelectedInstitutionIds([]);
    setInstitutionDialogOpen(true);
    
    // Tüm kurumları yükle (hiçbir ile/ilçeye bağlı olmayanlar)
    setLoadingAllInstitutions(true);
    try {
      const allData = await getInstitutions();
      // Sadece hiçbir ile bağlı olmayanları göster (bir ile/ilçeye bağlı olanlar başka bir ile/ilçeye bağlanamaz)
      const filtered = allData.filter(
        inst => !inst.provinceId
      );
      setAllInstitutions(filtered);
    } catch (e) {
      console.error('Kurumlar yüklenirken hata:', e);
      setError('Kurumlar yüklenirken bir hata oluştu');
    } finally {
      setLoadingAllInstitutions(false);
    }
  };

  const handleOpenTevkifatDialog = async () => {
    setError(null);
    setSelectedTevkifatIds([]);
    setTevkifatDialogOpen(true);
    
    // Tüm tevkifat merkezlerini yükle (hiçbir ile/ilçeye bağlı olmayanlar)
    setLoadingAllTevkifatCenters(true);
    try {
      const allData = await getTevkifatCenters();
      // Sadece hiçbir ile bağlı olmayanları göster (bir ile/ilçeye bağlı olanlar başka bir ile/ilçeye bağlanamaz)
      const filtered = allData.filter(
        center => !center.provinceId
      );
      setAllTevkifatCenters(filtered);
    } catch (e) {
      console.error('Tevkifat merkezleri yüklenirken hata:', e);
      setError('Tevkifat merkezleri yüklenirken bir hata oluştu');
    } finally {
      setLoadingAllTevkifatCenters(false);
    }
  };

  const handleOpenBranchDialog = async () => {
    setError(null);
    setSelectedBranchIds([]);
    setBranchDialogOpen(true);
    
    // Tüm şubeleri yükle (hiçbir ile/ilçeye bağlı olmayanlar)
    setLoadingAllBranches(true);
    try {
      const allData = await getBranches();
      // Sadece hiçbir ile bağlı olmayanları göster (bir ile/ilçeye bağlı olanlar başka bir ile/ilçeye bağlanamaz)
      const filtered = allData.filter(
        branch => !branch.provinceId
      );
      setAllBranches(filtered);
    } catch (e) {
      console.error('Şubeler yüklenirken hata:', e);
      setError('Şubeler yüklenirken bir hata oluştu');
    } finally {
      setLoadingAllBranches(false);
    }
  };

  // Form submit handlers
  const handleAssignInstitutions = async () => {
    if (selectedInstitutionIds.length === 0) {
      setError('En az bir kurum seçmelisiniz');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Seçilen kurumları bu ile bağla
      await Promise.all(
        selectedInstitutionIds.map(id => {
          const institution = allInstitutions.find(inst => inst.id === id);
          if (!institution) return Promise.resolve();
          
          return updateInstitution(id, {
            name: institution.name,
            provinceId: selectedProvinceId,
            districtId: selectedDistrictId || institution.districtId || undefined,
            isActive: institution.isActive,
          });
        })
      );
      
      // Refresh institutions list
      const institutionsData = await getInstitutions({ provinceId: selectedProvinceId });
      setInstitutions(institutionsData);
      
      setInstitutionDialogOpen(false);
      setSelectedInstitutionIds([]);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Kurumlar eklenirken bir hata oluştu'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignTevkifatCenters = async () => {
    if (selectedTevkifatIds.length === 0) {
      setError('En az bir tevkifat merkezi seçmelisiniz');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Seçilen tevkifat merkezlerini bu ile bağla
      await Promise.all(
        selectedTevkifatIds.map(id => {
          const center = allTevkifatCenters.find(c => c.id === id);
          if (!center) return Promise.resolve();
          
          return updateTevkifatCenter(id, {
            name: center.name,
            provinceId: selectedProvinceId,
            districtId: selectedDistrictId || center.districtId || undefined,
            isActive: center.isActive,
          });
        })
      );
      
      // Refresh tevkifat centers list
      const tevkifatData = await getTevkifatCenters({ provinceId: selectedProvinceId });
      setTevkifatCenters(tevkifatData);
      
      setTevkifatDialogOpen(false);
      setSelectedTevkifatIds([]);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Tevkifat merkezleri eklenirken bir hata oluştu'));
    } finally {
      setSaving(false);
    }
  };

  const handleAssignBranches = async () => {
    if (selectedBranchIds.length === 0) {
      setError('En az bir şube seçmelisiniz');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Seçilen şubeleri bu ile bağla
      await Promise.all(
        selectedBranchIds.map(id => {
          const branch = allBranches.find(b => b.id === id);
          if (!branch) return Promise.resolve();
          
          return updateBranch(id, {
            name: branch.name,
            provinceId: selectedProvinceId,
            districtId: selectedDistrictId || branch.districtId || undefined,
            isActive: branch.isActive,
          });
        })
      );
      
      // Refresh branches list
      const branchesData = await getBranches({ provinceId: selectedProvinceId });
      setBranches(branchesData);
      
      setBranchDialogOpen(false);
      setSelectedBranchIds([]);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Şubeler eklenirken bir hata oluştu'));
    } finally {
      setSaving(false);
    }
  };

  // Unlink handlers
  const handleOpenUnlinkDialog = (type: 'institution' | 'tevkifat' | 'branch', id: string, name: string) => {
    setUnlinkType(type);
    setUnlinkItemId(id);
    setUnlinkItemName(name);
    setUnlinkDialogOpen(true);
    setError(null);
  };

  const handleUnlink = async () => {
    if (!unlinkType || !unlinkItemId) return;

    setUnlinking(true);
    setError(null);
    try {
      if (unlinkType === 'institution') {
        const institution = institutions.find(inst => inst.id === unlinkItemId);
        if (!institution) throw new Error('Kurum bulunamadı');
        
        await updateInstitution(unlinkItemId, {
          name: institution.name,
          provinceId: null as any,
          districtId: null as any,
          isActive: institution.isActive,
        });
        
        // Refresh institutions list
        const institutionsData = await getInstitutions({ provinceId: selectedProvinceId });
        setInstitutions(institutionsData);
      } else if (unlinkType === 'tevkifat') {
        const center = tevkifatCenters.find(c => c.id === unlinkItemId);
        if (!center) throw new Error('Tevkifat merkezi bulunamadı');
        
        await updateTevkifatCenter(unlinkItemId, {
          name: center.name,
          provinceId: null as any,
          districtId: null as any,
          isActive: center.isActive,
        });
        
        // Refresh tevkifat centers list
        const tevkifatData = await getTevkifatCenters({ provinceId: selectedProvinceId });
        setTevkifatCenters(tevkifatData);
      } else if (unlinkType === 'branch') {
        const branch = branches.find(b => b.id === unlinkItemId);
        if (!branch) throw new Error('Şube bulunamadı');
        
        await updateBranch(unlinkItemId, {
          name: branch.name,
          provinceId: null as any,
          districtId: null as any,
          isActive: branch.isActive,
        });
        
        // Refresh branches list
        const branchesData = await getBranches({ provinceId: selectedProvinceId });
        setBranches(branchesData);
      }
      
      setUnlinkDialogOpen(false);
      setUnlinkType(null);
      setUnlinkItemId(null);
      setUnlinkItemName(null);
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, 'Bağlantı koparılırken bir hata oluştu'));
    } finally {
      setUnlinking(false);
    }
  };

  if (!canSeeRegions) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <LocationOnIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6">Bölge bilgilerini görüntüleme yetkiniz yok.</Typography>
          </CardContent>
        </Card>
      </Container>
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
      <Container maxWidth="xl">
        {/* Header Section */}
        <PageHeader
          icon={<LocationOnIcon sx={{ color: '#fff', fontSize: { xs: '1.8rem', sm: '2rem' } }} />}
          title="İl ve İlçeler"
          description="Detaylarını görmek istediğiniz il ve ilçeyi seçerek bağlı kurumları, şubeleri ve tevkifat merkezlerini görüntüleyin"
          color={theme.palette.primary.main}
          darkColor={theme.palette.primary.dark}
          lightColor={theme.palette.primary.light}
        />

        {/* Filter Section */}
        <Fade in timeout={1000}>
          <Card 
            elevation={0}
            sx={{ 
              mb: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              background: (theme) => theme.palette.background.paper,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.12)}`,
                transform: 'translateY(-2px)',
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <SearchIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Bölge Filtrele
                </Typography>
              </Box>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative' }}>
                    <FormControl 
                      fullWidth
                      sx={{
                        minWidth: { xs: '100%', sm: 280 },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s',
                          '&:hover': {
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                          }
                        }
                      }}
                    >
                      <InputLabel>İl Seçin</InputLabel>
                      <Select
                        value={selectedProvinceId}
                        onChange={handleProvinceChange}
                        label="İl Seçin"
                        disabled={loadingProvinces}
                      >
                        <MenuItem value="">
                          <em>Tüm İller</em>
                        </MenuItem>
                        {provinces.map((province) => (
                          <MenuItem key={province.id} value={province.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                              {province.name} {province.code && <Chip label={province.code} size="small" />}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {loadingProvinces && (
                      <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
                        <CircularProgress size={20} />
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative' }}>
                    <FormControl 
                      fullWidth 
                      disabled={!selectedProvinceId || loadingDistricts}
                      sx={{
                        minWidth: { xs: '100%', sm: 280 },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          transition: 'all 0.3s',
                          '&:hover:not(.Mui-disabled)': {
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                          },
                          '&.Mui-focused': {
                            boxShadow: (theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                          }
                        }
                      }}
                    >
                      <InputLabel>İlçe Seçin (Opsiyonel)</InputLabel>
                      <Select
                        value={selectedDistrictId}
                        onChange={handleDistrictChange}
                        label="İlçe Seçin (Opsiyonel)"
                      >
                        <MenuItem value="">
                          <em>Tüm İlçeler</em>
                        </MenuItem>
                        {districts.map((district) => (
                          <MenuItem key={district.id} value={district.id}>
                            {district.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {loadingDistricts && (
                      <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
                        <CircularProgress size={20} />
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Fade>

        {/* İl veya ilçe seçildiğinde gösterilecek listeler */}
        {selectedProvinceId && (
          <Zoom in timeout={600}>
            <Box>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 4,
                    height: 32,
                    borderRadius: 2,
                    background: (theme) => `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {selectedDistrictId 
                    ? `${districts.find(d => d.id === selectedDistrictId)?.name} İlçesine Bağlı Kayıtlar`
                    : `${provinces.find(p => p.id === selectedProvinceId)?.name} İline Bağlı Kayıtlar`
                  }
                </Typography>
              </Box>
              <Grid container spacing={{ xs: 2, md: 3 }}>
              {/* Tevkifat Merkezleri */}
              <Grid item xs={12} lg={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: (theme) => `0 12px 28px ${alpha(theme.palette.primary.main, 0.15)}`,
                      transform: 'translateY(-4px)',
                      borderColor: 'primary.main',
                    }
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      background: (theme) => alpha(theme.palette.primary.main, 0.04),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          }}
                        >
                          <AccountBalanceIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Tevkifat Merkezleri
                          </Typography>
                          <Chip 
                            label={`${tevkifatCenters.length} Kayıt`}
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: (theme) => alpha(theme.palette.primary.main, 0.1),
                              color: 'primary.main',
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenTevkifatDialog}
                        disabled={!selectedProvinceId}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          }
                        }}
                      >
                        Ekle
                      </Button>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {loadingTevkifatCenters ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} />
                      </Box>
                    ) : tevkifatCenters.length === 0 ? (
                      <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
                        <AccountBalanceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedDistrictId 
                            ? 'Bu ilçeye bağlı tevkifat merkezi bulunmamaktadır.'
                            : 'Bu ile bağlı tevkifat merkezi bulunmamaktadır.'
                          }
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                        <List dense disablePadding>
                          {tevkifatCenters.map((center, index) => (
                            <ListItem
                              key={center.id}
                              sx={{
                                px: 2.5,
                                py: 1.5,
                                borderBottom: index < tevkifatCenters.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                                  pl: 3,
                                },
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {center.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {center.title || center.district?.name}
                                  </Typography>
                                }
                              />
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                  size="small"
                                  startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => navigate(`/accounting/tevkifat-centers/${center.id}`)}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    borderRadius: 1.5,
                                    minWidth: 'auto',
                                    px: 1.5,
                                  }}
                                >
                                  Görüntüle
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenUnlinkDialog('tevkifat', center.id, center.name)}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                  title="Bağlantıyı Kopar"
                                >
                                  <LinkOffIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Kurumlar */}
              <Grid item xs={12} lg={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: (theme) => `0 12px 28px ${alpha(theme.palette.success.main, 0.15)}`,
                      transform: 'translateY(-4px)',
                      borderColor: 'success.main',
                    }
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      background: (theme) => alpha(theme.palette.success.main, 0.04),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                          }}
                        >
                          <BusinessIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Kurumlar
                          </Typography>
                          <Chip 
                            label={`${institutions.length} Kayıt`}
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: (theme) => alpha(theme.palette.success.main, 0.1),
                              color: 'success.main',
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<AddIcon />}
                        onClick={handleOpenInstitutionDialog}
                        disabled={!selectedProvinceId}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                          }
                        }}
                      >
                        Ekle
                      </Button>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {loadingInstitutions ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} color="success" />
                      </Box>
                    ) : institutions.length === 0 ? (
                      <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
                        <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedDistrictId 
                            ? 'Bu ilçeye bağlı kurum bulunmamaktadır.'
                            : 'Bu ile bağlı kurum bulunmamaktadır.'
                          }
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                        <List dense disablePadding>
                          {institutions.map((institution, index) => (
                            <ListItem
                              key={institution.id}
                              sx={{
                                px: 2.5,
                                py: 1.5,
                                borderBottom: index < institutions.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  backgroundColor: (theme) => alpha(theme.palette.success.main, 0.06),
                                  pl: 3,
                                },
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {institution.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {institution.district?.name || institution.province?.name}
                                  </Typography>
                                }
                              />
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                  size="small"
                                  color="success"
                                  startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => navigate(`/institutions?institutionId=${institution.id}`)}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    borderRadius: 1.5,
                                    minWidth: 'auto',
                                    px: 1.5,
                                  }}
                                >
                                  Görüntüle
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenUnlinkDialog('institution', institution.id, institution.name)}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                  title="Bağlantıyı Kopar"
                                >
                                  <LinkOffIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Şubeler */}
              <Grid item xs={12} lg={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: (theme) => `0 12px 28px ${alpha(theme.palette.info.main, 0.15)}`,
                      transform: 'translateY(-4px)',
                      borderColor: 'info.main',
                    }
                  }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      background: (theme) => alpha(theme.palette.info.main, 0.04),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                          }}
                        >
                          <StoreIcon sx={{ color: 'white', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                            Şubeler
                          </Typography>
                          <Chip 
                            label={`${branches.length} Kayıt`}
                            size="small" 
                            sx={{ 
                              height: 20,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: (theme) => alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              mt: 0.5,
                            }}
                          />
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        color="info"
                        startIcon={<AddIcon />}
                        onClick={handleOpenBranchDialog}
                        disabled={!selectedProvinceId}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          boxShadow: 'none',
                          '&:hover': {
                            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                          }
                        }}
                      >
                        Ekle
                      </Button>
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    {loadingBranches ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={32} color="info" />
                      </Box>
                    ) : branches.length === 0 ? (
                      <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
                        <StoreIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
                        <Typography variant="body2" color="text.secondary">
                          {selectedDistrictId 
                            ? 'Bu ilçeye bağlı şube bulunmamaktadır.'
                            : 'Bu ile bağlı şube bulunmamaktadır.'
                          }
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                        <List dense disablePadding>
                          {branches.map((branch, index) => (
                            <ListItem
                              key={branch.id}
                              sx={{
                                px: 2.5,
                                py: 1.5,
                                borderBottom: index < branches.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  backgroundColor: (theme) => alpha(theme.palette.info.main, 0.06),
                                  pl: 3,
                                },
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {branch.name}
                                  </Typography>
                                }
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    {branch.district?.name || branch.province?.name || ''}
                                  </Typography>
                                }
                              />
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Button
                                  size="small"
                                  color="info"
                                  startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => navigate(`/regions/branches/${branch.id}`)}
                                  sx={{
                                    textTransform: 'none',
                                    fontSize: '0.75rem',
                                    borderRadius: 1.5,
                                    minWidth: 'auto',
                                    px: 1.5,
                                  }}
                                >
                                  Görüntüle
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenUnlinkDialog('branch', branch.id, branch.name)}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: (theme) => alpha(theme.palette.error.main, 0.1),
                                    },
                                  }}
                                  title="Bağlantıyı Kopar"
                                >
                                  <LinkOffIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            </Box>
          </Zoom>
        )}
      </Container>

      {/* Kurum Ekleme Dialog */}
      <Dialog 
        open={institutionDialogOpen} 
        onClose={() => !saving && setInstitutionDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
          color: 'white',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <BusinessIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Kurum Seç ve Ekle</Typography>
            </Box>
            <IconButton
              onClick={() => !saving && setInstitutionDialogOpen(false)}
              disabled={saving}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {loadingAllInstitutions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} color="success" />
            </Box>
          ) : allInstitutions.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                Hiçbir ile/ilçeye bağlı olmayan kurum bulunmamaktadır.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
              <List dense>
                {allInstitutions.map((institution, index) => (
                  <ListItem
                    key={institution.id}
                    sx={{
                      px: 0,
                      py: 1,
                      borderBottom: index < allInstitutions.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        backgroundColor: (theme) => alpha(theme.palette.success.main, 0.06),
                        borderRadius: 2,
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedInstitutionIds.includes(institution.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInstitutionIds([...selectedInstitutionIds, institution.id]);
                            } else {
                              setSelectedInstitutionIds(selectedInstitutionIds.filter(id => id !== institution.id));
                            }
                          }}
                          disabled={saving}
                          color="success"
                          sx={{ ml: 1 }}
                        />
                      }
                      label={
                        <Box sx={{ pl: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {institution.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {institution.district?.name || institution.province?.name || 'Konum belirtilmemiş'}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: (theme) => alpha(theme.palette.success.main, 0.04) }}>
          <Button 
            onClick={() => setInstitutionDialogOpen(false)} 
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleAssignInstitutions} 
            variant="contained" 
            color="success"
            disabled={saving || selectedInstitutionIds.length === 0}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
              }
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : `Seçilenleri Ekle (${selectedInstitutionIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tevkifat Merkezi Ekleme Dialog */}
      <Dialog 
        open={tevkifatDialogOpen} 
        onClose={() => !saving && setTevkifatDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <AccountBalanceIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Tevkifat Merkezi Seç ve Ekle</Typography>
            </Box>
            <IconButton
              onClick={() => !saving && setTevkifatDialogOpen(false)}
              disabled={saving}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {loadingAllTevkifatCenters ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} />
            </Box>
          ) : allTevkifatCenters.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                Hiçbir ile/ilçeye bağlı olmayan tevkifat merkezi bulunmamaktadır.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
              <List dense>
                {allTevkifatCenters.map((center, index) => (
                  <ListItem
                    key={center.id}
                    sx={{
                      px: 0,
                      py: 1,
                      borderBottom: index < allTevkifatCenters.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                        borderRadius: 2,
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedTevkifatIds.includes(center.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTevkifatIds([...selectedTevkifatIds, center.id]);
                            } else {
                              setSelectedTevkifatIds(selectedTevkifatIds.filter(id => id !== center.id));
                            }
                          }}
                          disabled={saving}
                          sx={{ ml: 1 }}
                        />
                      }
                      label={
                        <Box sx={{ pl: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {center.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {center.district?.name || center.province?.name || 'Konum belirtilmemiş'}
                            {center.title && ` • ${center.title}`}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: (theme) => alpha(theme.palette.primary.main, 0.04) }}>
          <Button 
            onClick={() => setTevkifatDialogOpen(false)} 
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleAssignTevkifatCenters} 
            variant="contained" 
            disabled={saving || selectedTevkifatIds.length === 0}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : `Seçilenleri Ekle (${selectedTevkifatIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Şube Ekleme Dialog */}
      <Dialog 
        open={branchDialogOpen} 
        onClose={() => !saving && setBranchDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
          color: 'white',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <StoreIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Şube Seç ve Ekle</Typography>
            </Box>
            <IconButton
              onClick={() => !saving && setBranchDialogOpen(false)}
              disabled={saving}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          {loadingAllBranches ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={40} color="info" />
            </Box>
          ) : allBranches.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <StoreIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
              <Typography variant="body2" color="text.secondary">
                Hiçbir ile/ilçeye bağlı olmayan şube bulunmamaktadır.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 400, overflowY: 'auto', mt: 1 }}>
              <List dense>
                {allBranches.map((branch, index) => (
                  <ListItem
                    key={branch.id}
                    sx={{
                      px: 0,
                      py: 1,
                      borderBottom: index < allBranches.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      transition: 'all 0.2s',
                      '&:hover': { 
                        backgroundColor: (theme) => alpha(theme.palette.info.main, 0.06),
                        borderRadius: 2,
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedBranchIds.includes(branch.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranchIds([...selectedBranchIds, branch.id]);
                            } else {
                              setSelectedBranchIds(selectedBranchIds.filter(id => id !== branch.id));
                            }
                          }}
                          disabled={saving}
                          color="info"
                          sx={{ ml: 1 }}
                        />
                      }
                      label={
                        <Box sx={{ pl: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {branch.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {branch.district?.name || branch.province?.name || 'Konum belirtilmemiş'}
                            {branch.code && ` • Kod: ${branch.code}`}
                          </Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: (theme) => alpha(theme.palette.info.main, 0.04) }}>
          <Button 
            onClick={() => setBranchDialogOpen(false)} 
            disabled={saving}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleAssignBranches} 
            variant="contained" 
            color="info"
            disabled={saving || selectedBranchIds.length === 0}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
              }
            }}
          >
            {saving ? <CircularProgress size={20} color="inherit" /> : `Seçilenleri Ekle (${selectedBranchIds.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bağlantıyı Kopar Onay Dialog */}
      <Dialog 
        open={unlinkDialogOpen} 
        onClose={() => !unlinking && setUnlinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: (theme) => `0 24px 48px ${alpha(theme.palette.common.black, 0.2)}`,
          }
        }}
      >
        <DialogTitle sx={{ 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
          color: 'white',
          py: 2.5,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LinkOffIcon />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Bağlantıyı Kopar</Typography>
            </Box>
            <IconButton
              onClick={() => !unlinking && setUnlinkDialogOpen(false)}
              disabled={unlinking}
              size="small"
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2, 
                borderRadius: 2,
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.15)}`,
              }} 
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          <Typography variant="body1" sx={{ mb: 2 }}>
            {unlinkType === 'institution' && `${unlinkItemName} kurumunun`}
            {unlinkType === 'tevkifat' && `${unlinkItemName} tevkifat merkezinin`}
            {unlinkType === 'branch' && `${unlinkItemName} şubesinin`}
            {' '}bu ile/ilçe bağlantısını koparmak istediğinizden emin misiniz?
          </Typography>
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            Bu işlem geri alınamaz. Bağlantı koparıldıktan sonra bu kayıt başka bir ile/ilçeye bağlanabilir.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, background: (theme) => alpha(theme.palette.error.main, 0.04) }}>
          <Button 
            onClick={() => setUnlinkDialogOpen(false)} 
            disabled={unlinking}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            İptal
          </Button>
          <Button 
            onClick={handleUnlink} 
            variant="contained" 
            color="error"
            disabled={unlinking}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 160,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
              }
            }}
          >
            {unlinking ? <CircularProgress size={20} color="inherit" /> : 'Bağlantıyı Kopar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegionsPage;
