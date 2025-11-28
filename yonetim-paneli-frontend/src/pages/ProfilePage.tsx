import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from "@mui/material";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) {
    return (
      <Typography>
        Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.
      </Typography>
    );
  }

  const handleSaveProfile = async () => {
    try {
      setProfileError(null);
      setProfileSuccess(null);
      setSavingProfile(true);

      const res = await api.patch("/auth/me/profile", { name });

      setProfileSuccess(res.data.message || "Profil güncellendi.");

      // Context içindeki kullanıcıyı güncelle
      setUser({
        ...user,
        name,
      });
    } catch (err: any) {
      console.error("Profil güncellenirken hata:", err);
      setProfileError(
        err?.response?.data?.message ||
          "Profil güncellenirken bir hata oluştu."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordError(null);
      setPasswordSuccess(null);

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setPasswordError("Lütfen tüm şifre alanlarını doldurun.");
        return;
      }

      if (newPassword !== confirmNewPassword) {
        setPasswordError("Yeni şifre ve tekrar şifre uyuşmuyor.");
        return;
      }

      setSavingPassword(true);

      const res = await api.patch("/auth/me/password", {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess(res.data.message || "Şifre başarıyla güncellendi.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Şifre değiştirilirken hata:", err);
      setPasswordError(
        err?.response?.data?.message ||
          "Şifre değiştirilirken bir hata oluştu."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h5" gutterBottom>
        Profilim
      </Typography>

      {/* Profil bilgileri */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profil Bilgileri
        </Typography>

        {profileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {profileError}
          </Alert>
        )}

        {profileSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {profileSuccess}
          </Alert>
        )}

        <TextField
          label="İsim"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={user.email}
          disabled
        />

        <TextField
          label="Rol"
          fullWidth
          margin="normal"
          value={user.role}
          disabled
        />

        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            Kaydet
          </Button>
        </Box>
      </Paper>

      <Divider />

      {/* Şifre değiştirme */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Şifre Değiştir
        </Typography>

        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {passwordError}
          </Alert>
        )}

        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {passwordSuccess}
          </Alert>
        )}

        <TextField
          label="Mevcut Şifre"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <TextField
          label="Yeni Şifre"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <TextField
          label="Yeni Şifre (Tekrar)"
          type="password"
          fullWidth
          margin="normal"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />

        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleChangePassword}
            disabled={savingPassword}
          >
            Şifreyi Güncelle
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
