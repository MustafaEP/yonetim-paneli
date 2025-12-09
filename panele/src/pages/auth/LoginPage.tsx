// src/pages/auth/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, login } = useAuth(); 
  // Not: Eğer AuthContext içinde login imzası farklıysa (ör. login({ email, password })),
  // aşağıdaki handleSubmit içini ona göre uyarlarsın.

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zaten login olmuşsa dashboard'a at
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('E-posta ve şifre zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      // 🔹 Burada AuthContext login fonksiyonunu çağırıyoruz.
      await login({ email: email.trim(), password }); 

      // Eğer login başarılıysa, geldiğin sayfanın "redirectFrom" state'i varsa oraya,
      // yoksa dashboard'a yönlendir
      const state = location.state as { from?: string } | undefined;
      if (state?.from) {
        navigate(state.from, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err?.response?.data?.message ??
          'Giriş işlemi sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? 'background.default' : '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h5" component="h1" gutterBottom>
              Sendika Yönetim Paneli
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sisteme giriş yapmak için e-posta ve şifrenizi kullanın.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Şifre"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 1 }}
              disabled={submitting}
            >
              {submitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              @ {new Date().getFullYear()} Sendika Yönetim Sistemi
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
