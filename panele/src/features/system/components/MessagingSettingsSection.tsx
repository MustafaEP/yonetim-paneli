import React from 'react';
import { Box } from '@mui/material';
import WhatsAppMessagingSettings from './WhatsAppMessagingSettings';
import SmsMessagingSettings from './SmsMessagingSettings';
import EmailMessagingSettings from './EmailMessagingSettings';

const MessagingSettingsSection: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <WhatsAppMessagingSettings />
      <SmsMessagingSettings />
      <EmailMessagingSettings />
    </Box>
  );
};

export default MessagingSettingsSection;
