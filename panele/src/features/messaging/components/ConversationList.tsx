import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  List,
  CircularProgress,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useConversations } from '../hooks/useWhatsApp';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  selectedId?: string;
  onSelect: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedId,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useConversations({
    search: search || undefined,
  });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Arama */}
      <Box sx={{ p: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Kişi veya mesaj ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.4),
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      {/* Konusma Listesi */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : !data?.data?.length ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {search ? 'Sonuç bulunamadı' : 'Henüz konuşma yok'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {data.data.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default ConversationList;
