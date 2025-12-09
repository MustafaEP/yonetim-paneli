// src/components/users/UserPermissionsSection.tsx
import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
} from '@mui/material';

interface Props {
  permissions?: string[] | null;
}

interface GroupedPerms {
  label: string;
  items: string[];
  color?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning';
}

/**
 * Permission key → Türkçe kısa label eşlemesi
 * İstersen burayı zamanla genişletebilirsin.
 */
const PERMISSION_LABEL_MAP: Record<string, string> = {
  USER_LIST: 'Kullanıcı Listele',
  USER_VIEW: 'Kullanıcı Görüntüle',
  USER_CREATE: 'Kullanıcı Oluştur',
  USER_UPDATE: 'Kullanıcı Güncelle',
  USER_SOFT_DELETE: 'Kullanıcı Sil (Soft)',
  USER_ASSIGN_ROLE: 'Rol Atama',

  MEMBER_LIST: 'Üye Listele',
  MEMBER_VIEW: 'Üye Görüntüle',
  MEMBER_CREATE_APPLICATION: 'Üye Başvurusu Oluştur',
  MEMBER_APPROVE: 'Başvuru Onayla',
  MEMBER_REJECT: 'Başvuru Reddet',
  MEMBER_UPDATE: 'Üye Güncelle',
  MEMBER_STATUS_CHANGE: 'Üye Durum Değiştir',

  DUES_PLAN_MANAGE: 'Aidat Planı Yönetimi',
  DUES_PAYMENT_ADD: 'Aidat Ödemesi Ekle',
  DUES_REPORT_VIEW: 'Aidat Raporu Görüntüle',
  DUES_DEBT_LIST_VIEW: 'Borçlu Üye Listesi',
  DUES_EXPORT: 'Aidat Verisi Dışa Aktar',

  REGION_LIST: 'Bölgeleri Listele',
  BRANCH_MANAGE: 'Şube/İl/İlçe Yönetimi',

  WORKPLACE_LIST: 'İşyeri Listele',
  WORKPLACE_MANAGE: 'İşyeri Yönetimi',

  DEALER_LIST: 'Bayi Listele',
  DEALER_CREATE: 'Bayi Oluştur',
  DEALER_UPDATE: 'Bayi Güncelle',
};

const getLabelForPermission = (perm: string) =>
  PERMISSION_LABEL_MAP[perm] ?? perm;

/**
 * Permission'ları mantıksal gruplara ayır
 */
const groupPermissions = (permissions: string[]): GroupedPerms[] => {
  const groups: GroupedPerms[] = [
    { label: 'Kullanıcı Yönetimi', items: [], color: 'primary' },
    { label: 'Üye Yönetimi', items: [], color: 'success' },
    { label: 'Aidat Yönetimi', items: [], color: 'warning' },
    { label: 'Bölge / Şube Yönetimi', items: [], color: 'info' },
    { label: 'Diğer', items: [], color: 'default' },
  ];

  for (const perm of permissions) {
    if (perm.startsWith('USER_')) {
      groups[0].items.push(perm);
    } else if (perm.startsWith('MEMBER_')) {
      groups[1].items.push(perm);
    } else if (perm.startsWith('DUES_')) {
      groups[2].items.push(perm);
    } else if (
      perm.startsWith('REGION_') ||
      perm.startsWith('BRANCH_') ||
      perm.startsWith('WORKPLACE_') ||
      perm.startsWith('DEALER_')
    ) {
      groups[3].items.push(perm);
    } else {
      groups[4].items.push(perm);
    }
  }

  // Boş grupları gösterme
  return groups.filter((g) => g.items.length > 0);
};

const UserPermissionsSection: React.FC<Props> = ({ permissions }) => {
  const normalized = Array.isArray(permissions) ? permissions : [];

  if (normalized.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">İzinler</Typography>
        <Typography variant="body2" color="text.secondary">
          Bu kullanıcıya ait detaylı izin bilgisi bulunmuyor. İzinler genellikle
          roller üzerinden dolaylı olarak gelir.
        </Typography>
      </Box>
    );
  }

  const groups = groupPermissions(normalized);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        İzinler
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Bu liste, kullanıcının sahip olduğu detaylı yetkileri gösterir.
        İzinler, roller üzerinden hesaplanmış olabilir.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groups.map((group, idx) => (
          <Box key={group.label}>
            {idx > 0 && <Divider sx={{ my: 1 }} />}
            <Typography
              variant="subtitle2"
              sx={{ mb: 0.5 }}
              color="text.secondary"
            >
              {group.label}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {group.items.map((perm) => (
                <Chip
                  key={perm}
                  label={getLabelForPermission(perm)}
                  size="small"
                  color={group.color}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserPermissionsSection;
