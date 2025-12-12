// src/pages/members/MemberDetailPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

import type { MemberDetail } from '../../types/member';
import { getMemberById, approveMember, rejectMember, updateMemberDuesPlan, cancelMember } from '../../api/membersApi';

import type { MemberPaymentRow, DuesDebtRow, DuesPlanRow } from '../../types/dues';
import {
  getMemberPayments,
  addDuesPayment,
  getMemberDebt,
  getMemberMonthlyDebts,
  getDuesPlans,
  type MonthlyDebtStatus,
} from '../../api/duesApi';

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { hasPermission } = useAuth();
  const toast = useToast();
  const canAddPayment = hasPermission('DUES_PAYMENT_ADD');
  const canApprove = hasPermission('MEMBER_APPROVE');
  const canReject = hasPermission('MEMBER_REJECT');
  const canChangeDuesPlan = hasPermission('MEMBER_STATUS_CHANGE');
  const canCancelMembership = hasPermission('MEMBER_STATUS_CHANGE');

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);

  const [payments, setPayments] = useState<MemberPaymentRow[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  const [memberDebt, setMemberDebt] = useState<DuesDebtRow | null>(null);
  const [loadingDebt, setLoadingDebt] = useState(true);

  const [monthlyDebts, setMonthlyDebts] = useState<MonthlyDebtStatus | null>(null);
  const [loadingMonthlyDebts, setLoadingMonthlyDebts] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    amount: string;
    note: string;
  }>({
    amount: '',
    note: '',
  });

  const [processingStatus, setProcessingStatus] = useState(false);

  const [duesPlanDialogOpen, setDuesPlanDialogOpen] = useState(false);
  const [duesPlanSaving, setDuesPlanSaving] = useState(false);
  const [duesPlans, setDuesPlans] = useState<DuesPlanRow[]>([]);
  const [selectedDuesPlanId, setSelectedDuesPlanId] = useState<string>('');

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelForm, setCancelForm] = useState<{
    reason: string;
    status: 'RESIGNED' | 'EXPELLED' | 'INACTIVE';
  }>({
    reason: '',
    status: 'RESIGNED',
  });

  // 🔹 Aidat planlarını yükle
  useEffect(() => {
    const loadDuesPlans = async () => {
      try {
        const data = await getDuesPlans(false); // Sadece aktif planları getir
        setDuesPlans(data);
      } catch (e) {
        console.error('Aidat planları alınırken hata:', e);
      }
    };
    loadDuesPlans();
  }, []);

  // 🔹 Üye bilgisi
  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      setLoadingMember(true);
      try {
        const data = await getMemberById(id);
        setMember(data);
        setSelectedDuesPlanId(data.duesPlan?.id || '');
      } catch (e) {
        console.error('Üye detay alınırken hata:', e);
      } finally {
        setLoadingMember(false);
      }
    };

    fetchMember();
  }, [id]);

  // 🔹 Üye ödemeleri
  const loadPayments = async () => {
    if (!id) return;
    setLoadingPayments(true);
    try {
      const data = await getMemberPayments(id);
      console.log('[MemberDetailPage] Payments loaded:', data);
      if (Array.isArray(data) && data.length > 0) {
        console.log('[MemberDetailPage] First payment:', data[0]);
        console.log('[MemberDetailPage] First payment appliedMonths:', data[0]?.appliedMonths);
      }
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Üye ödemeleri alınırken hata:', e);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 🔹 Üye borç bilgisi
  const loadDebt = async () => {
    if (!id) return;
    setLoadingDebt(true);
    try {
      const data = await getMemberDebt(id);
      setMemberDebt(data);
    } catch (e) {
      console.error('Üye borç bilgisi alınırken hata:', e);
      setMemberDebt(null);
    } finally {
      setLoadingDebt(false);
    }
  };

  useEffect(() => {
    loadDebt();
  }, [id]);

  // 🔹 Üye aylık borç durumu
  const loadMonthlyDebts = async () => {
    if (!id || !member || member.status !== 'ACTIVE' || !member.duesPlan) {
      setMonthlyDebts(null);
      setLoadingMonthlyDebts(false);
      return;
    }
    setLoadingMonthlyDebts(true);
    try {
      const data = await getMemberMonthlyDebts(id, selectedYear);
      setMonthlyDebts(data);
    } catch (e) {
      console.error('Aylık borç durumu alınırken hata:', e);
      setMonthlyDebts(null);
    } finally {
      setLoadingMonthlyDebts(false);
    }
  };

  useEffect(() => {
    if (member && member.status === 'ACTIVE' && member.duesPlan) {
      loadMonthlyDebts();
    }
  }, [id, member, selectedYear]);


  // 🔹 Form değişimi
  const handlePaymentFormChange = (
    field: keyof typeof paymentForm,
    value: string,
  ) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openPaymentDialog = () => {
    setPaymentDialogOpen(true);
    setPaymentSaving(false);
    // Formu temizle - sadece tutar ve not alanları
    setPaymentForm({
      amount: '',
      note: '',
    });
  };

  const closePaymentDialog = () => {
    if (paymentSaving) return;
    setPaymentDialogOpen(false);
  };

  const handlePaymentSave = async () => {
    if (!id) return;

    // Reddedilmiş üyeler için ödeme yapılamaz
    if (member?.status === 'REJECTED') {
      toast.showError('Reddedilmiş üyeler için aidat ödemesi yapılamaz.');
      return;
    }

    // Üyenin planı olmalı
    if (!member?.duesPlan) {
      toast.showError('Üyenin aktif bir aidat planı yok.');
      return;
    }

    const amountNum = Number(paymentForm.amount.replace(',', '.'));
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      toast.showError('Geçerli bir tutar giriniz.');
      return;
    }

    setPaymentSaving(true);
    try {
      // Plan ID göndermiyoruz - backend üyeden otomatik alacak
      // periodYear ve periodMonth göndermiyoruz - FIFO mantığı ile en eski borçlu aylara uygulanacak
      await addDuesPayment({
        memberId: id,
        planId: undefined, // Backend üyeden otomatik alacak
        amount: amountNum,
        periodYear: undefined, // FIFO mantığı ile uygulanacak
        periodMonth: undefined, // FIFO mantığı ile uygulanacak
        note: paymentForm.note || undefined,
      });

      await loadPayments();
      await loadDebt(); // Borç bilgisini yenile
      await loadMonthlyDebts(); // Aylık borç durumunu yenile
      setPaymentDialogOpen(false);
      toast.showSuccess('Ödeme başarıyla eklendi.');
    } catch (e: any) {
      console.error('Ödeme eklenirken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Ödeme eklenirken bir hata oluştu.';
      toast.showError(errorMessage);
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleApproveMember = async () => {
    if (!id || !canApprove) return;
    if (!window.confirm('Bu üye başvurusunu onaylamak istediğinize emin misiniz?')) return;

    setProcessingStatus(true);
    try {
      await approveMember(id);
      const updated = await getMemberById(id);
      setMember(updated);
      toast.showSuccess('Üye başarıyla onaylandı.');
    } catch (e) {
      console.error('Üye onaylanırken hata:', e);
      toast.showError('Üye onaylanırken bir hata oluştu.');
    } finally {
      setProcessingStatus(false);
    }
  };

  const handleRejectMember = async () => {
    if (!id || !canReject) return;
    if (!window.confirm('Bu üye başvurusunu reddetmek istediğinize emin misiniz?')) return;

    setProcessingStatus(true);
    try {
      await rejectMember(id);
      const updated = await getMemberById(id);
      setMember(updated);
      toast.showSuccess('Üye başarıyla reddedildi.');
    } catch (e) {
      console.error('Üye reddedilirken hata:', e);
      toast.showError('Üye reddedilirken bir hata oluştu.');
    } finally {
      setProcessingStatus(false);
    }
  };

  const openDuesPlanDialog = () => {
    setDuesPlanDialogOpen(true);
    setSelectedDuesPlanId(member?.duesPlan?.id || '');
  };

  const closeDuesPlanDialog = () => {
    if (duesPlanSaving) return;
    setDuesPlanDialogOpen(false);
  };

  const handleDuesPlanSave = async () => {
    if (!id || !canChangeDuesPlan) return;
    if (!selectedDuesPlanId) {
      toast.showWarning('Lütfen bir aidat planı seçiniz.');
      return;
    }

    setDuesPlanSaving(true);
    try {
      const updated = await updateMemberDuesPlan(id, selectedDuesPlanId);
      setMember(updated);
      await loadDebt(); // Borç bilgisini yenile
      await loadMonthlyDebts(); // Aylık borç durumunu yenile
      setDuesPlanDialogOpen(false);
      toast.showSuccess('Aidat planı başarıyla güncellendi.');
    } catch (e: any) {
      console.error('Aidat planı güncellenirken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Aidat planı güncellenirken bir hata oluştu.';
      toast.showError(errorMessage);
    } finally {
      setDuesPlanSaving(false);
    }
  };

  const openCancelDialog = () => {
    setCancelDialogOpen(true);
    setCancelForm({
      reason: '',
      status: 'RESIGNED',
    });
  };

  const closeCancelDialog = () => {
    if (cancelSaving) return;
    setCancelDialogOpen(false);
  };

  const handleCancelSave = async () => {
    if (!id || !canCancelMembership) return;
    if (!cancelForm.reason.trim()) {
      toast.showWarning('Lütfen iptal nedeni giriniz.');
      return;
    }

    setCancelSaving(true);
    try {
      const updated = await cancelMember(id, cancelForm.reason, cancelForm.status);
      setMember(updated);
      await loadDebt(); // Borç bilgisini yenile
      await loadMonthlyDebts(); // Aylık borç durumunu yenile
      setCancelDialogOpen(false);
      toast.showSuccess('Üyelik başarıyla iptal edildi.');
    } catch (e: any) {
      console.error('Üyelik iptal edilirken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Üyelik iptal edilirken bir hata oluştu.';
      toast.showError(errorMessage);
    } finally {
      setCancelSaving(false);
    }
  };

  if (loadingMember) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return <Typography>Üye bulunamadı.</Typography>;
  }

  const fullName = `${member.firstName} ${member.lastName}`;

  const formatPeriod = (p: MemberPaymentRow) => {
    // Debug log
    console.log('[formatPeriod] Payment:', p.id, 'appliedMonths:', p.appliedMonths, 'excessAmount:', p.excessAmount, 'periodYear:', p.periodYear, 'periodMonth:', p.periodMonth);
    
    const monthNames = [
      'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
      'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
    ];
    
    // Eğer belirli bir ay/yıl seçilmişse, onu göster
    if (p.periodYear && p.periodMonth) {
      const monthName = monthNames[p.periodMonth - 1] || p.periodMonth.toString();
      return `${monthName} ${p.periodYear}`;
    }
    if (p.periodYear) {
      return `${p.periodYear}`;
    }

    // Eğer appliedMonths varsa (FIFO ile uygulanmış), hangi aylara uygulandığını göster
    if (p.appliedMonths && p.appliedMonths.length > 0) {
      const monthNames = [
        'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
        'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
      ];

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      // Mevcut/geçmiş ayları ve gelecek ayları ayır
      const pastMonths = p.appliedMonths.filter(m => 
        m.year < currentYear || (m.year === currentYear && m.month <= currentMonth)
      );
      const futureMonths = p.appliedMonths.filter(m => 
        m.year > currentYear || (m.year === currentYear && m.month > currentMonth)
      );

      // Ayları formatla
      const formatMonths = (months: Array<{ year: number; month: number }>) => {
        if (months.length === 0) return null;
        
        const sorted = [...months].sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.month - b.month;
        });

        // Ardışık ayları grupla
        const groups: Array<{ year: number; months: number[] }> = [];
        
        for (const item of sorted) {
          const existingGroup = groups.find(g => g.year === item.year);
          if (existingGroup) {
            existingGroup.months.push(item.month);
          } else {
            groups.push({ year: item.year, months: [item.month] });
          }
        }

        // Her grup için string oluştur
        const parts = groups.map(g => {
          g.months.sort((a, b) => a - b);
          const monthStrs = g.months.map(m => monthNames[m - 1]);
          
          if (g.months.length === 1) {
            return `${monthStrs[0]} ${g.year}`;
          } else {
            // Ardışık ayları kontrol et
            let consecutive = true;
            for (let i = 1; i < g.months.length; i++) {
              if (g.months[i] !== g.months[i - 1] + 1) {
                consecutive = false;
                break;
              }
            }
            
            if (consecutive && g.months.length > 2) {
              return `${monthStrs[0]}-${monthStrs[monthStrs.length - 1]} ${g.year}`;
            } else {
              return `${monthStrs.join(', ')} ${g.year}`;
            }
          }
        });

        return parts.join(', ');
      };

      const pastStr = formatMonths(pastMonths);
      const futureStr = formatMonths(futureMonths);

      let result = '';
      
      if (pastStr) {
        result = pastStr;
      }
      
      if (futureStr) {
        if (result) {
          result += `, ${futureStr} (gelecek)`;
        } else {
          result = `${futureStr} (gelecek)`;
        }
      }
      
      // Eğer fazla ödeme varsa, bunu da göster
      if (p.excessAmount && p.excessAmount > 0) {
        result += ` (+${p.excessAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL fazla)`;
      }
      
      return result || '-';
    }

    // Hiçbir bilgi yoksa
    return '-';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Üye temel bilgiler */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Üye Detayı
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Ad Soyad
              </Typography>
              <Typography variant="body1">{fullName}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Durum
              </Typography>
              <Chip
                label={member.status}
                color={
                  member.status === 'ACTIVE'
                    ? 'success'
                    : member.status === 'PENDING'
                    ? 'warning'
                    : member.status === 'EXPELLED' || member.status === 'REJECTED'
                    ? 'error'
                    : 'default'
                }
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Telefon
              </Typography>
              <Typography variant="body1">{member.phone ?? '-'}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                E-posta
              </Typography>
              <Typography variant="body1">{member.email ?? '-'}</Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Bölge
              </Typography>
              <Typography variant="body1">
                {member.province?.name ?? '-'} / {member.district?.name ?? '-'}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">
                Aidat Planı
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1">
                  {member.duesPlan
                    ? `${member.duesPlan.name} - ${
                        typeof member.duesPlan.amount === 'number'
                          ? member.duesPlan.amount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2,
                            })
                          : member.duesPlan.amount
                      } TL`
                    : '-'}
                </Typography>
                {canChangeDuesPlan && member.status !== 'REJECTED' && member.status !== 'RESIGNED' && member.status !== 'EXPELLED' && member.status !== 'INACTIVE' && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={openDuesPlanDialog}
                    sx={{ ml: 1 }}
                  >
                    Değiştir
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Başvuruyu Yapan Kullanıcı */}
            {member.createdBy && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Başvuruyu Yapan
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {member.createdBy.firstName} {member.createdBy.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.createdBy.email}
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Başvuruyu Onaylayan Kullanıcı */}
            {member.approvedBy && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Başvuruyu Onaylayan
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {member.approvedBy.firstName} {member.approvedBy.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {member.approvedBy.email}
                  </Typography>
                  {member.approvedAt && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {new Date(member.approvedAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            {/* İptal Bilgisi - Sadece iptal edilmiş üyeler için */}
            {(member.status === 'RESIGNED' || member.status === 'EXPELLED' || member.status === 'INACTIVE') && member.cancellationReason && (
              <>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    İptal Nedeni
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {member.cancellationReason}
                  </Typography>
                </Grid>
                {member.cancelledAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      İptal Tarihi
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {new Date(member.cancelledAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Grid>
                )}
              </>
            )}

            {/* Önceki İptal Bilgisi - Yeniden Üye Olanlar İçin */}
            {member.previousCancelledMember && member.previousCancelledMember.cancelledAt && (
              <Grid item xs={12}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: 'warning.light',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="warning.dark">
                    Önceki Üyelik İptal Bilgisi
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bu üye daha önce{' '}
                    <strong>
                      {new Date(member.previousCancelledMember.cancelledAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>{' '}
                    tarihinde üyeliğini iptal etmiş ve{' '}
                    <strong>
                      {member.approvedAt
                        ? new Date(member.approvedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : member.createdAt
                        ? new Date(member.createdAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </strong>{' '}
                    tarihinde yeniden üye olmuştur.
                    {member.previousCancelledMember.cancellationReason && (
                      <>
                        {' '}
                        Önceki iptal nedeni: <strong>{member.previousCancelledMember.cancellationReason}</strong>
                      </>
                    )}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Borç Bilgisi */}
      {member.status === 'ACTIVE' && member.duesPlan && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Borç Bilgisi
            </Typography>
            {loadingDebt ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : memberDebt && memberDebt.totalDebt > 0 ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Geciken Ay
                  </Typography>
                  <Typography variant="h6" color="error">
                    {memberDebt.monthsOverdue} ay
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Toplam Borç
                  </Typography>
                  <Typography variant="h6" color="error">
                    {memberDebt.totalDebt.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    TL
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Son Ödeme Tarihi
                  </Typography>
                  <Typography variant="body1">
                    {memberDebt.lastPaymentDate
                      ? new Date(memberDebt.lastPaymentDate).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Ödeme yok'}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Typography variant="body2" color="success.main">
                Bu üyenin borcu bulunmamaktadır.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aidat Ödemeleri */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="h5">
              Aidat Ödemeleri
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              {member.status === 'PENDING' && (
                <>
                  {canApprove && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={handleApproveMember}
                      disabled={processingStatus}
                    >
                      Onayla
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRejectMember}
                      disabled={processingStatus}
                    >
                      Reddet
                    </Button>
                  )}
                </>
              )}
              {member.status === 'ACTIVE' && canCancelMembership && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={openCancelDialog}
                >
                  Üyeliği İptal Et
                </Button>
              )}

              {canAddPayment && member.status !== 'REJECTED' && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={openPaymentDialog}
                  disabled={loadingMember}
                >
                  Yeni Ödeme
                </Button>
              )}
            </Box>
          </Box>

          {loadingPayments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : payments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Bu üyeye ait kayıtlı ödeme bulunmuyor.
            </Typography>
          ) : (
            <Paper sx={{ width: '100%', overflowX: 'auto', mt: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Tarih</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Dönem</TableCell>
                    <TableCell align="right">Tutar (TL)</TableCell>
                    <TableCell>Not</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.paidAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{p.plan?.name ?? '-'}</TableCell>
                      <TableCell>{formatPeriod(p)}</TableCell>
                      <TableCell align="right">
                        {p.amount.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{p.note ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Ödeme Ekle Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={closePaymentDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yeni Aidat Ödemesi</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          {/* Üyenin Aidat Planı (Readonly) */}
          <TextField
            label="Aidat Planı"
            size="small"
            value={
              member?.duesPlan
                ? `${member.duesPlan.name} - ${(
                    typeof member.duesPlan.amount === 'number'
                      ? member.duesPlan.amount
                      : Number(member.duesPlan.amount) || 0
                  ).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} TL (${member.duesPlan.period === 'MONTHLY' ? 'Aylık' : 'Yıllık'})`
                : 'Plan atanmamış'
            }
            InputProps={{
              readOnly: true,
            }}
            fullWidth
            helperText="Ödeme, üyenin mevcut aidat planına göre en eski borçlu aylara otomatik olarak uygulanacaktır."
          />

          <TextField
            label="Tutar (TL) *"
            size="small"
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            value={paymentForm.amount}
            onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
            fullWidth
            required
            helperText="Ödeme tutarı. Bu tutar en eski borçlu aylara FIFO (First-In, First-Out) mantığı ile uygulanacaktır."
          />

          <TextField
            label="Not (opsiyonel)"
            size="small"
            multiline
            minRows={2}
            value={paymentForm.note}
            onChange={(e) => handlePaymentFormChange('note', e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentDialog} disabled={paymentSaving}>
            İptal
          </Button>
          <Button
            onClick={handlePaymentSave}
            disabled={paymentSaving}
            variant="contained"
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* Aidat Planı Değiştir Dialog */}
      <Dialog
        open={duesPlanDialogOpen}
        onClose={closeDuesPlanDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Aidat Planını Değiştir</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth required>
            <InputLabel>Aidat Planı</InputLabel>
            <Select
              label="Aidat Planı"
              value={selectedDuesPlanId}
              onChange={(e) => setSelectedDuesPlanId(e.target.value)}
            >
              {duesPlans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.name} - {plan.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL ({plan.period === 'MONTHLY' ? 'Aylık' : 'Yıllık'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Üyenin aidat planı değiştirildiğinde, mevcut ödemeler ve borç durumu korunur. Yeni plan gelecekteki ödemeler için geçerli olacaktır.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDuesPlanDialog} disabled={duesPlanSaving}>
            İptal
          </Button>
          <Button
            onClick={handleDuesPlanSave}
            disabled={duesPlanSaving || !selectedDuesPlanId}
            variant="contained"
          >
            {duesPlanSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Üyelik İptal Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={closeCancelDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Üyeliği İptal Et</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <FormControl fullWidth required>
            <InputLabel>İptal Durumu</InputLabel>
            <Select
              value={cancelForm.status}
              label="İptal Durumu"
              onChange={(e) => setCancelForm({ ...cancelForm, status: e.target.value as 'RESIGNED' | 'EXPELLED' | 'INACTIVE' })}
            >
              <MenuItem value="RESIGNED">İstifa</MenuItem>
              <MenuItem value="EXPELLED">İhraç</MenuItem>
              <MenuItem value="INACTIVE">Pasif</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="İptal Nedeni *"
            size="small"
            multiline
            minRows={4}
            value={cancelForm.reason}
            onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
            fullWidth
            required
            helperText="Üyeliğin iptal edilme nedeni zorunludur"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancelDialog} disabled={cancelSaving}>
            İptal
          </Button>
          <Button
            onClick={handleCancelSave}
            disabled={cancelSaving || !cancelForm.reason.trim()}
            variant="contained"
            color="warning"
          >
            İptal Et
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberDetailPage;
