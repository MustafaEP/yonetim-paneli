import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  alpha,
  useTheme,
  Stack,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  Tooltip,
  IconButton,
  Grid,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';
import GetAppIcon from '@mui/icons-material/GetApp';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import PlaceIcon from '@mui/icons-material/Place';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { getMemberById, exportMemberDetailToPdf, updateMember, approveMember, rejectMember, getMemberHistory } from '../../api/membersApi';
import httpClient from '../../api/httpClient';
import MemberStatusChangeDialog from '../../components/members/MemberStatusChangeDialog';
import PromoteToPanelUserDialog from '../../components/members/PromoteToPanelUserDialog';
import MemberApprovalDialog, { type ApproveFormData } from '../../components/members/MemberApprovalDialog';
import { ActivateMemberButton } from '../../components/members/ActivateMemberButton';
import { getMemberPayments } from '../../api/paymentsApi';
import { getPanelUserApplications } from '../../api/panelUserApplicationsApi';
import { 
  getMemberDocuments, 
  uploadMemberDocument,
  generateDocument,
  getDocumentTemplates,
  type MemberDocument,
  type DocumentTemplate,
  type GenerateDocumentDto,
} from '../../api/documentsApi';
import { getDocumentTypeLabel, DOCUMENT_TYPES } from '../../utils/documentTypes';
import type { MemberDetail, MemberStatus, MemberHistory } from '../../types/member';
import type { MemberPayment } from '../../api/paymentsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getUserById, updateUserRoles } from '../../api/usersApi';
import { getRoles } from '../../api/rolesApi';
import type { CustomRole } from '../../types/role';
import type { UserDetail } from '../../types/user';
import type { UserScope, Province, District } from '../../types/region';
import { getUserScopes, getProvinces, getDistricts, createUserScope, updateUserScope, deleteUserScope } from '../../api/regionsApi';
import UserRolesDialog from '../../components/users/UserRolesDialog';
import UserPermissionsSection from '../../components/users/UserPermissionsSection';
import { canManageBranches } from '../../utils/permissions';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BookIcon from '@mui/icons-material/Book';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const MemberDetailPage = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const source = searchParams.get('source'); // 'application' veya 'waiting'
  const { hasPermission } = useAuth();
  const toast = useToast();

  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loadingMember, setLoadingMember] = useState(true);
  const [payments, setPayments] = useState<MemberPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [documents, setDocuments] = useState<MemberDocument[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [memberHistory, setMemberHistory] = useState<MemberHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // PDF görüntüleme dialog state
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Panel kullanıcı detay state'leri
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [scopes, setScopes] = useState<UserScope[]>([]);
  const [loadingScopes, setLoadingScopes] = useState(false);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  
  // Scope yönetimi state'leri
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [scopeSaving, setScopeSaving] = useState(false);
  const [scopeProvinces, setScopeProvinces] = useState<Province[]>([]);
  const [scopeDistricts, setScopeDistricts] = useState<District[]>([]);
  const [editingScope, setEditingScope] = useState<UserScope | null>(null);
  const [scopeForm, setScopeForm] = useState<{ provinceId: string; districtId: string }>({ provinceId: '', districtId: '' });
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);

  const canUploadDocument = hasPermission('DOCUMENT_GENERATE_PDF');
  const canChangeStatus = hasPermission('MEMBER_STATUS_CHANGE');
  const canViewMember = hasPermission('MEMBER_VIEW');
  const canCreatePanelUserApplication = hasPermission('PANEL_USER_APPLICATION_CREATE');
  const canAssignRole = hasPermission('USER_ASSIGN_ROLE');
  const { user: currentUser } = useAuth();
  const isBranchManager = canManageBranches(currentUser);

  // Panel kullanıcı başvurusu state
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | null>(null);

  // Durum değiştirme dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Evrak ekleme dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('UPLOADED');
  const [description, setDescription] = useState<string>('');
  const [customFileName, setCustomFileName] = useState<string>('');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Üye başvurusu onaylama dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [initialApproveFormData, setInitialApproveFormData] = useState<Partial<ApproveFormData> | undefined>(undefined);

  // Reddetme dialog state'i
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  // Member verisini yükle
  const loadMember = async () => {
    if (!id) return;
    setLoadingMember(true);
    try {
      const data = await getMemberById(id);
      setMember(data);
      
      // Eğer üye bir panel kullanıcısıysa, tam kullanıcı detaylarını yükle
      if (data.user?.id) {
        loadUserDetail(data.user.id);
        loadUserScopes(data.user.id);
      }
    } catch (error) {
      console.error('Üye detayı alınırken hata:', error);
    } finally {
      setLoadingMember(false);
    }
  };

  useEffect(() => {
    loadMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Panel kullanıcı detaylarını yükle
  const loadUserDetail = async (userId: string) => {
    setLoadingUserDetail(true);
    try {
      const data = await getUserById(userId);
      setUserDetail(data);
      
      // Rolleri detaylı olarak çek
      if (data.roles && data.roles.length > 0) {
        try {
          const allRoles = await getRoles();
          const userRoleDetails = allRoles
            .filter((r): r is CustomRole => 'id' in r && data.roles.some(roleName => typeof roleName === 'string' && r.name === roleName))
            .map(r => r as CustomRole);
          setRoles(userRoleDetails);
        } catch (e) {
          console.error('Roller alınırken hata:', e);
        }
      }
    } catch (e) {
      console.error('Kullanıcı detay alınırken hata:', e);
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // Kullanıcı scope'larını yükle
  const loadUserScopes = async (userId: string) => {
    setLoadingScopes(true);
    try {
      const data = await getUserScopes(userId);
      const safe = Array.isArray(data) ? data : [];
      setScopes(safe);
    } catch (e) {
      console.error('User scope alınırken hata:', e);
      setScopes([]);
    } finally {
      setLoadingScopes(false);
    }
  };

  // Ödemeleri yükle
  useEffect(() => {
    if (!id) return;

    const loadPayments = async () => {
      setLoadingPayments(true);
      try {
        const data = await getMemberPayments(id);
        setPayments(data);
      } catch (error) {
        console.error('Ödemeler alınırken hata:', error);
      } finally {
        setLoadingPayments(false);
      }
    };

    loadPayments();
  }, [id]);

  // Evrakları yükle
  useEffect(() => {
    if (!id) return;

    const loadDocuments = async () => {
      setLoadingDocuments(true);
      try {
        const data = await getMemberDocuments(id);
        setDocuments(data);
      } catch (error) {
        console.error('Evraklar alınırken hata:', error);
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [id]);

  // Üye geçmişini yükle
  useEffect(() => {
    if (!id) return;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const data = await getMemberHistory(id);
        setMemberHistory(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Üye geçmişi alınırken hata:', error);
        setMemberHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [id]);

  // Panel kullanıcı başvurusu kontrolü
  useEffect(() => {
    if (!member?.id) return;

    const checkApplication = async () => {
      try {
        const applications = await getPanelUserApplications();
        const memberApp = applications.find(app => app.memberId === member.id);
        if (memberApp) {
          setHasApplication(true);
          setApplicationStatus(memberApp.status);
          
          // Eğer başvuru onaylandıysa ve member'da user yoksa, member'ı yeniden yükle
          if (memberApp.status === 'APPROVED' && !member.user?.id) {
            // Member'ı yeniden yükle
            const updatedMember = await getMemberById(member.id);
            setMember(updatedMember);
            
            // Eğer artık user varsa, user detaylarını yükle
            if (updatedMember.user?.id) {
              loadUserDetail(updatedMember.user.id);
              loadUserScopes(updatedMember.user.id);
            }
          }
        } else {
          setHasApplication(false);
          setApplicationStatus(null);
        }
      } catch (e) {
        console.error('Başvuru kontrolü hatası:', e);
      }
    };
    checkApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id]);

  // Rol güncelleme handler
  const handleSaveRoles = async (customRoleIds: string[]) => {
    if (!userDetail) return;
    try {
      const updated = await updateUserRoles(userDetail.id, customRoleIds);
      setUserDetail(updated);
      
      // Rolleri yeniden yükle
      if (updated.roles && updated.roles.length > 0) {
        try {
          const allRoles = await getRoles();
          const userRoleDetails = allRoles
            .filter((r): r is CustomRole => 'id' in r && updated.roles.some(roleName => typeof roleName === 'string' && r.name === roleName))
            .map(r => r as CustomRole);
          setRoles(userRoleDetails);
        } catch (e) {
          console.error('Roller alınırken hata:', e);
        }
      } else {
        setRoles([]);
      }
    } catch (e) {
      console.error('Kullanıcı rolleri güncellenirken hata:', e);
      throw e;
    }
  };

  // Scope yönetimi handler'ları
  const handleScopeFormChange = (field: 'provinceId' | 'districtId', value: string) => {
    setScopeForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'provinceId' ? { districtId: '' } : {}),
    }));
  };

  // Scope dialog açıldığında & il değiştiğinde alt verileri yükle
  useEffect(() => {
    const loadForProvince = async () => {
      const provinceId = scopeForm.provinceId;
      if (!provinceId) {
        setScopeDistricts([]);
        return;
      }

      try {
        const districts = await getDistricts(provinceId);
        setScopeDistricts(districts);
      } catch (e) {
        console.error('Scope province change load error:', e);
      }
    };

    if (scopeDialogOpen) {
      loadForProvince();
    }
  }, [scopeForm.provinceId, scopeDialogOpen]);

  // Scope dialog aç/kapat
  const openScopeDialog = async (scope?: UserScope) => {
    setEditingScope(scope || null);
    setScopeDialogOpen(true);
    setScopeSaving(false);
    
    if (scope) {
      setScopeForm({
        provinceId: scope.province?.id || '',
        districtId: scope.district?.id || '',
      });
    } else {
      setScopeForm({
        provinceId: '',
        districtId: '',
      });
    }

    try {
      const provinces = await getProvinces();
      setScopeProvinces(provinces);
      
      if (scope?.province?.id) {
        try {
          const districts = await getDistricts(scope.province.id);
          setScopeDistricts(districts);
        } catch (e) {
          console.error('Districts load error (scope dialog):', e);
          setScopeDistricts([]);
        }
      } else {
        setScopeDistricts([]);
      }
    } catch (e) {
      console.error('Provinces load error (scope dialog):', e);
    }
  };

  const closeScopeDialog = () => {
    if (scopeSaving) return;
    setScopeDialogOpen(false);
    setEditingScope(null);
    setScopeForm({
      provinceId: '',
      districtId: '',
    });
  };

  // Scope save (ekleme veya güncelleme)
  const handleScopeSave = async () => {
    if (!userDetail?.id) return;
    const { provinceId, districtId } = scopeForm;

    if (!provinceId && !districtId) {
      toast.showWarning('En az bir yetki alanı (il veya ilçe) seçmelisiniz.');
      return;
    }

    setScopeSaving(true);
    try {
      const payload: { provinceId?: string; districtId?: string } = {};

      if (provinceId && provinceId.trim() !== '') {
        payload.provinceId = provinceId;
      }

      if (districtId && districtId.trim() !== '') {
        payload.districtId = districtId;
      }

      if (editingScope) {
        await updateUserScope(editingScope.id, payload);
        toast.showSuccess('Yetki alanı başarıyla güncellendi.');
      } else {
        await createUserScope({
          userId: userDetail.id,
          ...payload,
        });
        toast.showSuccess('Yetki alanı başarıyla eklendi.');
      }

      await loadUserScopes(userDetail.id);
      closeScopeDialog();
    } catch (e: any) {
      console.error('Scope kaydedilirken hata:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 
        (editingScope ? 'Yetki alanı güncellenirken bir hata oluştu.' : 'Yetki alanı eklenirken bir hata oluştu.');
      toast.showError(errorMessage);
    } finally {
      setScopeSaving(false);
    }
  };

  // Scope silme
  const handleDeleteScope = async (scopeId: string) => {
    if (!window.confirm('Bu yetki alanını silmek istediğinize emin misiniz?')) return;

    try {
      await deleteUserScope(scopeId);
      if (userDetail?.id) {
        await loadUserScopes(userDetail.id);
      }
      toast.showSuccess('Yetki alanı başarıyla silindi.');
    } catch (e) {
      console.error('Scope silinirken hata:', e);
      toast.showError('Yetki alanı silinirken bir hata oluştu.');
    }
  };

  const formatScopeRow = (scope: UserScope) => {
    if (scope.district) {
      return {
        type: 'İlçe',
        description: `${scope.province?.name ?? ''} / ${scope.district.name}`,
      };
    }
    if (scope.province) {
      return {
        type: 'İl',
        description: `${scope.province.name}`,
      };
    }
    return {
      type: '-',
      description: '-',
    };
  };

  // Evrak yükleme handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Sadece PDF dosyalarını kabul et
      if (file.type !== 'application/pdf') {
        toast.showError('Sadece PDF dosyaları yüklenebilir');
        return;
      }
      setSelectedFile(file);
      // Dosya adından doküman tipini çıkar (opsiyonel)
      if (!documentType || documentType === 'UPLOADED') {
        const fileName = file.name.toLowerCase();
        if (fileName.includes('kayit') || fileName.includes('uye')) {
          setDocumentType('MEMBER_REGISTRATION');
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!id || !selectedFile) return;

    setUploading(true);
    try {
      const fileName = customFileName.trim() || selectedFile.name.replace(/\.pdf$/i, '');
      await uploadMemberDocument(id, selectedFile, documentType, description, fileName);
      toast.showSuccess('Evrak başarıyla yüklendi');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDocumentType('UPLOADED');
      setDescription('');
      setCustomFileName('');
      // Evrakları yeniden yükle
      const data = await getMemberDocuments(id);
      setDocuments(data);
    } catch (error: any) {
      console.error('Evrak yüklenirken hata:', error);
      toast.showError(error.response?.data?.message || 'Evrak yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getDocumentTemplates();
      setTemplates(data.filter(t => t.isActive));
    } catch (error: any) {
      console.error('Şablonlar yüklenirken hata:', error);
      toast.showError('Şablonlar yüklenirken bir hata oluştu');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleOpenGenerateDialog = () => {
    setGenerateDialogOpen(true);
    setSelectedTemplate(null);
    loadTemplates();
  };

  // Ekstra değişkenler için state
  const [extraVariables, setExtraVariables] = useState<Record<string, string>>({});

  const handleGenerate = async () => {
    if (!id || !selectedTemplate) return;

    // Boş değişkenleri kontrol et
    const emptyVars = Object.entries(extraVariables).filter(([_, value]) => !value || value.trim() === '');
    if (emptyVars.length > 0) {
      const emptyVarNames = emptyVars.map(([key]) => key).join(', ');
      toast.showError(`Lütfen tüm alanları doldurun: ${emptyVarNames}`);
      return;
    }

    setGenerating(true);
    try {
      const payload: GenerateDocumentDto = {
        memberId: id,
        templateId: selectedTemplate.id,
        variables: Object.keys(extraVariables).length > 0 ? extraVariables : undefined,
      };
      await generateDocument(payload);
      toast.showSuccess('PDF evrak başarıyla oluşturuldu');
      setGenerateDialogOpen(false);
      setSelectedTemplate(null);
      setExtraVariables({});
      // Evrakları yeniden yükle
      const data = await getMemberDocuments(id);
      setDocuments(data);
    } catch (error: any) {
      console.error('PDF oluşturulurken hata:', error);
      toast.showError(error.response?.data?.message || 'PDF oluşturulurken bir hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  // Template'den ekstra değişkenleri çıkar
  const getExtraVariablesFromTemplate = (template: DocumentTemplate): string[] => {
    const standardVars = new Set([
      'firstName', 'lastName', 'fullName', 'memberNumber', 'nationalId', 'phone', 'email',
      'province', 'district', 'institution', 'branch', 'date', 'joinDate',
      'applicationDate', 'validUntil', 'birthPlace', 'gender', 'educationStatus',
      'position', 'workUnitAddress',
      'birthDate', 'motherName', 'fatherName',
      'dutyUnit', 'institutionAddress',
      'boardDecisionDate', 'boardDecisionBookNo',
      'membershipInfoOption', 'memberGroup'
    ]);

    const varRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const foundVars = new Set<string>();
    let match;

    while ((match = varRegex.exec(template.template)) !== null) {
      const varName = match[1];
      if (!standardVars.has(varName)) {
        foundVars.add(varName);
      }
    }

    return Array.from(foundVars);
  };

  // Değişken adlarını Türkçe etiketlere çevir
  const getVariableLabel = (varName: string): string => {
    const labels: Record<string, string> = {
      'oldProvince': 'Eski İl',
      'oldDistrict': 'Eski İlçe',
      'oldInstitution': 'Eski Kurum',
      'oldBranch': 'Eski Şube',
      'transferReason': 'Nakil Nedeni',
      'eventDate': 'Etkinlik Tarihi',
      'eventPlace': 'Etkinlik Yeri',
      'eventName': 'Etkinlik Adı',
      'eventDescription': 'Etkinlik Açıklaması',
      'invitationDate': 'Davet Tarihi',
      'meetingDate': 'Toplantı Tarihi',
      'meetingPlace': 'Toplantı Yeri',
      'subject': 'Konu',
      'reason': 'Sebep',
      'description': 'Açıklama',
    };
    
    // Eğer tanımlıysa label kullan, yoksa camelCase'i boşluklarla ayır
    return labels[varName] || varName.replace(/([A-Z])/g, ' $1').trim();
  };

  // Durum değiştirme handler
  const handleStatusChange = async (status: MemberStatus, reason?: string) => {
    if (!id || !member) return;

    setUpdatingStatus(true);
    try {
      const updateData: any = { status };
      if (reason && (status === 'RESIGNED' || status === 'EXPELLED')) {
        updateData.cancellationReason = reason;
      }
      await updateMember(id, updateData);
      toast.showSuccess('Üye durumu başarıyla güncellendi');
      setStatusDialogOpen(false);
      // Üye bilgilerini yeniden yükle
      const updatedMember = await getMemberById(id);
      setMember(updatedMember);
    } catch (error: any) {
      console.error('Durum güncellenirken hata:', error);
      toast.showError(error.response?.data?.message || 'Durum güncellenirken bir hata oluştu');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Onaylama dialog'unu aç ve verileri yükle
  const handleOpenApproveDialog = async () => {
    if (!id || !member) return;
    
    // Form'u mevcut üye bilgileriyle doldur
    setInitialApproveFormData({
      registrationNumber: member.registrationNumber || '',
      boardDecisionDate: member.boardDecisionDate || '',
      boardDecisionBookNo: member.boardDecisionBookNo || '',
      tevkifatCenterId: member.tevkifatCenter?.id || '',
      tevkifatTitleId: member.tevkifatTitle?.id || '',
      branchId: member.branch?.id || '',
      memberGroupId: member.memberGroup?.id || '',
    });
    
    setApproveDialogOpen(true);
  };

  // Üye başvurusu onaylama handler (source=application için)
  const handleApproveApplication = async (data: ApproveFormData) => {
    if (!id || !member) return;

    setUpdatingStatus(true);
    try {
      const approveData = {
        registrationNumber: data.registrationNumber.trim(),
        boardDecisionDate: data.boardDecisionDate,
        boardDecisionBookNo: data.boardDecisionBookNo.trim(),
        tevkifatCenterId: data.tevkifatCenterId,
        tevkifatTitleId: data.tevkifatTitleId,
        branchId: data.branchId,
        memberGroupId: data.memberGroupId,
      };

      await approveMember(id, approveData);
      toast.showSuccess('Üye başvurusu başarıyla onaylandı. Üye bekleyen üyeler listesine eklendi.');
      setApproveDialogOpen(false);
      setInitialApproveFormData(undefined);

      // Üye bilgilerini yeniden yükle
      const updatedMember = await getMemberById(id);
      setMember(updatedMember);
    } catch (error: any) {
      console.error('Başvuru onaylanırken hata:', error);
      toast.showError(error.response?.data?.message || 'Başvuru onaylanırken bir hata oluştu');
      throw error; // Re-throw so the dialog can handle it
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Üye aktifleştirildikten sonra callback
  const handleMemberActivated = async () => {
    if (!id) return;
    // Üye bilgilerini yeniden yükle
    await loadMember();
    // Source parametresini kaldırarak URL'i güncelle
    navigate(`/members/${id}`, { replace: true });
  };

  // Reddetme dialog'unu açma
  const handleOpenRejectDialog = () => {
    setRejectDialogOpen(true);
  };

  // Üye başvurusu reddetme handler (source=application için)
  const handleRejectApplication = async () => {
    if (!id || !member) return;
    setUpdatingStatus(true);
    setRejectDialogOpen(false);
    try {
      await rejectMember(id);
      toast.showSuccess('Üye başvurusu başarıyla reddedildi');
      const updatedMember = await getMemberById(id);
      setMember(updatedMember);
    } catch (error: any) {
      console.error('Başvuru reddedilirken hata:', error);
      toast.showError(error.response?.data?.message || 'Başvuru reddedilirken bir hata oluştu');
    } finally {
      setUpdatingStatus(false);
    }
  };



  if (loadingMember) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Üye bulunamadı
      </Alert>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs: any = {
      ACTIVE: {
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Aktif',
        bgColor: alpha(theme.palette.success.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.95)} 0%, ${theme.palette.success.dark} 100%)`,
        headerShadow: theme.palette.success.main,
      },
      PENDING: {
        color: 'warning',
        icon: <WarningIcon fontSize="small" />,
        label: 'Beklemede',
        bgColor: alpha(theme.palette.warning.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.95)} 0%, ${theme.palette.warning.dark} 100%)`,
        headerShadow: theme.palette.warning.main,
      },
      APPROVED: {
        color: 'info',
        icon: <CheckCircleIcon fontSize="small" />,
        label: 'Onaylanmış',
        bgColor: alpha(theme.palette.info.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.95)} 0%, ${theme.palette.info.dark} 100%)`,
        headerShadow: theme.palette.info.main,
      },
      REJECTED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'Reddedildi',
        bgColor: alpha(theme.palette.error.main, 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.95)} 0%, ${theme.palette.error.dark} 100%)`,
        headerShadow: theme.palette.error.main,
      },
      EXPELLED: {
        color: 'error',
        icon: <CancelIcon fontSize="small" />,
        label: 'İhraç',
        bgColor: alpha('#d32f2f', 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha('#d32f2f', 0.95)} 0%, #b71c1c 100%)`,
        headerShadow: '#d32f2f',
      },
      RESIGNED: {
        color: 'default',
        icon: <CancelIcon fontSize="small" />,
        label: 'İstifa',
        bgColor: alpha(theme.palette.grey[500], 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha(theme.palette.grey[600], 0.95)} 0%, ${theme.palette.grey[800]} 100%)`,
        headerShadow: theme.palette.grey[600],
      },
      INACTIVE: {
        color: 'default',
        icon: <CancelIcon fontSize="small" />,
        label: 'Pasif',
        bgColor: alpha('#9e9e9e', 0.1),
        headerGradient: `linear-gradient(135deg, ${alpha('#757575', 0.95)} 0%, #616161 100%)`,
        headerShadow: '#757575',
      },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(member?.status || 'PENDING');

  // İstatistik hesaplama fonksiyonları
  const calculateMembershipDuration = () => {
    if (!member?.createdAt) return null;
    const created = new Date(member.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) {
      return `${years} yıl${months > 0 ? ` ${months} ay` : ''}${days > 0 ? ` ${days} gün` : ''}`;
    } else if (months > 0) {
      return `${months} ay${days > 0 ? ` ${days} gün` : ''}`;
    } else {
      return `${days} gün`;
    }
  };

  const calculateApprovalDuration = () => {
    if (!member?.createdAt || !member?.approvedAt) return null;
    const created = new Date(member.createdAt);
    const approved = new Date(member.approvedAt);
    const diffMs = approved.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} gün${diffHours > 0 ? ` ${diffHours} saat` : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} saat`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes} dakika`;
    }
  };

  const calculateActiveMembershipDuration = () => {
    if (!memberHistory || memberHistory.length === 0) return null;
    
    // Status değişikliklerini bul
    const statusChanges = memberHistory.filter(h => 
      h.updatedFields && 'status' in h.updatedFields
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (statusChanges.length === 0) {
      // Eğer hiç status değişikliği yoksa ve mevcut durum ACTIVE ise, kayıt tarihinden itibaren
      if (member?.status === 'ACTIVE' && member?.createdAt) {
        return calculateMembershipDuration();
      }
      return null;
    }
    
    // En son ACTIVE olma tarihini bul
    const lastActiveChange = statusChanges.find(h => 
      h.updatedFields && 'status' in h.updatedFields && 
      (h.updatedFields.status as any)?.new === 'ACTIVE'
    );
    
    if (lastActiveChange) {
      const activeDate = new Date(lastActiveChange.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - activeDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      const days = diffDays % 30;
      
      if (years > 0) {
        return `${years} yıl${months > 0 ? ` ${months} ay` : ''}${days > 0 ? ` ${days} gün` : ''}`;
      } else if (months > 0) {
        return `${months} ay${days > 0 ? ` ${days} gün` : ''}`;
      } else {
        return `${days} gün`;
      }
    }
    
    return null;
  };

  const getStatusChangeCount = () => {
    if (!memberHistory) return 0;
    return memberHistory.filter(h => 
      h.updatedFields && 'status' in h.updatedFields
    ).length;
  };

  const getLastStatusChangeDate = () => {
    if (!memberHistory || memberHistory.length === 0) return null;
    const statusChanges = memberHistory.filter(h => 
      h.updatedFields && 'status' in h.updatedFields
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (statusChanges.length > 0) {
      return new Date(statusChanges[0].createdAt);
    }
    return null;
  };

  const getLastActivityDate = () => {
    if (!memberHistory || memberHistory.length === 0) return null;
    const sorted = [...memberHistory].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.length > 0 ? new Date(sorted[0].createdAt) : null;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoRow = ({ label, value, icon }: { label: string; value: string | number | null | undefined; icon?: React.ReactNode }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        transition: 'all 0.2s ease',
        bgcolor: alpha(theme.palette.divider, 0.02),
        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderColor: alpha(theme.palette.primary.main, 0.15),
          transform: 'translateX(2px)',
        },
      }}
    >
      {icon && (
        <Box
          sx={{
            color: theme.palette.primary.main,
            mt: 0.2,
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.1rem',
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            fontSize: '0.65rem',
            display: 'block',
            mb: 0.4,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontSize: '0.875rem',
            wordBreak: 'break-word',
          }}
        >
          {value || '-'}
        </Typography>
      </Box>
    </Box>
  );

  const SectionCard = ({
    title,
    icon,
    children,
    actions,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        '&:hover': {
          boxShadow: `0 12px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.primary.light, 0.03)} 100%)`,
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.35)}`,
              transition: 'transform 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.15rem',
              color: theme.palette.text.primary,
              letterSpacing: 0.2,
            }}
          >
            {title}
          </Typography>
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions}
          </Box>
        )}
      </Box>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: (theme) => 
        theme.palette.mode === 'light' 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`
          : theme.palette.background.default,
      pb: 4,
      maxWidth: 1400,
      mx: 'auto',
      p: { xs: 2, sm: 3 }
    }}>
      {/* Header Card */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 4,
          background: statusConfig.headerGradient,
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          border: 'none',
          boxShadow: `0 12px 40px ${alpha(statusConfig.headerShadow, 0.35)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 4,
            padding: '2px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          },
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
        
        <CardContent sx={{ p: { xs: 2.5, sm: 4 }, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: { xs: 2, sm: 3 } }}>
            <Avatar
              sx={{
                width: { xs: 64, sm: 90 },
                height: { xs: 64, sm: 90 },
                fontSize: { xs: '1.6rem', sm: '2.2rem' },
                fontWeight: 700,
                bgcolor: alpha('#fff', 0.2),
                border: `4px solid ${alpha('#fff', 0.3)}`,
                boxShadow: `0 8px 24px ${alpha('#000', 0.25)}`,
              }}
            >
              {member?.firstName?.[0] || ''}
              {member?.lastName?.[0] || ''}
            </Avatar>

            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                    wordBreak: 'break-word',
                    ...(member?.user && {
                      textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      position: 'relative',
                    }),
                  }}
                >
                  {member?.firstName || ''} {member?.lastName || ''}
                </Typography>
                {member?.user && (
                  <Chip
                    icon={<SecurityIcon />}
                    label="Panel Kullanıcısı"
                    size="small"
                    sx={{
                      bgcolor: alpha('#fff', 0.25),
                      color: '#fff',
                      fontWeight: 700,
                      border: `2px solid ${alpha('#fff', 0.4)}`,
                      backdropFilter: 'blur(10px)',
                      boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
                      fontSize: '0.75rem',
                      height: 28,
                      '& .MuiChip-icon': { 
                        color: '#fff',
                        fontSize: '1rem',
                      },
                      animation: 'pulse 2s ease-in-out infinite',
                      '@keyframes pulse': {
                        '0%, 100%': {
                          transform: 'scale(1)',
                          boxShadow: `0 4px 12px ${alpha('#000', 0.2)}`,
                        },
                        '50%': {
                          transform: 'scale(1.02)',
                          boxShadow: `0 6px 16px ${alpha('#000', 0.3)}`,
                        },
                      },
                    }}
                  />
                )}
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.9, 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  wordBreak: 'break-word',
                }}
              >
                {member?.nationalId && `TC: ${member.nationalId}`}
                {member?.nationalId && member?.registrationNumber && ' • '}
                {member?.registrationNumber && `Kayıt No: ${member.registrationNumber}`}
              </Typography>

              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                size="small"
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  color: '#fff',
                  fontWeight: 600,
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  '& .MuiChip-icon': { color: '#fff' },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, width: { xs: '100%', sm: 'auto' } }}>
              {/* İlk Satır: Düzenle ve PDF İndir Butonları */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1.5}
              >
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/members/${id}/edit`)}
                  fullWidth={true}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#fff', 0.3)}`,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    py: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                    },
                    transition: 'all 0.3s ease',
                    display: { xs: 'flex', sm: 'inline-flex' },
                  }}
                >
                  Düzenle
                </Button>
                {canChangeStatus && member?.status !== 'PENDING' && member?.status !== 'APPROVED' && (
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  onClick={() => setStatusDialogOpen(true)}
                  fullWidth={true}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: '#fff',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha('#fff', 0.3)}`,
                    fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                    py: { xs: 1, sm: 1.5 },
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 16px ${alpha('#000', 0.3)}`,
                    },
                    transition: 'all 0.3s ease',
                    display: { xs: 'flex', sm: 'inline-flex' },
                  }}
                >
                  Durum Değiştir
                </Button>
              )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Panel Kullanıcı Bilgileri - Detaylı */}
      {member.user ? (
        <>
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.08)}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon sx={{ fontSize: '1.5rem', color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                  Panel Kullanıcı Bilgileri
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                    Ad Soyad
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {member.user.firstName} {member.user.lastName}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                    E-posta Adresi
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                    {member.user.email}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.5,
                    borderRadius: 2,
                    background: alpha(theme.palette.primary.main, 0.04),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                    Hesap Durumu
                  </Typography>
                  <Chip
                    icon={member.user.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                    label={member.user.isActive ? 'Aktif' : 'Pasif'}
                    color={member.user.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Paper>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Roller Bölümü */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SecurityIcon sx={{ fontSize: '1.25rem', color: theme.palette.primary.main, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Roller</Typography>
                  </Box>
                  {canAssignRole && userDetail && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => setRolesDialogOpen(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Rolleri Düzenle
                    </Button>
                  )}
                </Box>
                {loadingUserDetail ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userDetail?.roles && userDetail.roles.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userDetail.roles.map((roleName) => {
                      const roleDetail = roles.find(r => r.name === roleName);
                      return (
                        <Box key={roleName} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip 
                            label={roleName} 
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              height: 32,
                            }}
                          />
                          {roleDetail?.districtId && roleDetail?.district ? (
                            <Chip
                              icon={<LocationOnIcon />}
                              label={`${roleDetail.district.name} (İlçe)`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: '0.9rem' } }}
                            />
                          ) : roleDetail?.provinceId && roleDetail?.province ? (
                            <Chip
                              icon={<LocationOnIcon />}
                              label={`${roleDetail.province.name} (İl)`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', '& .MuiChip-icon': { fontSize: '0.9rem' } }}
                            />
                          ) : null}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: alpha(theme.palette.grey[500], 0.05),
                      border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                      Bu kullanıcıya henüz rol atanmamış.
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* İzinler Bölümü */}
              {userDetail && <UserPermissionsSection permissions={userDetail?.permissions} />}
            </CardContent>
          </Card>

          {/* Kullanıcı Scope'ları */}
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.info.main, 0.08)}`,
              overflow: 'hidden',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon sx={{ fontSize: '1.5rem', color: theme.palette.info.main, mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                      Yetki Alanları (Scope)
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    Bu kullanıcı, aşağıdaki il / ilçe / işyeri / anlaşmalı kurumlar üzerinde yetkilidir.
                  </Typography>
                </Box>

                {isBranchManager && userDetail && (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AddLocationIcon />}
                    onClick={() => openScopeDialog()}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                    }}
                  >
                    Scope Ekle
                  </Button>
                )}
              </Box>

              {loadingScopes ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : scopes.length === 0 ? null : (
                <Paper 
                  elevation={0}
                  sx={{ 
                    width: '100%', 
                    overflowX: 'auto',
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Tür</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: theme.palette.text.primary }}>Tanım</TableCell>
                        {isBranchManager && (
                          <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                            İşlemler
                          </TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {scopes.map((s) => {
                        const formatted = formatScopeRow(s);
                        return (
                          <TableRow 
                            key={s.id}
                            sx={{
                              '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.03) },
                              transition: 'all 0.2s',
                            }}
                          >
                            <TableCell>
                              <Chip
                                label={formatted.type}
                                size="small"
                                sx={{
                                  bgcolor: alpha(theme.palette.info.main, 0.1),
                                  color: theme.palette.info.main,
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocationOnIcon sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {formatted.description}
                                </Typography>
                              </Box>
                            </TableCell>
                            {isBranchManager && (
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Tooltip title="Düzenle" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => openScopeDialog(s)}
                                      sx={{
                                        color: theme.palette.primary.main,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                          transform: 'scale(1.1)',
                                        },
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Sil" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteScope(s.id)}
                                      sx={{
                                        color: theme.palette.error.main,
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                                          transform: 'scale(1.1)',
                                        },
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Scope Ekle Dialog */}
          <Dialog
            open={scopeDialogOpen}
            onClose={closeScopeDialog}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
              }
            }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AddLocationIcon sx={{ color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {editingScope ? 'Scope Düzenle' : 'Yeni Scope Ekle'}
                </Typography>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  En az bir alan (il veya ilçe) seçmelisiniz. Daha spesifik yetki vermek için il → ilçe şeklinde daraltabilirsiniz.
                </Typography>
              </Paper>

              <FormControl fullWidth>
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" />
                    İl
                  </Box>
                </InputLabel>
                <Select
                  label="İl"
                  value={scopeForm.provinceId}
                  onChange={(e) => handleScopeFormChange('provinceId', e.target.value as string)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  }}
                >
                  <MenuItem value=""><em>Seçilmedi</em></MenuItem>
                  {scopeProvinces.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.name} {p.code ? `(${p.code})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!scopeForm.provinceId}>
                <InputLabel>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnIcon fontSize="small" />
                    İlçe
                  </Box>
                </InputLabel>
                <Select
                  label="İlçe"
                  value={scopeForm.districtId}
                  onChange={(e) => handleScopeFormChange('districtId', e.target.value as string)}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-focused': {
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  }}
                >
                  <MenuItem value=""><em>Seçilmedi</em></MenuItem>
                  {scopeDistricts.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2.5, gap: 1 }}>
              <Button 
                onClick={closeScopeDialog} 
                disabled={scopeSaving}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                İptal
              </Button>
              <Button
                onClick={handleScopeSave}
                disabled={scopeSaving}
                variant="contained"
                startIcon={scopeSaving ? <CircularProgress size={16} /> : null}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, minWidth: 100 }}
              >
                {scopeSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Roller Dialog */}
          {userDetail && (
            <UserRolesDialog
              open={rolesDialogOpen}
              user={userDetail}
              onClose={() => setRolesDialogOpen(false)}
              onSave={handleSaveRoles}
            />
          )}
        </>
      ) : (
        <>
          {/* Terfi Et Kartı - Sadece panel kullanıcısı değilse ve koşullar uygunsa
              Not: Başvuru REJECTED ise tekrar başvuru yapılabilsin */}
          {(!hasApplication || applicationStatus === 'REJECTED') && canCreatePanelUserApplication && member?.status === 'ACTIVE' && (
            <Card
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: `2px dashed ${alpha(theme.palette.success.main, 0.3)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.02)} 100%)`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.success.main, 0.08)}`,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.success.main, 0.5),
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 28px ${alpha(theme.palette.success.main, 0.15)}`,
                },
              }}
            >
              {/* Dekoratif arka plan */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: alpha(theme.palette.success.main, 0.06),
                }}
              />
              
              <CardContent sx={{ p: { xs: 2.5, sm: 4 }, position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2.5,
                        background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: `0 4px 14px ${alpha(theme.palette.success.main, 0.35)}`,
                        flexShrink: 0,
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: '1.8rem' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, lineHeight: 1.3 }}>
                        Panel Kullanıcılığına Terfi Ettir
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, maxWidth: 500 }}>
                        Bu üyeye panel erişimi vererek sisteme giriş yapabilmesini ve yetkilendirilmiş işlemleri gerçekleştirebilmesini sağlayabilirsiniz.
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip 
                          icon={<CheckCircleIcon />} 
                          label="Aktif Üye" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          icon={<SecurityIcon />} 
                          label="Panel Erişimi Yok" 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<BadgeIcon />}
                    onClick={() => setPromoteDialogOpen(true)}
                    sx={{
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: theme.palette.success.main,
                      color: '#fff',
                      px: 3,
                      py: 1.5,
                      fontSize: '0.95rem',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        bgcolor: theme.palette.success.dark,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Terfi Ettir
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Başvuru Durumu Alert'leri */}
          {hasApplication && applicationStatus === 'PENDING' && (
            <Alert 
              severity="info" 
              icon={<WarningIcon />}
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                bgcolor: alpha(theme.palette.info.main, 0.08),
                '& .MuiAlert-icon': { 
                  fontSize: '1.5rem',
                  color: theme.palette.info.main,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Panel Kullanıcı Başvurusu Beklemede
              </Typography>
              <Typography variant="body2">
                Bu üye için oluşturulan panel kullanıcı başvurusu onay bekliyor.
              </Typography>
            </Alert>
          )}

          {hasApplication && applicationStatus === 'APPROVED' && (
            <Alert 
              severity="success"
              icon={<CheckCircleIcon />}
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                '& .MuiAlert-icon': { 
                  fontSize: '1.5rem',
                  color: theme.palette.success.main,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Panel Kullanıcı Başvurusu Onaylandı
              </Typography>
              <Typography variant="body2">
                Bu üye panel kullanıcısı olarak onaylanmış. Kullanıcı hesabı oluşturulmuş olmalı.
              </Typography>
            </Alert>
          )}

          {hasApplication && applicationStatus === 'REJECTED' && (
            <Alert 
              severity="warning"
              icon={<CancelIcon />}
              sx={{ 
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                bgcolor: alpha(theme.palette.warning.main, 0.08),
                '& .MuiAlert-icon': { 
                  fontSize: '1.5rem',
                  color: theme.palette.warning.main,
                },
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Panel Kullanıcı Başvurusu Reddedilmiştir
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Bu üye için oluşturulan panel kullanıcı başvurusu reddedilmiştir. İsterseniz tekrar panel kullanıcılığına terfi etme talebi oluşturabilirsiniz.
              </Typography>
            </Alert>
          )}
        </>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* İhraç/İstifa Açıklaması */}
        {(member?.status === 'EXPELLED' || member?.status === 'RESIGNED') && member?.cancellationReason && (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `2px solid ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.3
              )}`,
              background: `linear-gradient(135deg, ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.08
              )} 0%, ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.light : theme.palette.grey[400],
                0.05
              )} 100%)`,
              boxShadow: `0 4px 16px ${alpha(
                member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                0.15
              )}`,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${
                      member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600]
                    } 0%, ${
                      member.status === 'EXPELLED' ? theme.palette.error.dark : theme.palette.grey[800]
                    } 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 4px 12px ${alpha(
                      member.status === 'EXPELLED' ? theme.palette.error.main : theme.palette.grey[600],
                      0.3
                    )}`,
                    flexShrink: 0,
                  }}
                >
                  <CancelIcon sx={{ color: '#fff', fontSize: '1.5rem' }} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      color: member.status === 'EXPELLED' ? theme.palette.error.dark : theme.palette.grey[800],
                    }}
                  >
                    {member.status === 'EXPELLED' ? 'İhraç Nedeni' : 'İstifa Nedeni'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      lineHeight: 1.7,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {member.cancellationReason}
                  </Typography>
                  {member.cancelledAt && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 2,
                        color: theme.palette.text.secondary,
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Tarih: {new Date(member.cancelledAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Onaylama İşlemi Alanı - PENDING veya APPROVED durumları için */}
        {(member?.status === 'PENDING' || member?.status === 'APPROVED') && canChangeStatus && (
          <Card
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: 3,
              border: `2px dashed ${alpha(theme.palette.warning.main, 0.3)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.warning.light, 0.02)} 100%)`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.warning.main, 0.08)}`,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: alpha(theme.palette.warning.main, 0.5),
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 28px ${alpha(theme.palette.warning.main, 0.15)}`,
              },
            }}
          >
            {/* Dekoratif arka plan */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: alpha(theme.palette.warning.main, 0.06),
              }}
            />
            
            <CardContent sx={{ p: { xs: 2.5, sm: 4 }, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2.5,
                      background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: `0 4px 14px ${alpha(theme.palette.warning.main, 0.35)}`,
                      flexShrink: 0,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: '1.8rem' }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5, lineHeight: 1.3 }}>
                      {member?.status === 'PENDING' && 'Üye Başvurusu Onaylama'}
                      {member?.status === 'APPROVED' && 'Üyeyi Aktifleştirme'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.6, maxWidth: 500 }}>
                      {member?.status === 'PENDING' && 'Bu başvuruyu onaylayarak üyeyi bekleyen üyeler listesine ekleyebilir veya başvuruyu reddedebilirsiniz.'}
                      {member?.status === 'APPROVED' && 'Onaylanmış bu üyeyi aktif hale getirerek ana üye listesine ekleyebilirsiniz.'}
                    </Typography>
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        icon={statusConfig.icon} 
                        label={statusConfig.label}
                        size="small" 
                        color={statusConfig.color}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      {member?.status === 'PENDING' && (
                        <Chip 
                          icon={<AssignmentIcon />} 
                          label="Başvuru Aşamasında" 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                      {member?.status === 'APPROVED' && (
                        <Chip 
                          icon={<HourglassEmptyIcon />} 
                          label="Aktifleşme Bekliyor" 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                
                {/* Butonlar */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, minWidth: { xs: '100%', sm: 'auto' } }}>
                  {/* Üye Başvuruları için - PENDING durumu */}
                  {member?.status === 'PENDING' && (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<CheckCircleIcon />}
                        onClick={handleOpenApproveDialog}
                        disabled={updatingStatus}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          bgcolor: theme.palette.success.main,
                          color: '#fff',
                          px: 3,
                          py: 1.5,
                          fontSize: '0.95rem',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            bgcolor: theme.palette.success.dark,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Başvuruyu Onayla
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<CancelIcon />}
                        onClick={handleOpenRejectDialog}
                        disabled={updatingStatus}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 3,
                          py: 1.5,
                          fontSize: '0.95rem',
                          borderWidth: 2,
                          borderColor: theme.palette.error.main,
                          color: theme.palette.error.main,
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: theme.palette.error.dark,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Başvuruyu Reddet
                      </Button>
                    </>
                  )}

                  {/* Bekleyen Üyeler için - APPROVED durumu */}
                  {member?.status === 'APPROVED' && (
                    <>
                      <ActivateMemberButton
                        memberId={id!}
                        memberName={`${member.firstName} ${member.lastName}`}
                        onActivated={handleMemberActivated}
                        disabled={updatingStatus}
                        variant="contained"
                        size="large"
                      />
                      <Button
                        variant="outlined"
                        size="large"
                        startIcon={<CancelIcon />}
                        onClick={handleOpenRejectDialog}
                        disabled={updatingStatus}
                        sx={{
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontWeight: 700,
                          px: 3,
                          py: 1.5,
                          fontSize: '0.95rem',
                          borderWidth: 2,
                          borderColor: theme.palette.error.main,
                          color: theme.palette.error.main,
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            borderWidth: 2,
                            borderColor: theme.palette.error.dark,
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Üyeyi Reddet
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Kişisel Bilgiler */}
        <SectionCard title="Kişisel Bilgiler" icon={<PersonIcon />}>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
            <InfoRow label="TC Kimlik Numarası" value={member?.nationalId || '-'} icon={<BadgeIcon />} />
            <InfoRow label="Üye Numarası" value={member?.registrationNumber || '-'} icon={<BadgeIcon />} />
            <InfoRow label="Adı" value={member?.firstName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Soyadı" value={member?.lastName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Anne Adı" value={member?.motherName || '-'} icon={<PersonIcon />} />
            <InfoRow label="Baba Adı" value={member?.fatherName || '-'} icon={<PersonIcon />} />
            <InfoRow
              label="Doğum Tarihi"
              value={member?.birthDate ? new Date(member.birthDate).toLocaleDateString('tr-TR') : '-'}
              icon={<CalendarTodayIcon />}
            />
            <InfoRow label="Doğum Yeri" value={member?.birthplace || '-'} icon={<PlaceIcon />} />
            <InfoRow
              label="Cinsiyet"
              value={member?.gender === 'MALE' ? 'Erkek' : member?.gender === 'FEMALE' ? 'Kadın' : '-'}
              icon={<PersonIcon />}
            />
            <InfoRow
              label="Öğrenim Durumu"
              value={
                member?.educationStatus === 'COLLEGE'
                  ? 'Yüksekokul'
                  : member?.educationStatus === 'HIGH_SCHOOL'
                    ? 'Lise'
                    : member?.educationStatus === 'PRIMARY'
                      ? 'İlköğretim'
                      : '-'
              }
              icon={<SchoolIcon />}
            />
            <InfoRow label="Telefon" value={member?.phone || '-'} icon={<PhoneIcon />} />
            <InfoRow label="E-posta" value={member?.email || '-'} icon={<EmailIcon />} />
            <InfoRow 
              label="İl (Kayıtlı Olduğu Yer)" 
              value={member?.province?.name || '-'} 
              icon={<PlaceIcon />} 
            />
            <InfoRow 
              label="İlçe (Kayıtlı Olduğu Yer)" 
              value={member?.district?.name || '-'} 
              icon={<PlaceIcon />} 
            />
          </Box>
        </SectionCard>

        {/* Kurum, Şube, Tevkifat ve Üyelik Bilgileri - Yeni Düzen */}
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' } }}>
          {/* Sol Sütun - Kurum Bilgileri */}
          <SectionCard title="Kurum Bilgileri" icon={<WorkIcon />}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow label="Kurum Adı" value={member?.institution?.name || '-'} icon={<AccountBalanceIcon />} />
              <InfoRow label="Görev Birimi" value={member?.dutyUnit || '-'} icon={<WorkIcon />} />
              <InfoRow label="Kurum Adresi" value={member?.institutionAddress || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Kurum İli" value={member?.institutionProvince?.name || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Kurum İlçesi" value={member?.institutionDistrict?.name || '-'} icon={<PlaceIcon />} />
              <InfoRow label="Meslek/Unvan" value={member?.profession?.name || '-'} icon={<WorkIcon />} />
              <InfoRow label="Kurum Sicil No" value={member?.institutionRegNo || '-'} icon={<BadgeIcon />} />
              <InfoRow label="Kadro Unvan Kodu" value={member?.staffTitleCode || '-'} icon={<BadgeIcon />} />
            </Box>
          </SectionCard>

          {/* Sağ Sütun - Şube, Tevkifat ve Üyelik Bilgileri */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Şube Bilgileri */}
            <SectionCard title="Şube Bilgileri" icon={<CorporateFareIcon />}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <InfoRow
                  label="Şube"
                  value={member?.branch?.name ? `${member.branch.name}${member.branch.code ? ` (${member.branch.code})` : ''}` : '-'}
                  icon={<AccountBalanceIcon />}
                />
              </Box>
            </SectionCard>

            {/* Tevkifat Bilgileri */}
            <SectionCard title="Tevkifat Bilgileri" icon={<AccountBalanceIcon />}>
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <InfoRow label="Tevkifat Kurumu" value={member?.tevkifatCenter?.name || '-'} icon={<CorporateFareIcon />} />
                <InfoRow label="Tevkifat Ünvanı" value={member?.tevkifatTitle?.name || '-'} icon={<WorkIcon />} />
              </Box>
            </SectionCard>

            {/* Üyelik Bilgileri */}
            <SectionCard title="Üyelik Bilgileri" icon={<PersonIcon />}>
              <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <InfoRow label="Üyelik Durumu" value={statusConfig.label} icon={<CheckCircleIcon />} />
                <InfoRow label="Üye Grubu" value={member?.membershipInfoOption?.label || '-'} icon={<PersonIcon />} />
                <InfoRow label="Yönetim Karar Defteri No" value={member?.boardDecisionBookNo || '-'} icon={<BadgeIcon />} />
                <InfoRow
                  label="Yönetim Kurulu Karar Tarihi"
                  value={member?.boardDecisionDate ? new Date(member.boardDecisionDate).toLocaleDateString('tr-TR') : '-'}
                  icon={<CalendarTodayIcon />}
                />
              </Box>
            </SectionCard>
          </Box>
        </Box>

        {/* Üyelik Evrakları */}
        <SectionCard 
          title="Üyelik Evrakları" 
          icon={<UploadFileIcon />}
          actions={
            canUploadDocument && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={handleOpenGenerateDialog}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                    bgcolor: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: theme.palette.error.dark,
                    },
                  }}
                >
                  PDF Oluştur
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<UploadFileIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.75,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}
                >
                  Evrak Yükle
                </Button>
              </Box>
            )
          }
        >
          {loadingDocuments ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : documents.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                bgcolor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              Bu üye için henüz evrak yüklenmemiştir.
            </Alert>
          ) : (
            <TableContainer 
              component={Paper} 
              variant="outlined" 
              sx={{ 
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: 'none',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  height: 8,
                },
                '&::-webkit-scrollbar-track': {
                  bgcolor: alpha(theme.palette.divider, 0.05),
                },
                '&::-webkit-scrollbar-thumb': {
                  bgcolor: alpha(theme.palette.primary.main, 0.3),
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.5),
                  },
                },
              }}
            >
              <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                <TableHead>
                  <TableRow 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Doküman Türü</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>Dosya Adı</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' } }}>Oluşturulma Tarihi</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', lg: 'table-cell' } }}>Oluşturan</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map(document => (
                    <TableRow 
                      key={document.id} 
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.03),
                        },
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {getDocumentTypeLabel(document.documentType)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.fileName}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.generatedAt ? new Date(document.generatedAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {document.generatedByUser ? `${document.generatedByUser.firstName} ${document.generatedByUser.lastName}` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<GetAppIcon />}
                            onClick={async () => {
                              try {
                                setLoadingPdf(true);
                                const token = localStorage.getItem('accessToken');
                                const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
                                const url = `${API_BASE_URL}/documents/view/${document.id}`;
                                
                                const response = await fetch(url, {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });

                                if (!response.ok) {
                                  throw new Error('Dosya görüntülenemedi');
                                }

                                const blob = await response.blob();
                                const blobUrl = window.URL.createObjectURL(blob);
                                setPdfUrl(blobUrl);
                                setPdfTitle(document.fileName || 'Belge');
                                setPdfViewerOpen(true);
                                setLoadingPdf(false);
                              } catch (error) {
                                console.error('Dosya görüntülenirken hata:', error);
                                toast.showError('Dosya görüntülenemedi');
                                setLoadingPdf(false);
                              }
                            }}
                            sx={{
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              px: { xs: 1, sm: 1.5 },
                              py: { xs: 0.5, sm: 0.75 },
                              minWidth: 'auto',
                            }}
                          >
                            Görüntüle
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        {/* Ödemeler */}
        <SectionCard title="Aidat / Ödeme Geçmişi" icon={<PaymentIcon />}>
            {loadingPayments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : payments.length === 0 ? (
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                }}
              >
                Bu üye için henüz ödeme kaydı bulunmamaktadır.
              </Alert>
            ) : (
              <TableContainer 
                component={Paper} 
                variant="outlined" 
                sx={{ 
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  boxShadow: 'none',
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    height: 8,
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: alpha(theme.palette.divider, 0.05),
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.5),
                    },
                  },
                }}
              >
                <Table sx={{ minWidth: { xs: 650, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow 
                      sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>Dönem</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>Tutar</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' }, textAlign: 'center', verticalAlign: 'middle' }}>Ödeme Türü</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>Durum</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap', display: { xs: 'none', md: 'table-cell' }, textAlign: 'center', verticalAlign: 'middle' }}>Belge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map(payment => {
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
                      const monthName = monthNames[payment.paymentPeriodMonth - 1];

                      const paymentTypeLabels: any = {
                        TEVKIFAT: 'Tevkifat',
                        ELDEN: 'Elden',
                        HAVALE: 'Havale',
                      };

                      return (
                        <TableRow 
                          key={payment.id} 
                          hover
                          sx={{
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.03),
                            },
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {monthName} {payment.paymentPeriodYear}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', textAlign: 'center', verticalAlign: 'middle' }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {parseFloat(payment.amount).toLocaleString('tr-TR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              TL
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, textAlign: 'center', verticalAlign: 'middle' }}>
                            <Chip
                              label={paymentTypeLabels[payment.paymentType]}
                              size="small"
                              color={payment.paymentType === 'TEVKIFAT' ? 'primary' : payment.paymentType === 'ELDEN' ? 'secondary' : 'default'}
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {payment.isApproved ? (
                              <Chip 
                                icon={<CheckCircleIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />} 
                                label="Onaylı" 
                                color="success" 
                                size="small" 
                                sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }} 
                              />
                            ) : (
                              <Chip 
                                icon={<WarningIcon sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }} />} 
                                label="Beklemede" 
                                color="warning" 
                                size="small" 
                                sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem' } }} 
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textAlign: 'center', verticalAlign: 'middle' }}>
                            {payment.documentUrl ? (
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PictureAsPdfIcon />}
                                  onClick={async () => {
                                    try {
                                      setLoadingPdf(true);
                                      const token = localStorage.getItem('accessToken');
                                      const API_BASE_URL = httpClient.defaults.baseURL || 'http://localhost:3000';
                                      const url = `${API_BASE_URL}/payments/${payment.id}/document/view`;
                                      
                                      const response = await fetch(url, {
                                        method: 'GET',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      });

                                      if (!response.ok) {
                                        const errorText = await response.text();
                                        console.error('PDF görüntüleme hatası:', response.status, errorText);
                                        if (response.status === 404) {
                                          throw new Error('Ödeme belgesi bulunamadı. Belge yüklenmemiş olabilir.');
                                        }
                                        throw new Error(errorText || 'Dosya görüntülenemedi');
                                      }

                                      const blob = await response.blob();
                                      const blobUrl = window.URL.createObjectURL(blob);
                                      const urlParts = payment.documentUrl!.split('/');
                                      const fileName = urlParts[urlParts.length - 1] || 'Ödeme Belgesi';
                                      setPdfUrl(blobUrl);
                                      setPdfTitle(fileName);
                                      setPdfViewerOpen(true);
                                      setLoadingPdf(false);
                                    } catch (error) {
                                      console.error('Dosya görüntülenirken hata:', error);
                                      toast.showError('Dosya görüntülenemedi');
                                      setLoadingPdf(false);
                                    }
                                  }}
                                  sx={{
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    px: { xs: 1, sm: 1.5 },
                                    py: { xs: 0.5, sm: 0.75 },
                                    minWidth: 'auto',
                                  }}
                                >
                                  Görüntüle
                                </Button>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionCard>

        {/* Üyelik İstatistikleri */}
        <SectionCard title="Üyelik ve Zaman İstatistikleri" icon={<CalendarTodayIcon />}>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' } }}>
              <InfoRow 
                label="Kayıt Tarihi" 
                value={member?.createdAt ? formatDate(new Date(member.createdAt)) : '-'} 
                icon={<CalendarTodayIcon />} 
              />
              <InfoRow 
                label="Onay Tarihi" 
                value={member?.approvedAt ? formatDate(new Date(member.approvedAt)) : '-'} 
                icon={<CheckCircleIcon />} 
              />
              <InfoRow 
                label="Onay Süresi" 
                value={calculateApprovalDuration() || '-'} 
                icon={<HourglassEmptyIcon />} 
              />
              <InfoRow 
                label="Üyelik Süresi" 
                value={calculateMembershipDuration() || '-'} 
                icon={<CalendarTodayIcon />} 
              />
              <InfoRow 
                label="Aktif Üyelik Süresi" 
                value={calculateActiveMembershipDuration() || '-'} 
                icon={<CheckCircleIcon />} 
              />
              <InfoRow 
                label="Üyelik Yaşı" 
                value={calculateMembershipDuration() || '-'} 
                icon={<PersonIcon />} 
              />
              <InfoRow 
                label="Durum Değişiklik Sayısı" 
                value={getStatusChangeCount()} 
                icon={<SettingsIcon />} 
              />
              <InfoRow 
                label="Son Durum Değişikliği" 
                value={formatDate(getLastStatusChangeDate())} 
                icon={<SettingsIcon />} 
              />
              <InfoRow 
                label="Son Aktivite Tarihi" 
                value={formatDate(getLastActivityDate())} 
                icon={<CalendarTodayIcon />} 
              />
            </Box>
          )}
        </SectionCard>

        {/* Evrak Yükleme Dialog */}
        <Dialog 
          open={uploadDialogOpen} 
          onClose={() => {
            if (!uploading) {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setDocumentType('UPLOADED');
              setDescription('');
              setCustomFileName('');
            }
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.primary.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <UploadFileIcon />
              </Box>
              Evrak Yükle
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                fullWidth
                type="file"
                inputProps={{ accept: 'application/pdf' }}
                onChange={handleFileSelect}
                label="PDF Dosyası Seç"
                InputLabelProps={{ shrink: true }}
                helperText="Sadece PDF dosyaları yüklenebilir"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              {selectedFile && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Seçilen dosya: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
                </Alert>
              )}
              <TextField
                fullWidth
                label="Dosya Adı"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="Dosya adını girin (uzantı otomatik eklenir)"
                helperText="Dosya adını değiştirmek için buraya yeni adı yazın. PDF uzantısı otomatik eklenir."
                disabled={uploading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Doküman Tipi</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Doküman Tipi"
                  disabled={uploading}
                  sx={{
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.divider, 0.2),
                    },
                  }}
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Dokümanın türünü seçin</FormHelperText>
              </FormControl>
              <TextField
                fullWidth
                label="Açıklama (Opsiyonel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                rows={3}
                placeholder="Doküman hakkında ek bilgiler..."
                disabled={uploading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
            <Button 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
                setDocumentType('UPLOADED');
                setDescription('');
                setCustomFileName('');
              }} 
              disabled={uploading}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpload}
              variant="contained"
              disabled={uploading || !selectedFile || !documentType}
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              {uploading ? 'Yükleniyor...' : 'Yükle'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* PDF Oluşturma Dialog */}
        <Dialog 
          open={generateDialogOpen} 
          onClose={() => {
            if (!generating) {
              setGenerateDialogOpen(false);
              setSelectedTemplate(null);
            }
          }} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
          }}
        >
          <DialogTitle 
            sx={{ 
              pb: 1,
              pt: 3,
              px: 3,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: theme.palette.primary.main,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                }}
              >
                <PictureAsPdfIcon />
              </Box>
              PDF Doküman Oluştur
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {loadingTemplates ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Şablon Seç</InputLabel>
                  <Select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => {
                      const template = templates.find(t => t.id === e.target.value);
                      setSelectedTemplate(template || null);
                      // Template değiştiğinde ekstra değişkenleri sıfırla
                      if (template) {
                        const extraVars = getExtraVariablesFromTemplate(template);
                        const newExtraVariables: Record<string, string> = {};
                        extraVars.forEach(varName => {
                          newExtraVariables[varName] = '';
                        });
                        setExtraVariables(newExtraVariables);
                      } else {
                        setExtraVariables({});
                      }
                    }}
                    label="Şablon Seç"
                    disabled={generating}
                    sx={{
                      borderRadius: 2,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.divider, 0.2),
                      },
                    }}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {templates.length === 0 && (
                    <FormHelperText>
                      Aktif şablon bulunamadı. Önce bir şablon oluşturun.
                    </FormHelperText>
                  )}
                </FormControl>
              )}
              {selectedTemplate && (
                <>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Seçilen Şablon: {selectedTemplate.name}
                    </Typography>
                    {selectedTemplate.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedTemplate.description}
                      </Typography>
                    )}
                  </Alert>

                  {/* Ekstra değişkenler varsa input alanları göster */}
                  {Object.keys(extraVariables).length > 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                        Lütfen aşağıdaki bilgileri doldurun:
                      </Typography>
                      {Object.keys(extraVariables).map((varName) => (
                        <TextField
                          key={varName}
                          label={getVariableLabel(varName)}
                          value={extraVariables[varName]}
                          onChange={(e) => setExtraVariables(prev => ({
                            ...prev,
                            [varName]: e.target.value
                          }))}
                          fullWidth
                          size="small"
                          required
                          disabled={generating}
                          placeholder={`${getVariableLabel(varName)} girin`}
                          error={!extraVariables[varName] || extraVariables[varName].trim() === ''}
                          helperText={(!extraVariables[varName] || extraVariables[varName].trim() === '') ? 'Bu alan zorunludur' : ''}
                          multiline={varName.toLowerCase().includes('reason') || varName.toLowerCase().includes('description')}
                          rows={varName.toLowerCase().includes('reason') || varName.toLowerCase().includes('description') ? 3 : 1}
                          sx={{ borderRadius: 2 }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, gap: 1.5 }}>
            <Button
              onClick={() => {
                setGenerateDialogOpen(false);
                setSelectedTemplate(null);
              }}
              disabled={generating}
              sx={{ 
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleGenerate}
              variant="contained"
              disabled={!selectedTemplate || generating}
              startIcon={generating ? <CircularProgress size={16} /> : <PictureAsPdfIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
                bgcolor: theme.palette.error.main,
                '&:hover': {
                  bgcolor: theme.palette.error.dark,
                  boxShadow: `0 6px 16px ${alpha(theme.palette.error.main, 0.4)}`,
                },
              }}
            >
              {generating ? 'Oluşturuluyor...' : 'PDF Oluştur'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Onay Bilgileri */}
        {member?.approvedBy && member?.approvedAt && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              bgcolor: alpha(theme.palette.success.main, 0.08),
              '& .MuiAlert-icon': { 
                fontSize: '1.8rem',
                color: theme.palette.success.main,
              },
              boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.1)}`,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75, fontSize: '1rem', color: theme.palette.success.dark }}>
              ✓ Üyelik Onayı
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
              <strong>
                {member.approvedBy.firstName} {member.approvedBy.lastName}
              </strong>{' '}
              tarafından{' '}
              <strong>
                {new Date(member.approvedAt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>{' '}
              tarihinde onaylanmıştır.
            </Typography>
          </Alert>
        )}

        {/* Üyelik ve Durum Tarihleri */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            mt: 3,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Üyelik Tarihi */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    mb: 0.5,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Üyelik Tarihi
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: '1rem',
                  }}
                >
                  {member?.approvedAt
                    ? new Date(member.approvedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : member?.createdAt
                      ? new Date(member.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                </Typography>
              </Box>

              {/* Durum Değişiklik Tarihleri */}
              {(member?.status === 'RESIGNED' || member?.status === 'EXPELLED' || member?.status === 'REJECTED') && member?.cancelledAt && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {member.status === 'RESIGNED'
                      ? 'İstifa Tarihi'
                      : member.status === 'EXPELLED'
                        ? 'İhraç Tarihi'
                        : member.status === 'REJECTED'
                          ? 'Reddedilme Tarihi'
                          : 'Durum Değişiklik Tarihi'}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 600,
                      color:
                        member.status === 'RESIGNED'
                          ? theme.palette.grey[700]
                          : member.status === 'EXPELLED'
                            ? theme.palette.error.main
                            : member.status === 'REJECTED'
                              ? theme.palette.error.main
                              : theme.palette.text.primary,
                      fontSize: '1rem',
                    }}
                  >
                    {new Date(member.cancelledAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Durum Değiştirme Dialog */}
      {member && (
        <MemberStatusChangeDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          onConfirm={handleStatusChange}
          currentStatus={member.status}
          memberName={`${member.firstName} ${member.lastName}`}
          loading={updatingStatus}
        />
      )}

      {/* Üye Başvurusu Onaylama Dialog */}
      {member && member.status === 'PENDING' && (
        <MemberApprovalDialog
          open={approveDialogOpen}
          onClose={() => {
            if (!updatingStatus) {
              setApproveDialogOpen(false);
              setInitialApproveFormData(undefined);
            }
          }}
          onConfirm={handleApproveApplication}
          loading={updatingStatus}
          initialFormData={initialApproveFormData}
          successMessage="Bu başvuruyu onaylamak istediğinize emin misiniz? Onaylandıktan sonra üye bekleyen üyeler listesine eklenecektir."
        />
      )}

      {/* Başvuru Reddetme Onay Dialog'u */}
      {member && (
        <Dialog
          open={rejectDialogOpen}
          onClose={() => {
            if (!updatingStatus) {
              setRejectDialogOpen(false);
            }
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              boxShadow: `0 20px 60px ${alpha(theme.palette.common.black, 0.2)}`,
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pb: 2.5,
              pt: 3,
              px: 3,
              borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.02)} 0%, ${alpha(theme.palette.error.light, 0.01)} 100%)`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.35)}`,
                }}
              >
                <CancelIcon sx={{ fontSize: '2rem', color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>
                  Başvuruyu Reddet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Bu işlem geri alınamaz
                </Typography>
              </Box>
            </Box>
            {!updatingStatus && (
              <IconButton
                onClick={() => setRejectDialogOpen(false)}
                size="medium"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                    color: theme.palette.error.main,
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </DialogTitle>

          <DialogContent sx={{ pt: 3.5, pb: 3, px: 3 }}>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: 2, 
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              <strong>{member.firstName} {member.lastName}</strong> isimli üyenin başvurusunu reddetmek istediğinize emin misiniz?
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.error.main,
                fontWeight: 600,
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.error.main, 0.1),
              }}
            >
              ⚠️ Bu işlem geri alınamaz ve üye bilgileri kalıcı olarak reddedilmiş duruma geçecektir.
            </Typography>
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
              pt: 2,
              gap: 1.5,
              borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(theme.palette.grey[50], 0.5)} 100%)`,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              onClick={() => setRejectDialogOpen(false)}
              disabled={!!updatingStatus}
              variant="outlined"
              size="large"
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                borderWidth: '2px',
                '&:hover': {
                  borderWidth: '2px',
                  backgroundColor: alpha(theme.palette.grey[500], 0.08),
                },
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleRejectApplication}
              disabled={!!updatingStatus}
              variant="contained"
              size="large"
              color="error"
              startIcon={updatingStatus ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
              sx={{
                borderRadius: 2.5,
                px: 4,
                py: 1.25,
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
                boxShadow: `0 8px 24px ${alpha(theme.palette.error.main, 0.35)}`,
                '&:hover': {
                  boxShadow: `0 12px 32px ${alpha(theme.palette.error.main, 0.45)}`,
                  background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                },
              }}
            >
              {updatingStatus ? 'Reddediliyor...' : 'Evet, Reddet'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Panel Kullanıcılığına Terfi Dialog */}
      {member && (
        <PromoteToPanelUserDialog
          open={promoteDialogOpen}
          onClose={() => setPromoteDialogOpen(false)}
          memberId={member.id}
          memberName={`${member.firstName} ${member.lastName}`}
          onSuccess={() => {
            // Başvuru durumunu yeniden kontrol et
            const checkApplication = async () => {
              try {
                const applications = await getPanelUserApplications();
                const memberApp = applications.find(app => app.memberId === member.id);
                if (memberApp) {
                  setHasApplication(true);
                  setApplicationStatus(memberApp.status);
                }
              } catch (e) {
                console.error('Başvuru kontrolü hatası:', e);
              }
            };
            checkApplication();
          }}
        />
      )}

      {/* PDF Görüntüleme Dialog */}
      <Dialog
        open={pdfViewerOpen}
        onClose={() => {
          setPdfViewerOpen(false);
          if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            height: '90vh',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            pb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {pdfTitle}
          </Typography>
          <IconButton
            onClick={() => {
              setPdfViewerOpen(false);
              if (pdfUrl) {
                window.URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
              }
            }}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                color: theme.palette.error.main,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 0,
            height: 'calc(90vh - 80px)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadingPdf ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={48} />
              <Typography variant="body2" color="text.secondary">
                PDF yükleniyor...
              </Typography>
            </Box>
          ) : pdfUrl ? (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                '& iframe': {
                  width: '100%',
                  height: '100%',
                  border: 'none',
                },
                // PDF viewer sidebar'ını gizle
                '& embed': {
                  width: '100%',
                  height: '100%',
                },
              }}
            >
              <embed
                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
              />
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MemberDetailPage;
