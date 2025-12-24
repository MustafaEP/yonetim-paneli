// src/pages/members/MemberApplicationCreatePage.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  alpha,
  InputAdornment,
  Paper,
  Divider,
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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';

import { useAuth } from '../../context/AuthContext';
import { createMemberApplication, checkCancelledMemberByNationalId } from '../../api/membersApi';
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
import { getTevkifatCenters } from '../../api/accountingApi';
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
    birthplace: string;
    gender: 'MALE' | 'FEMALE' | '';
    educationStatus: 'PRIMARY' | 'HIGH_SCHOOL' | 'COLLEGE' | '';
    // Bölge Bilgileri (Kayıtlı olduğu yer - ikamet)
    provinceId: string;
    districtId: string;
    // Çalışma Bilgileri (zorunlu)
    workingProvinceId: string;
    workingDistrictId: string;
    institutionId: string;
    positionTitle: 'KADRO_657' | 'SOZLESMELI_4B' | 'KADRO_663' | 'AILE_HEKIMLIGI' | 'UNVAN_4924' | 'DIGER_SAGLIK_PERSONELI' | '';
    institutionRegNo: string;
    workUnit: string;
    workUnitAddress: string;
    // Şube ve Tevkifat (branchId zorunlu)
    branchId: string;
    tevkifatCenterId: string;
  }>({
    firstName: '',
    lastName: '',
    nationalId: '',
    phone: '',
    email: '',
    motherName: '',
    fatherName: '',
    birthplace: '',
    gender: '',
    educationStatus: '',
    provinceId: '',
    districtId: '',
    workingProvinceId: '',
    workingDistrictId: '',
    institutionId: '',
    positionTitle: '',
    institutionRegNo: '',
    workUnit: '',
    workUnitAddress: '',
    branchId: '',
    tevkifatCenterId: '',
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [workingProvinces, setWorkingProvinces] = useState<Province[]>([]);
  const [workingDistricts, setWorkingDistricts] = useState<District[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [tevkifatCenters, setTevkifatCenters] = useState<Array<{ id: string; name: string }>>([]);
  const [provinceDisabled, setProvinceDisabled] = useState(false);
  const [districtDisabled, setDistrictDisabled] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // Her dosya için özel ad (index bazlı)
  const [fileNames, setFileNames] = useState<Record<number, string>>({});
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

  // Çalışma illerini yükle (tüm iller)
  useEffect(() => {
    const loadWorkingProvinces = async () => {
      try {
        const data = await getProvinces();
        setWorkingProvinces(data);
      } catch (e) {
        console.error('Çalışma illeri alınırken hata:', e);
      }
    };
    loadWorkingProvinces();
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
        setTevkifatCenters(data.filter(c => c.isActive).map(c => ({ id: c.id, name: c.name })));
      } catch (e) {
        console.error('Tevkifat merkezleri yüklenirken hata:', e);
      }
    };
    loadTevkifatCenters();
  }, []);

  // Çalışma ilçelerini yükle
  useEffect(() => {
    const loadWorkingDistricts = async () => {
      if (!form.workingProvinceId) {
        setWorkingDistricts([]);
        return;
      }
      try {
        const data = await getDistricts(form.workingProvinceId);
        setWorkingDistricts(data);
      } catch (e) {
        console.error('Çalışma ilçeleri alınırken hata:', e);
      }
    };
    loadWorkingDistricts();
  }, [form.workingProvinceId]);

  // Seçilen çalışma il / ilçe bilgisine göre kurumları filtrele
  const filteredInstitutions = useMemo(() => {
    if (!form.workingProvinceId) {
      return [];
    }

    return institutions.filter((inst) => {
      if (inst.provinceId !== form.workingProvinceId) {
        return false;
      }

      // Eğer çalışma ilçesi seçilmemişse sadece ile göre filtrele
      if (!form.workingDistrictId) {
        return true;
      }

      // Hem il hem ilçe seçilmişse, ilçe de eşleşmeli
      return inst.districtId === form.workingDistrictId;
    });
  }, [institutions, form.workingProvinceId, form.workingDistrictId]);

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
    if (cleaned[0] === '0') {
      return 'TC Kimlik Numarası 0 ile başlayamaz.';
    }
    if (/^(\d)\1{10}$/.test(cleaned)) {
      return 'TC Kimlik Numarası tüm hanesi aynı olamaz.';
    }

    const digits = cleaned.split('').map(Number);
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;
    if (digits[9] !== tenthDigit) {
      return 'TC Kimlik Numarası geçersiz (10. hane kontrolü).';
    }

    const eleventhDigit = digits.slice(0, 10).reduce((acc, digit) => acc + digit, 0) % 10;
    if (digits[10] !== eleventhDigit) {
      return 'TC Kimlik Numarası geçersiz (11. hane kontrolü).';
    }

    return null;
  }, []);

  // TC kontrolü için debounce timer
  const checkNationalIdTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

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
        ...(field === 'workingProvinceId'
          ? {
              workingDistrictId: '',
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

  // Dosya silindiğinde adını da temizle
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
    const normalizedPhone = normalizePhoneNumber(form.phone);
    const phoneError = getPhoneError(normalizedPhone);
    if (phoneError) {
      setError(phoneError);
      setPhoneError(phoneError);
      return false;
    }
    const emailError = getEmailError(form.email);
    if (emailError) {
      setError(emailError);
      setEmailError(emailError);
      return false;
    }
    if (!form.workingProvinceId) {
      setError('Çalıştığı il zorunludur.');
      return false;
    }
    if (!form.workingDistrictId) {
      setError('Çalıştığı ilçe zorunludur.');
      return false;
    }
    if (!form.institutionId) {
      setError('Çalıştığı kurum zorunludur.');
      return false;
    }
    if (!form.positionTitle) {
      setError('Kadro ünvanı zorunludur.');
      return false;
    }
    if (!form.branchId) {
      setError('Şube seçimi zorunludur.');
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
        birthplace: form.birthplace.trim() || undefined,
        gender: form.gender || undefined,
        educationStatus: form.educationStatus || undefined,
        // Çalışma Bilgileri (zorunlu alanlar)
        workingProvinceId: form.workingProvinceId, // Zorunlu
        workingDistrictId: form.workingDistrictId, // Zorunlu
        institutionId: form.institutionId, // Zorunlu
        positionTitle: form.positionTitle, // Zorunlu
        institutionRegNo: form.institutionRegNo.trim() || undefined,
        workUnit: form.workUnit.trim() || undefined,
        workUnitAddress: form.workUnitAddress.trim() || undefined,
        // Tevkifat
        tevkifatCenterId: form.tevkifatCenterId || undefined,
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
    <Box>
      {/* Başlık Bölümü */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <PersonAddIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Yeni Üye Başvurusu
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.875rem', sm: '0.9rem' },
              }}
            >
              Panel üzerinden yeni bir üye başvurusu oluşturun. Zorunlu alanlar: Ad, Soyad, Şube
            </Typography>
          </Box>
        </Box>
      </Box>

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
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Kişisel Bilgiler Bölümü */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ fontSize: '1.1rem', color: theme.palette.primary.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Kişisel Bilgiler
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ad *"
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Soyad *"
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="TC Kimlik No *"
                value={form.nationalId}
                onChange={(e) => handleChange('nationalId', e.target.value)}
                fullWidth
                required
                error={!!nationalIdError}
                inputProps={{ maxLength: 11, inputMode: 'numeric', pattern: '\\d*' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: nationalIdError ? 'error.main' : 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: nationalIdError ? (
                    <InputAdornment position="end">
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
                    </InputAdornment>
                  ) : null,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                  '& .MuiInputBase-input': {
                    minWidth: 0,
                    width: '100%',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Telefon"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                fullWidth
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                  '& .MuiInputBase-input': {
                    minWidth: 0,
                    width: '100%',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="E-posta"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                fullWidth
                type="email"
                error={!!emailError}
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Anne Adı"
                value={form.motherName}
                onChange={(e) => handleChange('motherName', e.target.value)}
                fullWidth
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Baba Adı"
                value={form.fatherName}
                onChange={(e) => handleChange('fatherName', e.target.value)}
                fullWidth
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Doğum Yeri"
                value={form.birthplace}
                onChange={(e) => handleChange('birthplace', e.target.value)}
                fullWidth
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
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Cinsiyet</InputLabel>
                <Select
                  label="Cinsiyet"
                  value={form.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  <MenuItem value="MALE">Erkek</MenuItem>
                  <MenuItem value="FEMALE">Kadın</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Öğrenim Durumu</InputLabel>
                <Select
                  label="Öğrenim Durumu"
                  value={form.educationStatus}
                  onChange={(e) => handleChange('educationStatus', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SchoolIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  <MenuItem value="PRIMARY">İlkokul</MenuItem>
                  <MenuItem value="HIGH_SCHOOL">Lise</MenuItem>
                  <MenuItem value="COLLEGE">Yüksekokul/Üniversite</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
          </Grid>

          {/* Bölge Bilgileri */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocationOnIcon sx={{ fontSize: '1.1rem', color: theme.palette.success.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bölge Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İl</InputLabel>
                <Select
                  label="İl"
                  value={form.provinceId}
                  onChange={(e) =>
                    handleChange('provinceId', e.target.value as string)
                  }
                  disabled={provinceDisabled}
                  startAdornment={
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {provinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                disabled={!form.provinceId}
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>İlçe</InputLabel>
                <Select
                  label="İlçe"
                  value={form.districtId}
                  onChange={(e) =>
                    handleChange('districtId', e.target.value as string)
                  }
                  disabled={districtDisabled || !form.provinceId}
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">
                    <em>Seçilmedi</em>
                  </MenuItem>
                  {districts.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

          </Grid>

          {/* Çalışma Bilgileri */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.warning.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WorkIcon sx={{ fontSize: '1.1rem', color: theme.palette.warning.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Çalışma Bilgileri
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Çalıştığı İl</InputLabel>
                <Select
                  label="Çalıştığı İl"
                  value={form.workingProvinceId}
                  onChange={(e) => handleChange('workingProvinceId', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <PlaceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  {workingProvinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth 
                disabled={!form.workingProvinceId}
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Çalıştığı İlçe</InputLabel>
                <Select
                  label="Çalıştığı İlçe"
                  value={form.workingDistrictId}
                  onChange={(e) => handleChange('workingDistrictId', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <LocationOnIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  {workingDistricts.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Kurum</InputLabel>
                <Select
                  label="Kurum"
                  value={form.institutionId}
                  onChange={(e) => handleChange('institutionId', e.target.value)}
                  disabled={!form.workingProvinceId}
                  startAdornment={
                    <InputAdornment position="start">
                      <AccountBalanceIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  {filteredInstitutions.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Kadro Ünvanı</InputLabel>
                <Select
                  label="Kadro Ünvanı"
                  value={form.positionTitle}
                  onChange={(e) => handleChange('positionTitle', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <WorkIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  <MenuItem value="KADRO_657">Kadro 657</MenuItem>
                  <MenuItem value="SOZLESMELI_4B">Sözleşmeli 4/B</MenuItem>
                  <MenuItem value="KADRO_663">Kadro 663</MenuItem>
                  <MenuItem value="AILE_HEKIMLIGI">Aile Hekimliği</MenuItem>
                  <MenuItem value="UNVAN_4924">Unvan 4924</MenuItem>
                  <MenuItem value="DIGER_SAGLIK_PERSONELI">Diğer Sağlık Personeli</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Kurum Sicil No"
                value={form.institutionRegNo}
                onChange={(e) => handleChange('institutionRegNo', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Görev Yaptığı Birim"
                value={form.workUnit}
                onChange={(e) => handleChange('workUnit', e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CorporateFareIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Birim Adresi"
                value={form.workUnitAddress}
                onChange={(e) => handleChange('workUnitAddress', e.target.value)}
                fullWidth
                multiline
                rows={3}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HomeIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', mt: 1 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
          </Grid>

          {/* Şube ve Tevkifat */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: '1.1rem', color: theme.palette.secondary.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Şube ve Tevkifat
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                required
                sx={{
                  minWidth: 200,
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
                  <MenuItem value="">Seçiniz</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name} {branch.code ? `(${branch.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl 
                fullWidth
                sx={{
                  minWidth: 200,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              >
                <InputLabel>Tevkifat Merkezi</InputLabel>
                <Select
                  label="Tevkifat Merkezi"
                  value={form.tevkifatCenterId}
                  onChange={(e) => handleChange('tevkifatCenterId', e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <CorporateFareIcon sx={{ color: 'text.secondary', fontSize: '1.2rem', ml: 1 }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Seçilmedi</MenuItem>
                  {tevkifatCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Dosya Yükleme */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 2 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadFileIcon sx={{ fontSize: '1.1rem', color: theme.palette.success.main }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Belgeler
            </Typography>
          </Box>

          <Grid container spacing={3}>
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
              justifyContent: 'flex-end', 
              gap: 2, 
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={saving}
              startIcon={<ArrowBackIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
              }}
            >
              Geri
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                },
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