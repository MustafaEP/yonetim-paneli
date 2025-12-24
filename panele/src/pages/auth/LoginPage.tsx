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
  useTheme,
  alpha,
  CircularProgress,
  Container,
  Avatar,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LoginIcon from '@mui/icons-material/Login';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getPublicSystemInfo } from '../../api/systemApi';
import { useDocumentHead } from '../../hooks/useDocumentHead';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const { isAuthenticated, login } = useAuth();
  
  const [siteName, setSiteName] = useState('Sendika Yönetim Paneli');
  const [siteLogoUrl, setSiteLogoUrl] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'email-admin' | 'email-genel' | 'email-bursa' | 'email-ankara' | 'email-bursa-mudanya' | 'email-ankara-cankaya' | null>(null);

  // Public sistem bilgilerini yükle
  useEffect(() => {
    const loadPublicInfo = async () => {
      try {
        const info = await getPublicSystemInfo();
        setSiteName(info.siteName);
        setSiteLogoUrl(info.siteLogoUrl);
      } catch (error) {
        console.error('Sistem bilgileri yüklenirken hata:', error);
        // Hata durumunda varsayılan değerler kullanılacak
      } finally {
        setLoadingInfo(false);
      }
    };

    loadPublicInfo();
  }, []);

  // Document title ve favicon'u güncelle
  useDocumentHead(
    loadingInfo ? undefined : `${siteName} | Giriş`,
    siteLogoUrl || undefined
  );

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
      await login({ email: email.trim(), password });

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        p: 2,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-50%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 70%)`,
          filter: 'blur(60px)',
        },
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            width: '100%',
            maxWidth: 480,
            mx: 'auto',
            borderRadius: 4,
            boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.1)}`,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {/* Logo & Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              {loadingInfo ? (
                <CircularProgress size={40} sx={{ mb: 3 }} />
              ) : (
                <>
                  {siteLogoUrl ? (
                    <Avatar
                      src={
                        siteLogoUrl.startsWith('http://') || siteLogoUrl.startsWith('https://')
                          ? siteLogoUrl
                          : `http://localhost:3000${siteLogoUrl}`
                      }
                      alt={siteName}
                      sx={{
                        width: 72,
                        height: 72,
                        mx: 'auto',
                        mb: 3,
                        boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.15)}`,
                        border: `3px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                      imgProps={{
                        onError: () => {
                          // Logo yüklenemezse varsayılan ikonu göster
                          setSiteLogoUrl('');
                        },
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                        boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
                        animation: 'pulse 2s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': {
                            transform: 'scale(1)',
                          },
                          '50%': {
                            transform: 'scale(1.05)',
                          },
                        },
                      }}
                    >
                      <SecurityIcon sx={{ fontSize: 36, color: 'white' }} />
                    </Box>
                  )}
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2rem' },
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {siteName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                      maxWidth: 360,
                      mx: 'auto',
                      lineHeight: 1.6,
                    }}
                  >
                    Yönetim paneline giriş yapmak için bilgilerinizi girin
                  </Typography>
                </>
              )}
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    fontSize: 22,
                  },
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              <TextField
                label="E-posta Adresi"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
                autoFocus
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  },
                }}
              />

              <TextField
                label="Şifre"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete="current-password"
                disabled={submitting}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        disabled={submitting}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        {showPassword ? (
                          <VisibilityOff sx={{ fontSize: 20 }} />
                        ) : (
                          <Visibility sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{
                  mt: 1,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 32px ${alpha(theme.palette.primary.main, 0.45)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  '&.Mui-disabled': {
                    background: alpha(theme.palette.action.disabledBackground, 0.5),
                    color: alpha(theme.palette.text.disabled, 0.5),
                  },
                }}
              >
                {submitting ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
            </Box>

            {/* Örnek Kullanıcı Bilgileri */}
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                position: 'relative',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <PersonIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.primary.main }}>
                  Örnek Kullanıcı Bilgileri
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Admin Kullanıcı */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    👑 Admin
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('admin@sendika.local');
                      setCopiedField('email-admin');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('admin@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        admin@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-admin' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>

                {/* Genel Başkan */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    🎖️ Genel Başkan
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('genel.baskan@sendika.local');
                      setCopiedField('email-genel');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('genel.baskan@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        genel.baskan@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-genel' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>

                {/* Bursa İl Başkanı */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    🏛️ Bursa İl Başkanı
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('bursa.il.baskani@sendika.local');
                      setCopiedField('email-bursa');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('bursa.il.baskani@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        bursa.il.baskani@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-bursa' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>

                {/* Ankara İl Başkanı */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    🏛️ Ankara İl Başkanı
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('ankara.il.baskani@sendika.local');
                      setCopiedField('email-ankara');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('ankara.il.baskani@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        ankara.il.baskani@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-ankara' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>

                {/* Bursa Mudanya İlçe Başkanı */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    📍 Bursa Mudanya İlçe Başkanı
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('bursa.mudanya.ilce.baskani@sendika.local');
                      setCopiedField('email-bursa-mudanya');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('bursa.mudanya.ilce.baskani@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        bursa.mudanya.ilce.baskani@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-bursa-mudanya' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>

                {/* Ankara Çankaya İlçe Başkanı */}
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                    📍 Ankara Çankaya İlçe Başkanı
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 1.5,
                      backgroundColor: alpha(theme.palette.common.white, 0.6),
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.8),
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText('ankara.cankaya.ilce.baskani@sendika.local');
                      setCopiedField('email-ankara-cankaya');
                      setTimeout(() => setCopiedField(null), 2000);
                      setEmail('ankara.cankaya.ilce.baskani@sendika.local');
                      setPassword('123456');
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <EmailIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        ankara.cankaya.ilce.baskani@sendika.local
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, ml: 0.5 }}>
                        / 123456
                      </Typography>
                    </Box>
                    {copiedField === 'email-ankara-cankaya' ? (
                      <CheckIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                    )}
                  </Box>
                </Box>
              </Box>

              <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: theme.palette.text.secondary, fontSize: '0.75rem' }}>
                💡 Tıklayarak bilgileri kopyalayabilir ve otomatik doldurulmasını sağlayabilirsiniz
              </Typography>
            </Box>

            {/* Demo/Test Verisi Bildirimi */}
            <Alert
              severity="info"
              icon={<InfoIcon />}
              sx={{
                mt: 3,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.info.main, 0.08),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                '& .MuiAlert-icon': {
                  fontSize: 20,
                  color: theme.palette.info.main,
                },
                '& .MuiAlert-message': {
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  color: theme.palette.text.primary,
                },
              }}
            >
              <Typography variant="body2" component="div" sx={{ fontWeight: 500, mb: 0.5 }}>
                Demo/Test Sistemi
              </Typography>
              <Typography variant="body2" component="div" sx={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Bu sistemde yer alan kamu kurum/kuruluşlar, isim, soyisim ve diğer tüm bilgiler test amaçlıdır ve gerçek kişi veya kurumları temsil etmemektedir.
              </Typography>
            </Alert>

            {/* Footer */}
            <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '0.8rem',
                }}
              >
                © {new Date().getFullYear()} {siteName}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  mt: 0.5,
                }}
              >
                Tüm hakları saklıdır
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Alt Bilgi */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: alpha(theme.palette.text.primary, 0.7),
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            <SecurityIcon sx={{ fontSize: 16 }} />
            Güvenli bağlantı ile korunmaktadır
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;