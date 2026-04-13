import React from 'react';
import { Box, Chip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useConnectionStatus } from '../hooks/useWhatsApp';

const ConnectionStatusBadge: React.FC = () => {
  const { data: status, isLoading } = useConnectionStatus();

  if (isLoading) {
    return (
      <Chip
        size="small"
        label="Kontrol ediliyor..."
        sx={{ fontSize: '0.75rem' }}
      />
    );
  }

  const connected = status?.connected ?? false;

  return (
    <Chip
      size="small"
      icon={
        <FiberManualRecordIcon
          sx={{
            fontSize: '0.7rem !important',
            color: connected ? '#4caf50 !important' : '#f44336 !important',
          }}
        />
      }
      label={connected ? 'Bağlı' : 'Bağlantı Yok'}
      sx={{
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: connected
          ? 'rgba(76, 175, 80, 0.08)'
          : 'rgba(244, 67, 54, 0.08)',
        color: connected ? '#2e7d32' : '#c62828',
        border: `1px solid ${connected ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
      }}
    />
  );
};

export default ConnectionStatusBadge;
