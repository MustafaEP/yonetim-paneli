import React, { useState, useRef } from 'react';
import { Box, IconButton, TextField, alpha } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setMessage('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <TextField
        inputRef={inputRef}
        fullWidth
        multiline
        maxRows={4}
        size="small"
        placeholder="Mesajınızı yazın..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.3),
          },
        }}
      />
      <IconButton
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        sx={{
          backgroundColor: '#25D366',
          color: '#fff',
          '&:hover': { backgroundColor: '#128C7E' },
          '&.Mui-disabled': {
            backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.1),
            color: (theme) => theme.palette.action.disabled,
          },
          width: 40,
          height: 40,
        }}
      >
        <SendIcon sx={{ fontSize: 20 }} />
      </IconButton>
    </Box>
  );
};

export default MessageInput;
