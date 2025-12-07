// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';

import type { DuesSummary } from '../../types/dues';
import { getDuesSummary } from '../../api/duesApi';
import { useAuth } from '../../context/AuthContext';

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      try {
        const data = await getDuesSummary();
        setSummary(data);
      } catch (e) {
        console.error('Dues summary alınırken hata:', e);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <Typography color="text.secondary">
          Özet veriler yüklenirken bir hata oluştu.
        </Typography>
      </Box>
    );
  }

  const paymentPerMember =
    summary.totalMembers > 0
      ? summary.totalPayments / summary.totalMembers
      : 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Merhaba{user ? `, ${user.firstName}` : ''} 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sendika yönetim paneli genel özetini aşağıda görebilirsiniz.
        </Typography>
      </Box>

      {/* KPI kartları */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Toplam Ödeme
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {summary.totalPayments.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                })}{' '}
                TL
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Tüm yetki alanlarınızda yapılan toplam aidat ödemesi.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Toplam Üye
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {summary.totalMembers.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Yetki alanınızda kayıtlı toplam üye sayısı.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Ödeme Yapan Üye
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {summary.paidMembers.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                En az bir aidat ödemesi yapmış üyeler.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Ödemesi Eksik Üye
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {summary.unpaidMembers.toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Son rapor kriterine göre borçlu/ödemesi olmayan üyeler.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Ortalama ödeme kartı */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Üye Başına Ortalama Ödeme
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {paymentPerMember.toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                })}{' '}
                TL
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Toplam ödeme / toplam üye.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Aylık özet tablosu */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Aylık Aidat Ödeme Özeti
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Yetki alanınızdaki üyelerin aylara göre ödeme tutarları ve ödeme sayıları.
          </Typography>

          {summary.byMonth.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Henüz özetlenecek ödeme kaydı bulunmuyor.
            </Typography>
          ) : (
            <Paper sx={{ width: '100%', overflowX: 'auto', mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dönem</TableCell>
                    <TableCell align="right">Toplam Tutar (TL)</TableCell>
                    <TableCell align="right">Ödeme Sayısı</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.byMonth
                    .slice() // kopya
                    .sort((a, b) => {
                      if (a.year !== b.year) return a.year - b.year;
                      return a.month - b.month;
                    })
                    .map((m) => {
                      const label = `${m.month.toString().padStart(2, '0')}/${m.year}`;
                      return (
                        <TableRow key={`${m.year}-${m.month}`}>
                          <TableCell>{label}</TableCell>
                          <TableCell align="right">
                            {m.total.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell align="right">
                            {m.count.toLocaleString('tr-TR')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DashboardPage;
