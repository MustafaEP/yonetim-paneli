// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
} from '@mui/material';

import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MapIcon from '@mui/icons-material/Map';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { getDuesSummary, getDebtsReport } from '../../api/duesApi';
import type { DuesSummary, DuesDebtItem } from '../../types/dues';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const canViewSummary = hasPermission('DUES_REPORT_VIEW');
  const canViewDebts = hasPermission('DUES_DEBT_LIST_VIEW');

  const canCreateMemberApplication = hasPermission('MEMBER_CREATE_APPLICATION');
  const canAddDuesPayment = hasPermission('DUES_PAYMENT_ADD');
  const canManageRegions = hasPermission('BRANCH_MANAGE') || hasPermission('REGION_LIST');
  const canListUsers = hasPermission('USER_LIST');

  const [summary, setSummary] = useState<DuesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [debts, setDebts] = useState<DuesDebtItem[]>([]);
  const [debtsLoading, setDebtsLoading] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      if (!canViewSummary) return;
      setSummaryLoading(true);
      try {
        const data = await getDuesSummary();
        setSummary(data);
      } catch (e) {
        console.error('Dues summary alınırken hata:', e);
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [canViewSummary]);

  useEffect(() => {
    const loadDebts = async () => {
      if (!canViewDebts) return;
      setDebtsLoading(true);
      try {
        const data = await getDebtsReport();
        setDebts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Dues debts alınırken hata:', e);
        setDebts([]);
      } finally {
        setDebtsLoading(false);
      }
    };

    loadDebts();
  }, [canViewDebts]);

  const paidRate = useMemo(() => {
    if (!summary || summary.totalMembers === 0) return 0;
    return summary.paidMembers / summary.totalMembers;
  }, [summary]);

  const monthlyChartData = useMemo(() => {
    if (!summary) return [];
    const sorted = [...summary.byMonth].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
    return sorted;
  }, [summary]);

  if (!canViewSummary && !canViewDebts) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Typography color="text.secondary">
          Dashboard verilerini görmek için gerekli izinlere sahip değilsiniz.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* 🔹 Hızlı Aksiyon Kartları */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {canCreateMemberApplication && (
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => navigate('/members/applications')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonAddAlt1Icon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Üye Başvuruları</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Yeni üye başvurusu oluşturun veya bekleyen başvuruları yönetin.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {canAddDuesPayment && (
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => navigate('/dues/payments')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ReceiptLongIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Aidat Ödemeleri</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Üyeler için aidat ödemesi kaydedin ve ödeme geçmişini görüntüleyin.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {canManageRegions && (
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => navigate('/regions/provinces')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MapIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Bölge Yönetimi</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  İl, ilçe, işyeri ve bayileri yönetin; kullanıcı scope atamalarını yapın.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {canListUsers && (
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}
              onClick={() => navigate('/users')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ManageAccountsIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">Kullanıcı Yönetimi</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Panel kullanıcılarını, rollerini ve yetkilerini görüntüleyip güncelleyin.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 🔹 Özet & Grafik & Borçlular */}
      <Grid container spacing={2}>
        {/* Özet kartlar */}
        {canViewSummary && (
          <>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam Tahsilat
                  </Typography>
                  {summaryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {summary
                        ? `${summary.totalPayments.toLocaleString('tr-TR', {
                            maximumFractionDigits: 2,
                          })} ₺`
                        : '-'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam Üye
                  </Typography>
                  {summaryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      {summary ? summary.totalMembers : '-'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ödeme Yapan Üye
                  </Typography>
                  {summaryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : summary ? (
                    <>
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {summary.paidMembers}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        / {summary.totalMembers}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="h5" sx={{ mt: 1 }}>
                      -
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ödeme Oranı
                  </Typography>
                  {summaryLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="h5" sx={{ mt: 1 }}>
                        {summary
                          ? `% ${(paidRate * 100).toFixed(1)}`
                          : '-'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, paidRate * 100)}
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Aylık Tahsilat "graph" */}
        {canViewSummary && (
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Aylık Tahsilat
                </Typography>
                {summaryLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : monthlyChartData.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Gösterilecek aylık tahsilat verisi bulunamadı.
                  </Typography>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    {monthlyChartData.map((m) => {
                      const label = `${m.month.toString().padStart(2, '0')}.${m.year}`;
                      const maxTotal = Math.max(
                        ...monthlyChartData.map((x) => x.total),
                      );
                      const ratio =
                        maxTotal > 0 ? Math.round((m.total / maxTotal) * 100) : 0;

                      return (
                        <Box key={label} sx={{ mb: 1.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2">{label}</Typography>
                            <Typography variant="body2">
                              {m.total.toLocaleString('tr-TR', {
                                maximumFractionDigits: 2,
                              })}{' '}
                              ₺ ({m.count} ödeme)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={ratio}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* En çok borcu olan üyeler */}
        {canViewDebts && (
          <Grid item xs={12} md={canViewSummary ? 4 : 12}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  En Borçlu Üyeler
                </Typography>
                {debtsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : debts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Borçlu üye kaydı bulunamadı veya yetkili olduğunuz bölgede borçlu yok.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Üye</TableCell>
                        <TableCell>Son Ödeme</TableCell>
                        <TableCell align="right">Geciken Ay</TableCell>
                        <TableCell align="right">Toplam Borç</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {debts.slice(0, 5).map((d) => (
                        <TableRow key={d.memberId}>
                          <TableCell>
                            {d.member?.firstName && d.member?.lastName
                              ? `${d.member.firstName} ${d.member.lastName}`
                              : d.memberId || '-'}
                          </TableCell>
                          <TableCell>
                            {d.lastPaymentDate
                              ? new Date(d.lastPaymentDate).toLocaleDateString('tr-TR')
                              : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={d.monthsOverdue ?? 0}
                              color={
                                (d.monthsOverdue ?? 0) >= 6
                                  ? 'error'
                                  : (d.monthsOverdue ?? 0) >= 3
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            {d.totalDebt != null
                              ? `${d.totalDebt.toLocaleString('tr-TR', {
                                  maximumFractionDigits: 2,
                                })} ₺`
                              : '- ₺'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardPage;
