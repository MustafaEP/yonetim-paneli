import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import {
  useConnectionStatus,
  useConnectInstance,
} from '../hooks/useWhatsApp';

const QrCodeDisplay: React.FC = () => {
  const {
    data: status,
    isLoading: statusLoading,
    isError: statusError,
  } = useConnectionStatus();
  const connectMutation = useConnectInstance();

  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connected = status?.connected ?? false;

  const handleConnect = () => {
    setError(null);
    connectMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.qr?.base64) {
          setQrBase64(data.qr.base64);
        } else {
          setError(
            'QR kodu henüz hazır değil. Birkaç saniye bekleyip tekrar deneyin.',
          );
        }
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Bağlantı başlatılamadı';
        setError(msg);
      },
    });
  };

  if (statusLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (connected) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
          border: '1px solid rgba(76, 175, 80, 0.3)',
          backgroundColor: 'rgba(76, 175, 80, 0.04)',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
          WhatsApp Bağlı
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          WhatsApp hesabınız başarıyla bağlı. Mesaj gönderebilir ve
          alabilirsiniz.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        textAlign: 'center',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <WhatsAppIcon sx={{ fontSize: 48, color: '#25D366', mb: 2 }} />
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
        WhatsApp'a Bağlan
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', mb: 3, maxWidth: 440, mx: 'auto' }}
      >
        QR kodu taratarak bu paneli WhatsApp hesabınıza bağlayın.
      </Typography>

      {error && (
        <Alert
          severity="warning"
          sx={{ mb: 2, textAlign: 'left' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {statusError && (
        <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
          WAHA servisine bağlanılamadı. Docker container'ın çalıştığından emin
          olun.
        </Alert>
      )}

      {qrBase64 ? (
        <Box>
          <Box
            sx={{
              display: 'inline-block',
              p: 2,
              borderRadius: 2,
              backgroundColor: '#fff',
              border: '1px solid',
              borderColor: 'divider',
              mb: 2,
            }}
          >
            <img
              src={qrBase64}
              alt="WhatsApp QR Code"
              style={{ width: 260, height: 260, display: 'block' }}
            />
          </Box>
          <Typography
            variant="caption"
            display="block"
            sx={{ color: 'text.secondary', mb: 2 }}
          >
            WhatsApp &gt; Ayarlar &gt; Bağlı Cihazlar &gt; Cihaz Bağla
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleConnect}
            disabled={connectMutation.isPending}
          >
            QR Kodu Yenile
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          startIcon={
            connectMutation.isPending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <QrCode2Icon />
            )
          }
          onClick={handleConnect}
          disabled={connectMutation.isPending}
          sx={{
            backgroundColor: '#25D366',
            '&:hover': { backgroundColor: '#128C7E' },
          }}
        >
          {connectMutation.isPending ? 'Bağlanıyor...' : 'Bağlantıyı Başlat'}
        </Button>
      )}
    </Paper>
  );
};

export default QrCodeDisplay;
