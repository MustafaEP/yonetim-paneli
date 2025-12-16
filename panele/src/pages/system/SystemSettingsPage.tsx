// src/pages/system/SystemSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

import type { SystemSetting } from '../../api/systemApi';
import { getSystemSettings, updateSystemSetting } from '../../api/systemApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SystemSettingsPage: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState('');

  const [tabValue, setTabValue] = useState(0);

  const canView = hasPermission('SYSTEM_SETTINGS_VIEW');
  const canManage = hasPermission('SYSTEM_SETTINGS_MANAGE');

  useEffect(() => {
    if (canView) {
      loadSettings();
    }
  }, [canView]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (e: any) {
      console.error('Ayarlar yüklenirken hata:', e);
      toast.error('Ayarlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
    setEditValue(setting.value);
    setError(null);
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingSetting) return;

    setSaving(true);
    setError(null);

    try {
      await updateSystemSetting(editingSetting.key, { value: editValue });
      toast.success('Ayar başarıyla güncellendi');
      setEditDialogOpen(false);
      setEditingSetting(null);
      loadSettings();
    } catch (e: any) {
      console.error('Ayar güncellenirken hata:', e);
      setError(e.response?.data?.message || 'Ayar güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['GENERAL', 'EMAIL', 'SMS', 'INTEGRATION', 'OTHER'];
  const categoryLabels: Record<string, string> = {
    GENERAL: 'Genel',
    EMAIL: 'E-posta',
    SMS: 'SMS',
    INTEGRATION: 'Entegrasyon',
    OTHER: 'Diğer',
  };

  const filteredSettings = settings.filter(
    (s) => s.category === categories[tabValue],
  );

  if (!canView) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Alert severity="error">Bu sayfaya erişim yetkiniz bulunmamaktadır.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            <SettingsIcon sx={{ color: '#fff', fontSize: '1.75rem' }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Sistem Ayarları
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Sistem ayarlarını görüntüleyin ve yönetin
            </Typography>
          </Box>
        </Box>
      </Box>

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {categories.map((cat, index) => (
              <Tab key={index} label={categoryLabels[cat]} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            categories.map((cat, index) => (
              <TabPanel key={index} value={tabValue} index={index}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredSettings.map((setting) => (
                    <Card
                      key={setting.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        borderRadius: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {setting.key}
                          </Typography>
                          {setting.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {setting.description}
                            </Typography>
                          )}
                          <TextField
                            value={setting.value}
                            fullWidth
                            InputProps={{
                              readOnly: true,
                            }}
                            sx={{ mt: 1 }}
                          />
                        </Box>
                        {canManage && setting.isEditable && (
                          <Button
                            startIcon={<EditIcon />}
                            onClick={() => handleEdit(setting)}
                            sx={{ ml: 2 }}
                          >
                            Düzenle
                          </Button>
                        )}
                      </Box>
                    </Card>
                  ))}
                  {filteredSettings.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      Bu kategoride ayar bulunmamaktadır.
                    </Typography>
                  )}
                </Box>
              </TabPanel>
            ))
          )}
        </Box>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ayarı Düzenle</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {editingSetting && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {editingSetting.description || editingSetting.key}
              </Typography>
              <TextField
                label="Değer"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                fullWidth
                multiline={editValue.length > 50}
                rows={editValue.length > 50 ? 4 : 1}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            İptal
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettingsPage;

