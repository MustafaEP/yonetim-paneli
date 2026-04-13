import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  InputAdornment,
  Collapse,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import GroupsIcon from '@mui/icons-material/Groups';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useQuery } from '@tanstack/react-query';
import { useSendBulk } from '../hooks/useWhatsApp';
import { getMembers } from '../../members/services/membersApi';
import type { BulkSendResult } from '../types/whatsapp.types';
import type { MemberListItem, MemberStatus } from '../../../types/member';

const WhatsAppBulkPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<BulkSendResult | null>(null);
  const [failedOpen, setFailedOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const sendBulk = useSendBulk();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', statusFilter || undefined],
    queryFn: () => getMembers(statusFilter || undefined),
  });

  // Search filter (client-side)
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.phone?.includes(q) ||
        m.registrationNumber?.includes(q),
    );
  }, [members, searchQuery]);

  // Paginated members
  const paginatedMembers = useMemo(
    () =>
      filteredMembers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
      ),
    [filteredMembers, page, rowsPerPage],
  );

  const allVisibleSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.id));

  const handleToggleAll = () => {
    if (allVisibleSelected) {
      // Deselect all filtered
      const newSet = new Set(selectedIds);
      filteredMembers.forEach((m) => newSet.delete(m.id));
      setSelectedIds(newSet);
    } else {
      // Select all filtered
      const newSet = new Set(selectedIds);
      filteredMembers.forEach((m) => {
        if (m.phone) newSet.add(m.id);
      });
      setSelectedIds(newSet);
    }
  };

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleSend = () => {
    setConfirmOpen(false);
    setResult(null);

    const payload: { message: string; memberIds?: string[] } = { message };
    if (selectedIds.size > 0) {
      payload.memberIds = Array.from(selectedIds);
    }

    sendBulk.mutate(payload, {
      onSuccess: (data) => {
        setResult(data);
        if (data.failed > 0) {
          setFailedOpen(true);
        }
      },
    });
  };

  const canSend = message.trim() && selectedIds.size > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Sonuç */}
      {result && (
        <Alert
          severity={result.failed > 0 ? 'warning' : 'success'}
          onClose={() => setResult(null)}
          icon={
            result.failed > 0 ? (
              <ErrorOutlineIcon />
            ) : (
              <CheckCircleOutlineIcon />
            )
          }
        >
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Toplu mesaj gönderildi: {result.sent} başarılı, {result.failed}{' '}
              başarısız (toplam {result.total} üye)
            </Typography>
            {result.failedMembers && result.failedMembers.length > 0 && (
              <>
                <Button
                  size="small"
                  onClick={() => setFailedOpen(!failedOpen)}
                  endIcon={failedOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  sx={{ mt: 0.5, textTransform: 'none' }}
                >
                  Başarısız üyeleri {failedOpen ? 'gizle' : 'göster'} (
                  {result.failedMembers.length})
                </Button>
                <Collapse in={failedOpen}>
                  <TableContainer sx={{ mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Üye Adı
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Telefon
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Hata</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.failedMembers.map((fm) => (
                          <TableRow key={fm.memberId}>
                            <TableCell>{fm.name}</TableCell>
                            <TableCell>{fm.phone}</TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                color="error"
                              >
                                {fm.error}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </>
            )}
          </Box>
        </Alert>
      )}

      {/* Üye Seçimi */}
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
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <GroupsIcon sx={{ color: '#25D366' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Üye Seçimi
            </Typography>
            {selectedIds.size > 0 && (
              <Chip
                label={`${selectedIds.size} üye seçili`}
                color="success"
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        {/* Filtre satırı */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="İsim, telefon veya sicil no ile ara..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Üye Durumu</InputLabel>
            <Select
              value={statusFilter}
              label="Üye Durumu"
              onChange={(e) => {
                setStatusFilter(e.target.value as MemberStatus | '');
                setSelectedIds(new Set());
                setPage(0);
              }}
            >
              <MenuItem value="">Tümü</MenuItem>
              <MenuItem value="APPROVED">Onaylı</MenuItem>
              <MenuItem value="PENDING">Beklemede</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Üye tablosu */}
        {membersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredMembers.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}
          >
            Üye bulunamadı
          </Typography>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedIds.size > 0 && !allVisibleSelected
                        }
                        checked={allVisibleSelected}
                        onChange={handleToggleAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ad Soyad</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Telefon</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Şube</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedMembers.map((member) => {
                    const hasPhone = !!member.phone;
                    return (
                      <TableRow
                        key={member.id}
                        hover
                        onClick={() => hasPhone && handleToggle(member.id)}
                        sx={{
                          cursor: hasPhone ? 'pointer' : 'default',
                          opacity: hasPhone ? 1 : 0.5,
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.has(member.id)}
                            disabled={!hasPhone}
                          />
                        </TableCell>
                        <TableCell>
                          {member.firstName} {member.lastName}
                        </TableCell>
                        <TableCell>
                          {member.phone || (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Telefon yok
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.branch?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              member.status === 'APPROVED'
                                ? 'Onaylı'
                                : member.status === 'PENDING'
                                  ? 'Beklemede'
                                  : member.status === 'ACTIVE'
                                    ? 'Aktif'
                                    : member.status
                            }
                            size="small"
                            color={
                              member.status === 'APPROVED' || member.status === 'ACTIVE'
                                ? 'success'
                                : member.status === 'PENDING'
                                  ? 'warning'
                                  : 'default'
                            }
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={filteredMembers.length}
              page={page}
              onPageChange={(_e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Sayfa başına:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} / ${count}`
              }
            />
          </>
        )}
      </Paper>

      {/* Mesaj */}
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
          Mesaj İçeriği
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={5}
          placeholder="Üyelere gönderilecek mesajı yazın..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {selectedIds.size > 0
              ? `${selectedIds.size} üyeye gönderilecek`
              : 'Üye seçiniz'}
          </Typography>
          <Button
            variant="contained"
            startIcon={
              sendBulk.isPending ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            onClick={() => setConfirmOpen(true)}
            disabled={!canSend || sendBulk.isPending}
            sx={{
              backgroundColor: '#25D366',
              '&:hover': { backgroundColor: '#128C7E' },
            }}
          >
            {sendBulk.isPending ? 'Gönderiliyor...' : 'Toplu Gönder'}
          </Button>
        </Box>
      </Paper>

      {/* Onay Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Toplu Mesaj Gönderimi</DialogTitle>
        <DialogContent>
          <Typography>
            Bu mesaj <strong>{selectedIds.size} üyeye</strong> WhatsApp
            üzerinden gönderilecektir. Devam etmek istiyor musunuz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>İptal</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            sx={{
              backgroundColor: '#25D366',
              '&:hover': { backgroundColor: '#128C7E' },
            }}
          >
            Gönder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhatsAppBulkPage;
