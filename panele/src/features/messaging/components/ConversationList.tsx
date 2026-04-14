import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  Typography,
  List,
  CircularProgress,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useConversations, useDeleteConversation } from '../hooks/useWhatsApp';
import ConversationItem from './ConversationItem';
import type { WhatsAppConversation } from '../types/whatsapp.types';
import { useToast } from '../../../shared/hooks/useToast';
import { getApiErrorMessage } from '../../../shared/utils/errorUtils';

interface ConversationListProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  onConversationDeleted?: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedId,
  onSelect,
  onConversationDeleted,
}) => {
  const [search, setSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<WhatsAppConversation | null>(null);
  const { data, isLoading } = useConversations({
    search: search || undefined,
  });
  const deleteConversation = useDeleteConversation();
  const toast = useToast();

  const openDeleteDialog = (conversation: WhatsAppConversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleteConversation.isPending) return;
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;
    try {
      await deleteConversation.mutateAsync(conversationToDelete.id);
      toast.success('Sohbet geçmişi silindi');
      onConversationDeleted?.(conversationToDelete.id);
      closeDeleteDialog();
    } catch (e: unknown) {
      toast.error(getApiErrorMessage(e, 'Sohbet silinirken bir hata oluştu'));
    }
  };

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
                onDelete={openDeleteDialog}
                deleting={deleteConversation.isPending && conversationToDelete?.id === conversation.id}
              />
            ))}
          </List>
        )}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Sohbeti Sil</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu sohbetin tum mesaj gecmisini kalici olarak silmek istiyor musunuz?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteConversation.isPending}>
            Vazgec
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeleteConversation}
            disabled={deleteConversation.isPending}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationList;
