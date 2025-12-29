// src/pages/members/MemberApplicationCreatePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  alpha,
  InputAdornment,
  Paper,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import PlaceIcon from '@mui/icons-material/Place';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';

import { useAuth } from '../../context/AuthContext';
import { createMemberApplication, checkCancelledMemberByNationalId } from '../../api/membersApi';
import httpClient from '../../api/httpClient';
import type { MemberDetail } from '../../types/member';
import type {
  Province,
  District,
} from '../../types/region';
import {
  getProvinces,
  getDistricts,
  getUserScopes,
} from '../../api/regionsApi';
import { getRoles } from '../../api/rolesApi';
import { getBranches } from '../../api/branchesApi';
import { getInstitutions } from '../../api/institutionsApi';
import { getTevkifatCenters, getTevkifatTitles } from '../../api/accountingApi';
import type { CustomRole } from '../../types/role';
import type { Branch } from '../../api/branchesApi';
import type { Institution } from '../../api/institutionsApi';

const MemberApplicationCreatePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();

  const canCreateApplication = hasPermission('MEMBER_CREATE_APPLICATION');
  const hasMemberListByProvince = hasPermission('MEMBER_LIST_BY_PROVINCE');
  const hasMemberList = hasPermission('MEMBER_LIST');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingNationalId, setCheckingNationalId] = useState(false);
  const [cancelledMemberDialogOpen, setCancelledMemberDialogOpen] = useState(false);
  const [cancelledMember, setCancelledMember] = useState<MemberDetail | null>(null);
  const [previousCancelledMemberId, setPreviousCancelledMemberId] = useState<string | undefined>(undefined);

  const [form, setForm] = useState<{
    // Kişisel Bilgiler
    firstName: string;
    lastName: string;
    nationalId: string;
    phone: string;
    email: string;
    motherName: string;
    fatherName: string;
    birthDate: string;
    birthplace: string;
    gender: 'MALE' | 'FEMALE' | '';
    educationStatus: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE' | '';
    // Bölge Bilgileri (Kayıtlı olduğu yer - ikamet)
    provinceId: string;
    districtId: string;
    institutionId: string;
    // Şube ve Tevkifat (branchId zorunlu)
    branchId: string;
    tevkifatCenterId: string;
    tevkifatTitle: string;
    // Üye Grubu
    membershipInfoOptionId: string;
  }>({
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    email: '',
    motherName: '',
    fatherName: '',
    birthDate: '',
    birthplace: '',
    gender: '',
    educationStatus: '',
    provinceId: '',
    districtId: '',
    institutionId: '',
    branchId: '',
    tevkifatCenterId: '',
    tevkifatTitle: '',
    membershipInfoOptionId: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [provinces, setProvinces] = useState<Province[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [districts, setDistricts] = useState<District[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tevkifatCenters, setTevkifatCenters] = useState<Array<{ id: string; name: string; title: string | null }>>([]);
  const [tevkifatTitles, setTevkifatTitles] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const [membershipInfoOptions, setMembershipInfoOptions] = useState<Array<{ id: string; label: string; value: string }>>([]);
  const [provinceDisabled, setProvinceDisabled] = useState(false);
  const [districtDisabled, setDistrictDisabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // Her dosya için özel ad ve tip (index bazlı)
  const [fileNames, setFileNames] = useState<Record<number, string>>({});
  const [fileTypes, setFileTypes] = useState<Record<number, string>>({});
  // Validation states
  const [nationalIdError, setNationalIdError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await getProvinces();
        
        // Eğer kullanıcının sadece MEMBER_LIST_BY_PROVINCE izni varsa, role'ünden provinceId/districtId'yi al
        if (hasMemberListByProvince && !hasMemberList && user?.roles) {
          try {
            const allRoles = await getRoles();
            const userRoleNames = user.roles || [];
            let userDistrictId: string | null = null;
            let userProvinceId: string | null = null;

            for (const roleName of userRoleNames) {
              const role = allRoles.find((r): r is CustomRole => 'id' in r && r.name === roleName);
              if (role && role.permissions.includes('MEMBER_LIST_BY_PROVINCE')) {
                if (role.districtId) {
                  userDistrictId = role.districtId;
                  userProvinceId = role.provinceId || null;
                  console.log('[MemberApplicationCreatePage] Found districtId from role:', roleName, userDistrictId);
                  break;
                } else if (role.provinceId) {
                  userProvinceId = role.provinceId;
                  console.log('[MemberApplicationCreatePage] Found provinceId from role:', roleName, userProvinceId);
                  break;
                }
              }
            }

            if (!userProvinceId && user?.id) {
              const scopes = await getUserScopes(user.id);
              const scope = Array.isArray(scopes) ? scopes[0] : scopes;
              if (scope?.district?.id) {
                userDistrictId = scope.district.id;
                userProvinceId = scope.province?.id || null;
                console.log('[MemberApplicationCreatePage] Found districtId from scope:', userDistrictId);
              } else if (scope?.province?.id) {
                userProvinceId = scope.province.id;
                console.log('[MemberApplicationCreatePage] Found provinceId from scope:', userProvinceId);
              }
            }

            if (userProvinceId) {
              const allowedProvince = data.find(p => p.id === userProvinceId);
              if (allowedProvince) {
                setProvinces([allowedProvince]);
                setForm((prev) => ({ ...prev, provinceId: userProvinceId! }));
                setProvinceDisabled(true);

                if (userDistrictId) {
                  const districtsData = await getDistricts(userProvinceId);
                  const allowedDistrict = districtsData.find(d => d.id === userDistrictId);
                  if (allowedDistrict) {
                    setDistricts([allowedDistrict]);
                    setForm((prev) => ({ ...prev, districtId: userDistrictId! }));
                    setDistrictDisabled(true);
                    console.log('[MemberApplicationCreatePage] Auto-selected district:', allowedDistrict.name);
                  }
                }
                console.log('[MemberApplicationCreatePage] Auto-selected province:', allowedProvince.name);
              } else {
                setProvinces([]);
              }
            } else {
              setProvinces([]);
            }
          } catch (error: any) {
            console.error('User role/scope alınırken hata:', error);
            setProvinces([]);
          }
        } else {
          setProvinces(data);
        }
      } catch (e) {
        console.error('İller alınırken hata:', e);
      }
    };
    loadProvinces();
  }, [hasMemberListByProvince, hasMemberList, user?.id, user?.roles]);

  // Şubeleri yükle
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await getBranches({ isActive: true });
        setBranches(data);
      } catch (e) {
        console.error('Şubeler alınırken hata:', e);
      }
    };
    loadBranches();
  }, []);

  // Kurumları yükle
  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await getInstitutions();
        setInstitutions(data.filter(i => i.isActive));
      } catch (e) {
        console.error('Kurumlar alınırken hata:', e);
      }
    };
    loadInstitutions();
  }, []);

  // Tevkifat merkezlerini yükle
  useEffect(() => {
    const loadTevkifatCenters = async () => {
      try {
        const data = await getTevkifatCenters();
        const activeCenters = data.filter(c => c.isActive).map(c => ({ id: c.id, name: c.name, title: c.title }));
        setTevkifatCenters(activeCenters);
      } catch (e) {
        console.error('Tevkifat merkezleri yüklenirken hata:', e);
      }
    };
    loadTevkifatCenters();
  }, []);

  // Tevkifat unvanlarını yükle
  useEffect(() => {
    const loadTevkifatTitles = async () => {
      try {
        const data = await getTevkifatTitles();
        const activeTitles = data.filter(t => t.isActive);
        setTevkifatTitles(activeTitles);
      } catch (e) {
        console.error('Tevkifat unvanları yüklenirken hata:', e);
      }
    };
    loadTevkifatTitles();
  }, []);

  // Üyelik bilgisi seçeneklerini yükle
  useEffect(() => {
    const loadMembershipInfoOptions = async () => {
      try {
        const res = await httpClient.get('/members/membership-info-options');
        setMembershipInfoOptions(res.data || []);
      } catch (e) {
        console.error('Üyelik bilgisi seçenekleri yüklenirken hata:', e);
      }
    };
    loadMembershipInfoOptions();
  }, []);



  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = form.provinceId;
      if (!provinceId) {
        setDistricts([]);
        return;
      }

      try {
        const dists = await getDistricts(provinceId);
        setDistricts(dists);
      } catch (e) {
        console.error('İl değişince ilçe verisi alınırken hata:', e);
      }
    };

    loadForProvince();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.provinceId]);

  // Memoized utility functions
  const normalizeNationalId = useCallback((value: string) => value.replace(/\D/g, '').slice(0, 11), []);

  // Sadece harf, boşluk ve Türkçe karakterlere izin ver (sayıları engelle)
  const normalizeTextOnly = useCallback((value: string): string => {
    // Türkçe karakterler ve harfler, boşluk, tire, nokta, apostrof
    return value.replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s\-\.']/g, '');
  }, []);

  // Telefon numarası formatı: +90 (507) 411 2255
  const formatPhoneNumber = useCallback((value: string): string => {
    // Sadece rakamları al
    const digits = value.replace(/\D/g, '');
    
    // Boşsa +90 döndür
    if (digits.length === 0) {
      return '+90 ';
    }
    
    // Eğer 90 ile başlamıyorsa, 90 ekle
    let phoneDigits = digits;
    if (!digits.startsWith('90')) {
      phoneDigits = '90' + digits;
    }
    
    // Maksimum 12 hane (90 + 10 hane)
    phoneDigits = phoneDigits.slice(0, 12);
    
    // +90'dan sonraki kısmı al (90'ı çıkar)
    const afterCountryCode = phoneDigits.slice(2);
    
    // Format: +90 (XXX) XXX XXXX
    if (afterCountryCode.length === 0) {
      return '+90 ';
    } else if (afterCountryCode.length <= 3) {
      return `+90 (${afterCountryCode}`;
    } else if (afterCountryCode.length <= 6) {
      return `+90 (${afterCountryCode.slice(0, 3)}) ${afterCountryCode.slice(3)}`;
    } else {
      return `+90 (${afterCountryCode.slice(0, 3)}) ${afterCountryCode.slice(3, 6)} ${afterCountryCode.slice(6, 10)}`;
    }
  }, []);

  const normalizePhoneNumber = useCallback((value: string): string => {
    // Formatı temizle, sadece rakamları al
    const digits = value.replace(/\D/g, '');
    // Boşsa boş döndür
    if (digits.length === 0) {
      return '';
    }
    // Eğer 90 ile başlamıyorsa, 90 ekle
    if (!digits.startsWith('90')) {
      return '90' + digits.slice(0, 10); // Maksimum 10 hane ekle
    }
    // Maksimum 12 hane (90 + 10 hane)
    return digits.slice(0, 12);
  }, []);

  const getPhoneError = useCallback((phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return null; // Telefon opsiyonel
    }
    const digits = phone.replace(/\D/g, '');
    // +90 ile başlamalı ve toplam 12 hane olmalı (90 + 10 hane)
    if (!digits.startsWith('90')) {
      return 'Telefon numarası +90 ile başlamalıdır.';
    }
    if (digits.length !== 12) {
      return 'Telefon numarası +90 (XXX) XXX XXXX formatında olmalıdır.';
    }
    // İlk 3 hane (90'dan sonra) 5 ile başlamalı
    if (digits[2] !== '5') {
      return 'Telefon numarası +90 (5XX) XXX XXXX formatında olmalıdır.';
    }
    return null;
  }, []);

  const getEmailError = useCallback((email: string): string | null => {
    if (!email || email.trim() === '') {
      return null; // E-posta opsiyonel
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Geçerli bir e-posta adresi giriniz.';
    }
    return null;
  }, []);

  const getNationalIdError = useCallback((nationalId: string): string | null => {
    const cleaned = nationalId.trim();
    if (!cleaned) {
      return 'TC Kimlik Numarası zorunludur.';
    }
    if (!/^\d{11}$/.test(cleaned)) {
      return 'TC Kimlik Numarası 11 haneli ve sadece rakam olmalıdır.';
    }
    return null;
  }, []);

  // TC kontrolü için debounce timer
  const checkNationalIdTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNationalId = useCallback(async (nationalId: string) => {
    if (getNationalIdError(nationalId)) {
      return;
    }

    setCheckingNationalId(true);
    try {
      const cancelled = await checkCancelledMemberByNationalId(nationalId);
      if (cancelled) {
        setCancelledMember(cancelled);
        setPreviousCancelledMemberId(cancelled.id);
        setCancelledMemberDialogOpen(true);
      } else {
        setCancelledMember(null);
        setPreviousCancelledMemberId(undefined);
      }
    } catch (e) {
      console.error('TC kontrolü sırasında hata:', e);
      // Hata durumunda sessizce devam et
    } finally {
      setCheckingNationalId(false);
    }
  }, [getNationalIdError]);

  const handleChange = useCallback((field: keyof typeof form, value: string) => {
    // Eğer il/ilçe disabled ise değişikliğe izin verme
    if (field === 'provinceId' && provinceDisabled) {
      return;
    }
    if (field === 'districtId' && districtDisabled) {
      return;
    }

    let nextValue: string;
    let shouldUpdateError = false;
    let errorValue: string | null = null;

    if (field === 'nationalId') {
      nextValue = normalizeNationalId(value);
      errorValue = getNationalIdError(nextValue);
      shouldUpdateError = true;
    } else if (field === 'phone') {
      nextValue = formatPhoneNumber(value);
      const normalized = normalizePhoneNumber(nextValue);
      errorValue = getPhoneError(normalized);
      shouldUpdateError = true;
    } else if (field === 'email') {
      nextValue = value;
      errorValue = getEmailError(value);
      shouldUpdateError = true;
    } else if (field === 'firstName' || field === 'lastName' || field === 'motherName' || field === 'fatherName' || field === 'birthplace') {
      // Sadece harf ve Türkçe karakterlere izin ver (sayıları engelle)
      nextValue = normalizeTextOnly(value);
    } else {
      nextValue = value;
    }

    // Error state'leri sadece değiştiğinde güncelle
    if (shouldUpdateError) {
      if (field === 'nationalId') {
        setNationalIdError((prev) => prev !== errorValue ? errorValue : prev);
      } else if (field === 'phone') {
        setPhoneError((prev) => prev !== errorValue ? errorValue : prev);
      } else if (field === 'email') {
        setEmailError((prev) => prev !== errorValue ? errorValue : prev);
      }
    }

    setForm((prev) => {
      // Değer aynıysa re-render'ı önle
      if (prev[field] === nextValue) {
        return prev;
      }
      
      return {
        ...prev,
        [field]: nextValue,
        ...(field === 'provinceId'
          ? {
              districtId: '',
            }
          : {}),
      };
    });

    // TC kimlik numarası değiştiğinde kontrol yap (debounced)
    if (field === 'nationalId') {
      // Önceki timeout'u temizle
      if (checkNationalIdTimeoutRef.current) {
        clearTimeout(checkNationalIdTimeoutRef.current);
      }
      
      const isValidNationalId = nextValue.length === 11 && errorValue === null;
      if (isValidNationalId) {
        // 500ms debounce ile TC kontrolü yap
        checkNationalIdTimeoutRef.current = setTimeout(() => {
          checkNationalId(nextValue);
        }, 500);
      } else {
        // Geçerli bir TC olmadan iptal edilmiş üye kontrolü yapma
        setCancelledMember(null);
        setPreviousCancelledMemberId(undefined);
      }
    }
  }, [getNationalIdError, normalizeNationalId, normalizeTextOnly, formatPhoneNumber, normalizePhoneNumber, getPhoneError, getEmailError, provinceDisabled, districtDisabled, checkNationalId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkNationalIdTimeoutRef.current) {
        clearTimeout(checkNationalIdTimeoutRef.current);
      }
    };
  }, []);

  // Memoized onKeyPress handler for text-only fields
  const handleTextOnlyKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const char = e.key;
    if (!/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s\-\.']$/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'Tab' && char !== 'ArrowLeft' && char !== 'ArrowRight') {
      e.preventDefault();
    }
  }, []);

  // Dosya adını oluştur (format: UyeKayidi_TCKimlik_AdSoyad)
  // Kayıt numarası henüz yok, başlangıçta sadece TCKimlik_AdSoyad gösterilir
  // Member oluşturulduktan sonra kayıt numarası otomatik eklenir
  const generateFileName = (originalFileName: string, registrationNumber?: string): string => {
    const firstName = form.firstName.trim().replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/g, '');
    const lastName = form.lastName.trim().replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ\s]/g, '');
    const adSoyad = `${firstName}_${lastName}`.replace(/\s+/g, '_');
    
    const tcKimlik = form.nationalId.trim() || 'TCYOK';
    
    // Dosya uzantısını al
    const extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
    
    // Format: UyeKayidi_TCKimlik_AdSoyad
    // Kayıt numarası varsa başa ekle, yoksa sadece TCKimlik_AdSoyad göster (kayıt numarası eklendikten sonra güncellenecek)
    if (registrationNumber) {
      return `${registrationNumber}_${tcKimlik}_${adSoyad}${extension}`;
    } else {
      // Başlangıçta sadece TCKimlik_AdSoyad göster (kayıt numarası eklendikten sonra güncellenecek)
      return `${tcKimlik}_${adSoyad}${extension}`;
    }
  };

  // Dosya seçildiğinde otomatik ad oluştur
  const handleFileSelect = (files: File[]) => {
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    
    // Yeni dosyalar için otomatik ad oluştur
    const newFileNames = { ...fileNames };
    files.forEach((file, fileIndex) => {
      const globalIndex = uploadedFiles.length + fileIndex;
      const autoName = generateFileName(file.name);
      newFileNames[globalIndex] = autoName;
    });
    setFileNames(newFileNames);
  };

  // Dosya adını güncelle
  const handleFileNameChange = (index: number, newName: string) => {
    setFileNames((prev) => ({
      ...prev,
      [index]: newName,
    }));
  };

  // Dosya silindiğinde adını ve tipini de temizle
  const handleFileDelete = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileNames((prev) => {
      const newNames: Record<number, string> = {};
      Object.keys(prev)
        .map(Number)
        .filter((i) => i !== index)
        .forEach((oldIndex) => {
          const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
          newNames[newIndex] = prev[oldIndex];
        });
      return newNames;
    });
    setFileTypes((prev) => {
      const newTypes: Record<number, string> = {};
      Object.keys(prev)
        .map(Number)
        .filter((i) => i !== index)
        .forEach((oldIndex) => {
          const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
          newTypes[newIndex] = prev[oldIndex];
        });
      return newTypes;
    });
  };

  const validate = () => {
    if (!form.firstName.trim()) {
      setError('Ad alanı zorunludur.');
      return false;
    }
    if (!form.lastName.trim()) {
      setError('Soyad alanı zorunludur.');
      return false;
    }
    const nationalIdError = getNationalIdError(form.nationalId);
    if (nationalIdError) {
      setError(nationalIdError);
      setNationalIdError(nationalIdError);
      return false;
    }
    if (!form.motherName.trim()) {
      setError('Anne adı zorunludur.');
      return false;
    }
    if (!form.fatherName.trim()) {
      setError('Baba adı zorunludur.');
      return false;
    }
    if (!form.birthDate) {
      setError('Doğum tarihi zorunludur.');
      return false;
    }
    if (!form.birthplace.trim()) {
      setError('Doğum yeri zorunludur.');
      return false;
    }
    if (!form.gender) {
      setError('Cinsiyet seçimi zorunludur.');
      return false;
    }
    if (!form.educationStatus) {
      setError('Öğrenim durumu zorunludur.');
      return false;
    }
    if (!form.provinceId) {
      setError('İl seçimi zorunludur.');
      return false;
    }
    if (!form.districtId) {
      setError('İlçe seçimi zorunludur.');
      return false;
    }
    const normalizedPhone = normalizePhoneNumber(form.phone);
    if (!normalizedPhone || normalizedPhone.trim() === '') {
      setError('Telefon numarası zorunludur.');
      return false;
    }
    const phoneError = getPhoneError(normalizedPhone);
    if (phoneError) {
      setError(phoneError);
      setPhoneError(phoneError);
      return false;
    }
    if (!form.email.trim()) {
      setError('E-posta adresi zorunludur.');
      return false;
    }
    const emailError = getEmailError(form.email);
    if (emailError) {
      setError(emailError);
      setEmailError(emailError);
      return false;
    }
    if (!form.institutionId) {
      setError('Kurum seçimi zorunludur.');
      return false;
    }
    if (!form.tevkifatCenterId) {
      setError('Tevkifat kurumu seçimi zorunludur.');
      return false;
    }
    if (!form.tevkifatTitle) {
      setError('Tevkifat ünvanı seçimi zorunludur.');
      return false;
    }
    if (!form.branchId) {
      setError('Şube seçimi zorunludur.');
      return false;
    }
    if (!form.membershipInfoOptionId) {
      setError('Üye grubu seçimi zorunludur.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (skipDialog = false) => {
    if (!canCreateApplication) {
      setError('Bu işlem için yetkiniz yok.');
      return;
    }

    if (!validate()) return;

    // Eğer iptal edilmiş üye varsa ve dialog açık değilse, dialog'u aç
    if (cancelledMember && !skipDialog && !cancelledMemberDialogOpen) {
      setCancelledMemberDialogOpen(true);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Telefon numarasını normalize et (sadece rakamlar, +90 ile başlamalı)
      const normalizedPhone = form.phone.trim() 
        ? normalizePhoneNumber(form.phone.trim())
        : undefined;

      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        nationalId: form.nationalId.trim(), // Zorunlu
        phone: normalizedPhone || undefined,
        email: form.email.trim() || undefined,
        provinceId: form.provinceId || undefined,
        districtId: form.districtId || undefined,
        branchId: form.branchId, // Zorunlu
        source: 'DIRECT', // Default değer olarak DIRECT kullanılıyor
        // Kişisel Bilgiler
        motherName: form.motherName.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        birthDate: form.birthDate || undefined,
        birthplace: form.birthplace.trim() || undefined,
        gender: form.gender || undefined,
        educationStatus: form.educationStatus || undefined,
        // Üye Grubu
        membershipInfoOptionId: form.membershipInfoOptionId || undefined,
        // Kurum Bilgileri
        institutionId: form.institutionId || undefined,
        // Tevkifat
        tevkifatCenterId: form.tevkifatCenterId || undefined,
        tevkifatTitleId: form.tevkifatTitle || undefined,
        previousCancelledMemberId: previousCancelledMemberId,
        // registrationNumber backend'de otomatik oluşturulacak (zaman damgası veya sıralı numara)
      };

      const created = await createMemberApplication(payload);
      
      // Dosyaları yükle (eğer varsa)
      // Dosya adları kayıt numarası ile güncellenecek
      if (uploadedFiles.length > 0) {
        try {
          // TODO: Backend'de dosya yükleme endpoint'i eklendikten sonra bu kısım implement edilecek
          // Dosyalar kullanıcının belirlediği adlarla yüklenecek
          const filesToUpload = uploadedFiles.map((file, index) => {
            let userFileName = fileNames[index] || generateFileName(file.name);
            const extension = userFileName.substring(userFileName.lastIndexOf('.'));
            const nameWithoutExt = userFileName.replace(extension, '');
            
            // Format: UyeKayidi_TCKimlik_AdSoyad
            let finalFileName = userFileName;
            
            // Eğer kayıt numarası varsa ve dosya adı başında yoksa ekle
            if (created.registrationNumber) {
              // Kayıt numarası zaten başta varsa değiştirme
              if (!nameWithoutExt.startsWith(created.registrationNumber + '_')) {
                // Kayıt numarasını başa ekle: UyeKayidi_TCKimlik_AdSoyad
                finalFileName = `${created.registrationNumber}_${nameWithoutExt}${extension}`;
              }
              // Eğer zaten kayıt numarası varsa, finalFileName zaten doğru
            }
            // Kayıt numarası yoksa, userFileName kullan (TCKimlik_AdSoyad formatında)
            
            return {
              file,
              newFileName: finalFileName,
            };
          });
          console.log('Yüklenecek dosyalar (yeni adlarla):', filesToUpload);
          // navigate(`/members/${created.id}?uploadFiles=true`);
        } catch (fileError) {
          console.error('Dosya yüklenirken hata:', fileError);
          // Dosya yükleme hatası olsa bile üye oluşturuldu, devam et
        }
      }
      
      navigate(`/members/${created.id}`);
    } catch (e: any) {
      console.error('Üye başvurusu oluşturulurken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Başvuru oluşturulurken bir hata oluştu.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!canCreateApplication) {
    return (
      <Box>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <PersonAddIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Yetkisiz İşlem
          </Typography>
          <Typography color="text.secondary">
            Üye başvurusu oluşturmak için gerekli izne sahip değilsiniz.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Başlık Bölümü */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.95)} 0%, ${theme.palette.primary.dark} 100%)`,
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        {/* Dekoratif arka plan elemanları */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: alpha('#fff', 0.08),
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha('#fff', 0.05),
          }}
        />

        <Box sx={{ p: { xs: 2.5, sm: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: { xs: 48, sm: 56 },
                height: { xs: 48, sm: 56 },
                borderRadius: 2.5,
                bgcolor: alpha('#fff', 0.2),
                border: `3px solid ${alpha('#fff', 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${alpha('#000', 0.25)}`,
              }}
            >
              <PersonAddIcon sx={{ color: '#fff', fontSize: { xs: '1.5rem', sm: '1.75rem' } }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  mb: 0.5,
                }}
              >
                Yeni Üye Başvurusu
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  opacity: 0.9,
                  fontSize: { xs: '0.875rem', sm: '0.9rem' },
                }}
              >
                Panel üzerinden yeni bir üye başvurusu oluşturun
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Hata Mesajı */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Ana Kart */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.06)}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {/* Kişisel Bilgiler Bölümü */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <PersonIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Kişisel Bilgiler
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* TC Kimlik No - Tam genişlik */}
            <Grid item xs={12}>
              <TextField
                label="TC Kimlik Numarası *"
                value={form.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                fullWidth
                required
                error={!!nationalIdError}
                inputProps={{ maxLength: 11, inputMode: 'numeric', pattern: '\\d*' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: nationalIdError ? 'error.main' : 'primary.main', fontSize: '1.3rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (checkingNationalId || nationalIdError) ? (
                    <InputAdornment position="end">
                      {checkingNationalId ? (
                        <CircularProgress size={20} />
                      ) : nationalIdError ? (
                        <Tooltip 
                          title={nationalIdError} 
                          arrow 
                          placement="top"
                          componentsProps={{
                            tooltip: {
                              sx: {
                                zIndex: 9999,
                                fontSize: '0.875rem',
                              },
                            },
                          }}
                        >
                          <ErrorIcon sx={{ color: 'error.main', fontSize: '1.2rem', cursor: 'help' }} />
                        </Tooltip>
                      ) : null}
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Ad - Soyad (2 sütun) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Adı *"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                fullWidth
                required
                inputProps={{
                  pattern: '[a-zA-ZçğıöşüÇĞIİÖŞÜ\\s\\-\\.\']*',
                  onKeyPress: handleTextOnlyKeyPress,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Soyadı *"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                fullWidth
                required
                inputProps={{
                  pattern: '[a-zA-ZçğıöşüÇĞIİÖŞÜ\\s\\-\\.\']*',
                  onKeyPress: handleTextOnlyKeyPress,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Anne Adı - Baba Adı (2 sütun) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Anne Adı *"
                value={form.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                fullWidth
                required
                inputProps={{
                  pattern: '[a-zA-ZçğıöşüÇĞIİÖŞÜ\\s\\-\\.\']*',
                  onKeyPress: handleTextOnlyKeyPress,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Baba Adı *"
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                fullWidth
                required
                inputProps={{
                  pattern: '[a-zA-ZçğıöşüÇĞIİÖŞÜ\\s\\-\\.\']*',
                  onKeyPress: handleTextOnlyKeyPress,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Doğum Tarihi - Doğum Yeri (2 sütun) */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Doğum Tarihi *"
                type="date"
                value={form.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Doğum Yeri *"
                value={form.birthplace}
                onChange={(e) => handleChange('birthplace', e.target.value)}
                fullWidth
                required
                inputProps={{
                  pattern: '[a-zA-ZçğıöşüÇĞIİÖŞÜ\\s\\-\\.\']*',
                  onKeyPress: handleTextOnlyKeyPress,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            {/* Cinsiyet - Öğrenim Durumu (2 sütun) */}
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Cinsiyet *</InputLabel>
                <Select
                  label="Cinsiyet *"
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="MALE">Erkek</MenuItem>
                  <MenuItem value="FEMALE">Kadın</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Öğrenim Durumu *</InputLabel>
                <Select
                  label="Öğrenim Durumu *"
                  value={form.educationStatus}
                  onChange={(e) => handleChange('educationStatus', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="PRIMARY">İlköğretim</MenuItem>
                  <MenuItem value="HIGH_SCHOOL">Lise</MenuItem>
                  <MenuItem value="COLLEGE">Yüksekokul</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Telefon - E-posta (2 sütun) */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Telefon *"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
                required
                error={!!phoneError}
                placeholder="+90 (5XX) XXX XX XX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: phoneError ? 'error.main' : 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: phoneError ? (
                    <InputAdornment position="end">
                      <Tooltip 
                        title={phoneError} 
                        arrow 
                        placement="top"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              zIndex: 9999,
                              fontSize: '0.875rem',
                            },
                          },
                        }}
                      >
                        <ErrorIcon sx={{ color: 'error.main', fontSize: '1.2rem', cursor: 'help' }} />
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="E-posta *"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                required
                error={!!emailError}
                placeholder="ornek@email.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: emailError ? 'error.main' : 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: emailError ? (
                    <InputAdornment position="end">
                      <Tooltip 
                        title={emailError} 
                        arrow 
                        placement="top"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              zIndex: 9999,
                              fontSize: '0.875rem',
                            },
                          },
                        }}
                      >
                        <ErrorIcon sx={{ color: 'error.main', fontSize: '1.2rem', cursor: 'help' }} />
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Kurum Bilgileri */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3, 
              mt: 4,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.warning.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
              }}
            >
              <WorkIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Kurum Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Kurum Adı - Tek alan, tam genişlik */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Kurum Adı *</InputLabel>
                <Select
                  label="Kurum Adı *"
                  value={form.institutionId}
                  onChange={(e) => handleChange('institutionId', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Kurum Seçin</MenuItem>
                  {institutions.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Tevkifat Bölümü */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3, 
              mt: 4,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Tevkifat Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Tevkifat Kurumu - Tevkifat Ünvanı (2 sütun responsive) */}
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Tevkifat Kurumu *</InputLabel>
                <Select
                  label="Tevkifat Kurumu *"
                  value={form.tevkifatCenterId}
                  onChange={(e) => handleChange('tevkifatCenterId', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <CorporateFareIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Tevkifat Kurumu Seçin</MenuItem>
                  {tevkifatCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Tevkifat Ünvanı *</InputLabel>
                <Select
                  label="Tevkifat Ünvanı *"
                  value={form.tevkifatTitle}
                  onChange={(e) => handleChange('tevkifatTitle', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Tevkifat Ünvanı Seçin</MenuItem>
                  {tevkifatTitles.map((title) => (
                    <MenuItem key={title.id} value={title.id}>
                      {title.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Şube Alanı */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3, 
              mt: 4,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.info.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
              }}
            >
              <CorporateFareIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Şube Seçimi
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Şube - Tek alan, tam genişlik */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Şube *</InputLabel>
                <Select
                  label="Şube *"
                  value={form.branchId}
                  onChange={(e) => handleChange('branchId', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Şube Seçin</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.code ? `(${branch.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Üye Grubu Bölümü */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3, 
              mt: 4,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.success.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
              }}
            >
              <PersonIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Üyelik Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {/* Üyelik Durumu - Disabled, bilgilendirici */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                  },
                }}
              >
                <InputLabel>Üyelik Durumu</InputLabel>
                <Select
                  label="Üyelik Durumu"
                  value="PENDING"
                  disabled
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="PENDING">Beklemede (Otomatik)</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>
                <Typography variant="caption">
                  Üye kaydı esnasında otomatik olarak <strong>BEKLEME</strong> durumu atanır. Diğer durumlar Admin tarafından düzenlenebilir.
                </Typography>
              </Alert>
            </Grid>

            {/* Üye Grubu */}
            <Grid item xs={12}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Üye Grubu *</InputLabel>
                <Select
                  label="Üye Grubu *"
                  value={form.membershipInfoOptionId}
                  onChange={(e) => handleChange('membershipInfoOptionId', e.target.value)}
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Üye Grubu Seçin</MenuItem>
                  {membershipInfoOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Yönetim Bilgileri - 2 sütun */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Yönetim Karar Defteri No"
                value=""
                disabled
                fullWidth
                placeholder="Admin tarafından verilebilecek"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Yönetim Kurulu Karar Tarihi"
                type="date"
                value=""
                disabled
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                placeholder="Admin tarafından verilebilecek"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                  },
                }}
              />
            </Grid>

            {/* Üye Numarası */}
            <Grid item xs={12}>
              <TextField
                label="Üye Numarası"
                value=""
                disabled
                fullWidth
                placeholder="Admin tarafından verilebilecek"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: 300,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.grey[100], 0.5),
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Üyelik Evrakları Bölümü */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 3, 
              mt: 4,
              pb: 2,
              borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <UploadFileIcon sx={{ fontSize: '1.3rem', color: '#fff' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Üyelik Evrakları
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            <Grid item xs={12}>
              <Box
                sx={{
                  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                  transition: 'all 0.3s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <input
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{ display: 'none' }}
                  id="file-upload-input"
                  multiple
                  type="file"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    handleFileSelect(files);
                    // Input'u sıfırla (aynı dosyayı tekrar seçebilmek için)
                    e.target.value = '';
                  }}
                />
                <label htmlFor="file-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      mb: 2,
                    }}
                  >
                    Dosya Seç
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  PDF, Word, JPG, PNG formatları desteklenir
                </Typography>
                {uploadedFiles.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                      Seçilen Dosyalar ({uploadedFiles.length}):
                    </Typography>
                    <Stack spacing={2}>
                      {uploadedFiles.map((file, index) => {
                        const defaultFileName = generateFileName(file.name);
                        const fileName = fileNames[index] || defaultFileName;
                        const extension = file.name.substring(file.name.lastIndexOf('.'));
                        
                        return (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              bgcolor: alpha(theme.palette.grey[100], 0.5),
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <UploadFileIcon fontSize="small" color="action" />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                    Orijinal Dosya Adı:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                    {file.name}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {(file.size / 1024).toFixed(2)} KB
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => handleFileDelete(index)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box sx={{ mt: 1.5 }}>
                              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                                <InputLabel>Belge Tipi</InputLabel>
                                <Select
                                  label="Belge Tipi"
                                  value={fileTypes[index] || ''}
                                  onChange={(e) => {
                                    setFileTypes((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }));
                                  }}
                                >
                                  <MenuItem value="">Seçmeli</MenuItem>
                                  <MenuItem value="MEMBERSHIP_FORM">Üyelik Formu</MenuItem>
                                  <MenuItem value="RESIGNATION_FORM">İstifa Formu</MenuItem>
                                  <MenuItem value="REPRESENTATION_LETTER">Temsilcilik Yazısı Formu</MenuItem>
                                  <MenuItem value="OTHER">Diğer Dosyalar</MenuItem>
                                </Select>
                              </FormControl>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                                Kaydedilecek Dosya Adı:
                              </Typography>
                              <TextField
                                value={fileName.replace(extension, '')}
                                onChange={(e) => {
                                  // Uzantıyı koru
                                  const newName = e.target.value.trim() + extension;
                                  handleFileNameChange(index, newName);
                                }}
                                size="small"
                                fullWidth
                                placeholder="Dosya adını girin"
                                InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <Typography variant="caption" color="text.secondary">
                                        {extension}
                                      </Typography>
                                    </InputAdornment>
                                  ),
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                  },
                                }}
                              />
                              {fileName === defaultFileName && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
                                  Otomatik oluşturuldu. İsterseniz değiştirebilirsiniz.
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Stack>
                    <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                      <Typography variant="caption">
                        <strong>Not:</strong> Dosyalar kaydedilirken yukarıda belirtilen adlarla kaydedilecektir. 
                        İsterseniz dosya adlarını düzenleyebilirsiniz. Üye kayıt numarası atandıktan sonra dosya adları otomatik olarak 
                        <strong> UyeKayidi_TCKimlik_AdSoyad</strong> formatına güncellenecektir.
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Butonlar */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'flex-end', 
              gap: 2, 
              mt: 5,
              pt: 4,
              borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={saving}
              startIcon={<ArrowBackIcon />}
              fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              Geri
            </Button>
            <Button
              variant="contained"
              onClick={() => handleSubmit(false)}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.35)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.45)}`,
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* İptal Edilmiş Üye Uyarı Dialog'u */}
      <Dialog
        open={cancelledMemberDialogOpen}
        onClose={() => setCancelledMemberDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" gap={1}>
            <Alert severity="warning" sx={{ flex: 1 }}>
              İptal Edilmiş Üye Tespit Edildi
            </Alert>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {cancelledMember && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Bu TC kimlik numarasına sahip daha önce üyeliği iptal edilmiş bir kayıt bulundu. 
                Aşağıdaki bilgileri inceleyerek devam edebilirsiniz.
              </Alert>
              
              <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Önceki Üye Bilgileri
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Ad Soyad</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.firstName} {cancelledMember.lastName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">TC Kimlik No</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.nationalId || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">İptal Tarihi</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.cancelledAt
                        ? new Date(cancelledMember.cancelledAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">İptal Nedeni</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {cancelledMember.cancellationReason || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Durum</Typography>
                    <Chip
                      label={cancelledMember.status}
                      size="small"
                      color="error"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                  {cancelledMember.province && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">İl/İlçe</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {cancelledMember.province.name}
                        {cancelledMember.district ? ` / ${cancelledMember.district.name}` : ''}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setCancelledMemberDialogOpen(false)} color="inherit">
            İptal
          </Button>
          <Button
            onClick={() => {
              setCancelledMemberDialogOpen(false);
              handleSubmit(true);
            }}
            variant="contained"
            disabled={saving}
          >
            Devam Et ve Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberApplicationCreatePage;