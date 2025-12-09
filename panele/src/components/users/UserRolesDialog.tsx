// src/components/users/UserRolesDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
} from '@mui/material';

import { type Role, ALL_ROLES, type UserDetail } from '../../types/user';

interface UserRolesDialogProps {
  open: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSave: (roles: Role[]) => Promise<void> | void;
}

const UserRolesDialog: React.FC<UserRolesDialogProps> = ({
  open,
  user,
  onClose,
  onSave,
}) => {
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles ?? []);
    } else {
      setSelectedRoles([]);
    }
  }, [user, open]);

  const toggleRole = (role: Role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSaveClick = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await onSave(selectedRoles);
      onClose();
    } catch (e) {
      console.error('Roller kaydedilirken hata:', e);
      window.alert('Roller kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Kullanıcı Rolleri</DialogTitle>
      <DialogContent dividers>
        {user ? (
          <>
            <Typography variant="subtitle1" gutterBottom>
              {user.firstName} {user.lastName} ({user.email})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Bu kullanıcıya atanacak rolleri seçin. Roller, kullanıcının sahip olduğu
              izinleri belirler (örneğin ADMIN her şeye erişebilir).
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormGroup>
                {ALL_ROLES.slice(0, Math.ceil(ALL_ROLES.length / 2)).map((r) => (
                  <FormControlLabel
                    key={r.value}
                    control={
                      <Checkbox
                        checked={selectedRoles.includes(r.value)}
                        onChange={() => toggleRole(r.value)}
                      />
                    }
                    label={r.label}
                  />
                ))}
              </FormGroup>
              <FormGroup>
                {ALL_ROLES.slice(Math.ceil(ALL_ROLES.length / 2)).map((r) => (
                  <FormControlLabel
                    key={r.value}
                    control={
                      <Checkbox
                        checked={selectedRoles.includes(r.value)}
                        onChange={() => toggleRole(r.value)}
                      />
                    }
                    label={r.label}
                  />
                ))}
              </FormGroup>
            </Box>
          </>
        ) : (
          <Typography>Yükleniyor...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          İptal
        </Button>
        <Button
          onClick={handleSaveClick}
          disabled={saving || !user}
          variant="contained"
        >
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserRolesDialog;
