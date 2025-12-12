// src/pages/dues/DuesMonthlyReportPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  LinearProgress,
  Stack,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { getMonthlyPaymentsReport } from '../../api/duesApi';
import type { DuesByMonthItem } from '../../types/dues';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const DuesMonthlyReportPage: React.FC = () => {
  const theme = useTheme();
  const [data, setData] = useState<DuesByMonthItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getMonthlyPaymentsReport();
        setData(result);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Veri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);
  const maxTotal = data.length > 0 ? Math.max(...data.map((x) => x.total)) : 0;

  const monthNames = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];

  // Yılları çıkar
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map((item) => item.year))).sort((a, b) => b - a);
    return years;
  }, [data]);

  // Seçili yıla göre filtrelenmiş veri
  const filteredData = useMemo(() => {
    if (selectedYear === 'all') {
      return data;
    }
    return data.filter((item) => item.year === selectedYear);
  }, [data, selectedYear]);

  // Chart için veri hazırlama - yıllara göre grupla
  const chartDataByYear = useMemo(() => {
    // Tüm veriyi kullan (filtrelenmiş değil, çünkü yıl seçimi zaten filtrelenmiş veriyi etkiliyor)
    const groupedByYear: Record<number, DuesByMonthItem[]> = {};
    
    data.forEach((item) => {
      if (!groupedByYear[item.year]) {
        groupedByYear[item.year] = [];
      }
      groupedByYear[item.year].push(item);
    });

    // Her yıl için 12 ayı doldur (eksik aylar 0 ile)
    const result: Record<number, Array<{ month: string; total: number; count: number }>> = {};
    
    Object.keys(groupedByYear).forEach((yearStr) => {
      const year = parseInt(yearStr, 10);
      const yearData = groupedByYear[year];
      const chartData = [];
      
      for (let month = 1; month <= 12; month++) {
        const existingData = yearData.find((d) => d.month === month);
        chartData.push({
          month: monthNames[month - 1],
          total: existingData ? existingData.total : 0,
          count: existingData ? existingData.count : 0,
        });
      }
      
      result[year] = chartData;
    });
    
    return result;
  }, [data, monthNames]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            mb: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Aylık Tahsilat Raporu
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
          Tüm zamanlar için aylık tahsilat özeti
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      ) : data.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Henüz tahsilat verisi bulunmamaktadır
          </Typography>
        </Card>
      ) : (
        <>
          {/* Özet Kartları */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                borderRadius: 3,
                p: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  }}
                >
                  <AttachMoneyIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                    Toplam Tahsilat
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {totalAmount.toLocaleString('tr-TR', {
                      style: 'currency',
                      currency: 'TRY',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                borderRadius: 3,
                p: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(theme.palette.success.main, 0.8)} 100%)`,
                  }}
                >
                  <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                    Toplam Ödeme Sayısı
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {totalCount.toLocaleString('tr-TR')}
                  </Typography>
                </Box>
              </Stack>
            </Card>

            <Card
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(33.333% - 11px)' },
                borderRadius: 3,
                p: 2.5,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(theme.palette.info.main, 0.8)} 100%)`,
                  }}
                >
                  <CalendarTodayIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                    Toplam Ay Sayısı
                  </Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    {data.length}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Box>

          {/* Chart Bölümü */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                  Yıllık Aylık Tahsilat Grafiği
                </Typography>
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                  <InputLabel>Yıl Seç</InputLabel>
                  <Select
                    value={selectedYear}
                    label="Yıl Seç"
                    onChange={(e) => setSelectedYear(e.target.value as number | 'all')}
                  >
                    <MenuItem value="all">Tüm Yıllar</MenuItem>
                    {availableYears.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Divider sx={{ mb: 3 }} />
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
              {selectedYear === 'all' ? (
                // Tüm yıllar için her yıl ayrı chart
                <Stack spacing={4}>
                  {availableYears.map((year) => {
                    const yearChartData = chartDataByYear[year];
                    if (!yearChartData || yearChartData.length === 0) return null;
                    
                    return (
                      <Box key={year}>
                        <Typography variant="h6" fontWeight={600} sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.15rem' } }}>
                          {year} Yılı
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={yearChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                `${value.toLocaleString('tr-TR', {
                                  style: 'currency',
                                  currency: 'TRY',
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`,
                                'Tahsilat',
                              ]}
                              contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                borderRadius: 2,
                              }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="total" 
                              fill={theme.palette.primary.main}
                              name="Tahsilat (₺)"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                // Seçili yıl için tek chart
                (() => {
                  const yearChartData = chartDataByYear[selectedYear];
                  if (!yearChartData || yearChartData.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          {selectedYear} yılı için veri bulunamadı
                        </Typography>
                      </Box>
                    );
                  }
                  
                  return (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={yearChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            'Tahsilat',
                          ]}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            borderRadius: 2,
                          }}
                        />
                        <Legend />
                        <Bar 
                          dataKey="total" 
                          fill={theme.palette.primary.main}
                          name="Tahsilat (₺)"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()
              )}
            </Box>
          </Card>

          {/* Detaylı Tablo */}
          <Card sx={{ borderRadius: 3 }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, mb: 2 }}>
                Aylık Detay
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      '& th': {
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      },
                    }}
                  >
                    <TableCell>Ay</TableCell>
                    <TableCell align="right">Ödeme Sayısı</TableCell>
                    <TableCell align="right">Tahsilat</TableCell>
                    <TableCell align="right" sx={{ width: { xs: 100, sm: 150 } }}>
                      Oran
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((item) => {
                    const monthName = monthNames[item.month - 1];
                    const label = `${monthName} ${item.year}`;
                    const ratio = maxTotal > 0 ? Math.round((item.total / maxTotal) * 100) : 0;

                    return (
                      <TableRow
                        key={`${item.year}-${item.month}`}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {label}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={item.count}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} color="primary">
                            {item.total.toLocaleString('tr-TR', {
                              style: 'currency',
                              currency: 'TRY',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={ratio}
                              sx={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                },
                              }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 35, textAlign: 'right' }}>
                              %{ratio}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Grafik Görünümü */}
          <Card sx={{ borderRadius: 3, mt: 3 }}>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.15rem' }, mb: 2 }}>
                Görsel Özet
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
              {filteredData.map((item) => {
                const monthName = monthNames[item.month - 1];
                const label = `${monthName} ${item.year}`;
                const ratio = maxTotal > 0 ? Math.round((item.total / maxTotal) * 100) : 0;

                return (
                  <Box key={`${item.year}-${item.month}`} sx={{ mb: { xs: 2, sm: 2.5 } }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      sx={{ mb: 1, gap: { xs: 0.5, sm: 0 } }}
                    >
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                        {label}
                      </Typography>
                      <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
                        <Chip
                          label={`${item.count} ödeme`}
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                        <Typography variant="body2" fontWeight={600} color="primary" sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}>
                          {item.total.toLocaleString('tr-TR', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          ₺
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={ratio}
                      sx={{
                        height: { xs: 8, sm: 10 },
                        borderRadius: 5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
};

export default DuesMonthlyReportPage;

