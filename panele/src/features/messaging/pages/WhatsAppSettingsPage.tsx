import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  alpha,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import QrCodeDisplay from '../components/QrCodeDisplay';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import {
  useConnectionStatus,
  useDisconnectInstance,
} from '../hooks/useWhatsApp';

const WhatsAppSettingsPage: React.FC = () => {
  const { data: status } = useConnectionStatus();
  const disconnectMutation = useDisconnectInstance();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SettingsIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bağlantı Ayarları
            </Typography>
          </Box>
          <ConnectionStatusBadge />
        </Box>

        <QrCodeDisplay />

        {status?.connected && (
          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Bağlantıyı kesmek tüm aktif mesajlaşmayı durduracaktır. Yeniden
              bağlanmak için QR kodu tekrar taratmanız gerekecektir.
            </Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOffIcon />}
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending
                ? 'Bağlantı Kesiliyor...'
                : 'Bağlantıyı Kes'}
            </Button>
          </Box>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Nasıl Çalışır?
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[
            '"Bağlantıyı Başlat" butonuna tıklayın',
            'Ekranda QR kodu görünecek',
            'Telefonunuzda WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz Bağla yolunu izleyin ve QR kodu taratın',
            'Bağlantı kurulduktan sonra mesaj gönderebilir ve alabilirsiniz',
          ].map((text, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: alpha('#25D366', 0.1),
                  color: '#25D366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {index + 1}
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Toplu Mesaj İpuçları */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha('#ff9800', 0.3),
          background: alpha('#ff9800', 0.03),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <TipsAndUpdatesIcon sx={{ color: '#ff9800' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Toplu Mesaj Gönderimi Hakkında
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Mesajlarınızın sorunsuz iletilmesi için aşağıdaki önerilere dikkat
            edin:
          </Typography>
          {[
            'Yeni bağlanan numaralarla ilk hafta toplu mesaj göndermekten kaçının. Önce bireysel mesajlaşarak numaranızı ısıtın.',
            'Şablonlarda değişken kullanın ({{firstName}}, {{registrationNumber}} gibi). Her mesajın farklı olması daha sağlıklıdır.',
            'Toplu gönderimde mesajlar arası otomatik bekleme süresi uygulanır. Bu süre, mesajların güvenle iletilmesi için gereklidir.',
            'Üyelerinizden bu numarayı rehberlerine kaydetmelerini isteyin. Kayıtlı numaralara mesaj göndermek çok daha güvenlidir.',
          ].map((text, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: '#ff9800',
                  fontWeight: 700,
                  flexShrink: 0,
                  mt: 0.1,
                }}
              >
                •
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default WhatsAppSettingsPage;
