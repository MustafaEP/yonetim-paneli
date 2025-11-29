import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, TextField, Button, Alert, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import api from "../api/client";

const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    app_name: "",
    theme: "",
    default_page_limit: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get("/config");
      setForm(res.data);
    } catch {
      setError("Ayarlar alınırken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await api.patch("/config", form);

      setSuccess("Ayarlar güncellendi!");
    } catch {
      setError("Ayarlar güncellenirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5">Sistem Ayarları</Typography>

      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label="Uygulama Adı"
          fullWidth
          sx={{ mt: 2 }}
          value={form.app_name}
          onChange={(e) => setForm({ ...form, app_name: e.target.value })}
        />

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Tema Modu</InputLabel>
          <Select
            value={form.theme}
            label="Tema Modu"
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
          >
            <MenuItem value="light">Açık</MenuItem>
            <MenuItem value="dark">Koyu</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Varsayılan Sayfa Limit"
          type="number"
          fullWidth
          sx={{ mt: 2 }}
          value={form.default_page_limit}
          onChange={(e) => setForm({ ...form, default_page_limit: e.target.value })}
        />

        <Box sx={{ mt: 3, textAlign: "right" }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            Kaydet
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SystemConfigPage;
