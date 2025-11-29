import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Typography,
  Divider,
  FormHelperText,
} from "@mui/material";
import api from "../api/client";
import type {
  Member,
  MemberStatus,
  Gender,
  EducationStatus,
} from "../types/member";
import { turkeyCities } from "../data/turkeyCities";
import { WidthFull } from "@mui/icons-material";

interface MemberFormDialogProps {
  open: boolean;
  onClose: (changed?: boolean, message?: string) => void;
  editingMember: Member | null;
}

const statusOptions: MemberStatus[] = ["BEKLEME", "AKTİF", "İSTİFA"];
const genderOptions: Gender[] = ["ERKEK", "KADIN"];
const educationOptions: EducationStatus[] = ["İLKÖĞRETİM", "LİSE", "YÜKSEKOKUL"];

type FieldErrorMap = {
  [key: string]: string | undefined;
};

const MemberFormDialog: React.FC<MemberFormDialogProps> = ({
  open,
  onClose,
  editingMember,
}) => {
  const isEdit = Boolean(editingMember);

  const [status, setStatus] = useState<MemberStatus>("BEKLEME");
  const [registrationNo, setRegistrationNo] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [institution, setInstitution] = useState("");
  const [motherName, setMotherName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [educationStatus, setEducationStatus] = useState<EducationStatus | "">(
    ""
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [ledgerNo, setLedgerNo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const isNullOrWhiteSpace = (value: string | null | undefined): boolean =>
    !value || value.trim().length === 0;

  const isValidDate = (value: string): boolean => {
    const timestamp = Date.parse(value);
    return !Number.isNaN(timestamp);
  };

  useEffect(() => {
    if (editingMember) {
      setStatus(editingMember.status);
      setRegistrationNo(editingMember.registrationNo || "");
      setNationalId(editingMember.nationalId || "");
      setFirstName(editingMember.firstName);
      setLastName(editingMember.lastName);
      setProvince(editingMember.province || "");
      setDistrict(editingMember.district || "");
      setInstitution(editingMember.institution || "");
      setMotherName(editingMember.motherName || "");
      setFatherName(editingMember.fatherName || "");
      setBirthPlace(editingMember.birthPlace || "");
      setGender((editingMember.gender as Gender) || "");
      setEducationStatus(
        (editingMember.educationStatus as EducationStatus) || ""
      );
      setPhoneNumber(editingMember.phoneNumber || "");
      setLedgerNo(editingMember.ledgerNo || "");
      setRegistrationDate(
        editingMember.registrationDate
          ? editingMember.registrationDate.substring(0, 10)
          : ""
      );
      setFieldErrors({});
      setError(null);
    } else {
      setStatus("BEKLEME");
      setRegistrationNo("");
      setNationalId("");
      setFirstName("");
      setLastName("");
      setProvince("");
      setDistrict("");
      setInstitution("");
      setMotherName("");
      setFatherName("");
      setBirthPlace("");
      setGender("");
      setEducationStatus("");
      setPhoneNumber("");
      setLedgerNo("");
      setRegistrationDate("");
      setFieldErrors({});
      setError(null);
    }
  }, [editingMember, open]);

  const selectedCity = turkeyCities.find((c) => c.name === province);

  // ----------------- Validation -----------------

  const validateForm = (): boolean => {
    const errors: FieldErrorMap = {};

    // Üye Kayıt No - zorunlu, 10 hane, sadece rakam
    if (isNullOrWhiteSpace(registrationNo)) {
      errors.registrationNo = "Üye kayıt numarası zorunludur.";
    } else if (!/^\d{10}$/.test(registrationNo.trim())) {
      errors.registrationNo = "Üye kayıt numarası 10 haneli ve sadece rakam olmalıdır.";
    }

    // TC Kimlik No - zorunlu, 11 hane, sadece rakam
    if (isNullOrWhiteSpace(nationalId)) {
      errors.nationalId = "TC kimlik numarası zorunludur.";
    } else if (!/^\d{11}$/.test(nationalId.trim())) {
      errors.nationalId = "TC kimlik numarası 11 haneli ve sadece rakam olmalıdır.";
    }

    // Kimlik Bilgileri - zorunlu alanlar
    if (isNullOrWhiteSpace(firstName)) {
      errors.firstName = "Ad zorunludur.";
    }
    if (isNullOrWhiteSpace(lastName)) {
      errors.lastName = "Soyad zorunludur.";
    }
    if (isNullOrWhiteSpace(motherName)) {
      errors.motherName = "Anne adı zorunludur.";
    }
    if (isNullOrWhiteSpace(fatherName)) {
      errors.fatherName = "Baba adı zorunludur.";
    }
    if (isNullOrWhiteSpace(birthPlace)) {
      errors.birthPlace = "Doğum yeri zorunludur.";
    }

    // Çalışma Bilgileri - il, ilçe, kurum zorunlu
    if (isNullOrWhiteSpace(province)) {
      errors.province = "İl zorunludur.";
    }
    if (isNullOrWhiteSpace(district)) {
      errors.district = "İlçe zorunludur.";
    }

    if (isNullOrWhiteSpace(institution)) {
      errors.institution = "Çalıştığı kurum zorunludur.";
    } else {
      const trimmedInst = institution.trim();
      if (trimmedInst.length < 4) {
        errors.institution = "Çalıştığı kurum en az 4 karakter olmalıdır.";
      } else if (trimmedInst.length > 25) {
        errors.institution = "Çalıştığı kurum en fazla 25 karakter olabilir.";
      }
    }

    // Diğer Bilgiler - boş bırakılamaz
    if (!gender) {
      errors.gender = "Cinsiyet zorunludur.";
    }
    if (!educationStatus) {
      errors.educationStatus = "Öğrenim durumu zorunludur.";
    }

    // Telefon - zorunlu, en az 10 rakam
    if (isNullOrWhiteSpace(phoneNumber)) {
      errors.phoneNumber = "Telefon zorunludur.";
    } else {
      const numericPhone = phoneNumber.replace(/\D/g, "");
      if (numericPhone.length < 10) {
        errors.phoneNumber = "Telefon numarası en az 10 rakam içermelidir.";
      }
    }

    // Üye kayıt tarihi - zorunlu, geçerli tarih, gelecekte olamaz
    if (isNullOrWhiteSpace(registrationDate)) {
      errors.registrationDate = "Üye kayıt tarihi zorunludur.";
    } else if (!isValidDate(registrationDate)) {
      errors.registrationDate = "Geçerli bir tarih giriniz.";
    } else {
      const dateValue = new Date(registrationDate);
      const today = new Date();
      dateValue.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (dateValue > today) {
        errors.registrationDate = "Kayıt tarihi gelecekte olamaz.";
      }
    }

    // Kara Defter No - zorunlu, 10 hane, sadece rakam
    if (isNullOrWhiteSpace(ledgerNo)) {
      errors.ledgerNo = "Kara defter numarası zorunludur.";
    } else if (!/^\d{10}$/.test(ledgerNo.trim())) {
      errors.ledgerNo = "Kara defter numarası 10 haneli ve sadece rakam olmalıdır.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setError(null);

    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        status,
        registrationNo: registrationNo || undefined,
        nationalId: nationalId || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        province: province || undefined,
        district: district || undefined,
        institution: institution || undefined,
        motherName: motherName || undefined,
        fatherName: fatherName || undefined,
        birthPlace: birthPlace || undefined,
        gender: gender || undefined,
        educationStatus: educationStatus || undefined,
        phoneNumber: phoneNumber || undefined,
        registrationDate: registrationDate || undefined,
        ledgerNo: ledgerNo || undefined,
      };

      if (isEdit && editingMember) {
        const res = await api.put(`/members/${editingMember.id}`, payload);
        onClose(true, res.data.message || "Üye güncellendi.");
      } else {
        const res = await api.post("/members", payload);
        onClose(true, res.data.message || "Üye oluşturuldu.");
      }
    } catch (err: any) {
      console.error("Üye kaydedilirken hata:", err);

      const resp = err?.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        const serverErrors: FieldErrorMap = {};
        resp.errors.forEach((e: any) => {
          if (e.path) {
            serverErrors[e.path] = e.message;
          }
        });
        setFieldErrors((prev) => ({ ...prev, ...serverErrors }));
        setError(resp.message || "Validasyon hatası.");
      } else {
        setError(resp?.message || "Üye kaydedilirken bir hata oluştu.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ----------------- Render -----------------

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? "Üye Düzenle" : "Yeni Üye"}</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Üyelik Bilgileri */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Üyelik Bilgileri
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Üyelik Durumu</InputLabel>
              <Select
                label="Üyelik Durumu"
                value={status}
                onChange={(e) => setStatus(e.target.value as MemberStatus)}
              >
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Üye Kayıt No"
              fullWidth
              size="small"
              value={registrationNo}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                if (onlyDigits.length <= 10) {
                  setRegistrationNo(onlyDigits);
                }
              }}
              inputProps={{ maxLength: 10 }}
              error={!!fieldErrors.registrationNo}
              helperText={fieldErrors.registrationNo}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="TC Kimlik No"
              fullWidth
              size="small"
              value={nationalId}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                if (onlyDigits.length <= 11) {
                  setNationalId(onlyDigits);
                }
              }}
              inputProps={{ maxLength: 11 }}
              error={!!fieldErrors.nationalId}
              helperText={fieldErrors.nationalId}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Kimlik Bilgileri */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Kimlik Bilgileri
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Adı"
              fullWidth
              size="small"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={!!fieldErrors.firstName}
              helperText={fieldErrors.firstName}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Soyadı"
              fullWidth
              size="small"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={!!fieldErrors.lastName}
              helperText={fieldErrors.lastName}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Anne Adı"
              fullWidth
              size="small"
              value={motherName}
              onChange={(e) => setMotherName(e.target.value)}
              error={!!fieldErrors.motherName}
              helperText={fieldErrors.motherName}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Baba Adı"
              fullWidth
              size="small"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
              error={!!fieldErrors.fatherName}
              helperText={fieldErrors.fatherName}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Doğum Yeri"
              fullWidth
              size="small"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              error={!!fieldErrors.birthPlace}
              helperText={fieldErrors.birthPlace}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Çalışma Bilgileri */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Çalışma Bilgileri
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <FormControl
              fullWidth
              size="small"
              error={!!fieldErrors.province}
              sx={{ minWidth: 200 }}
            >
              <InputLabel>İl</InputLabel>
              <Select
                fullWidth
                size="small"
                label="İl"
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setDistrict("");
                }}
              >
                {turkeyCities.map((city) => (
                  <MenuItem key={city.name} value={city.name}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.province && (
                <FormHelperText>{fieldErrors.province}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl
              fullWidth
              size="small"
              disabled={!selectedCity}
              error={!!fieldErrors.district}
              sx={{ minWidth: 200 }}
            >
              <InputLabel>İlçe</InputLabel>
              <Select
                fullWidth
                size="small"
                label="İlçe"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {selectedCity?.districts.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                )) || []}
              </Select>
              {fieldErrors.district && (
                <FormHelperText>{fieldErrors.district}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Çalıştığı Kurum"
              fullWidth
              size="small"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              error={!!fieldErrors.institution}
              helperText={fieldErrors.institution}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Diğer Bilgiler */}
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Diğer Bilgiler
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl
              sx={{ minWidth: 200 }}
              fullWidth
              size="small"
              error={!!fieldErrors.gender}
            >
              <InputLabel>Cinsiyet</InputLabel>
              <Select
                label="Cinsiyet"
                value={gender || ""}
                onChange={(e) => setGender(e.target.value as Gender)}
              >
                {genderOptions.map((g) => (
                  <MenuItem key={g} value={g}>
                    {g}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.gender && (
                <FormHelperText>{fieldErrors.gender}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl
              sx={{ minWidth: 200 }}
              fullWidth
              size="small"
              error={!!fieldErrors.educationStatus}
            >
              <InputLabel>Öğrenim Durumu</InputLabel>
              <Select
                label="Öğrenim Durumu"
                value={educationStatus || ""}
                onChange={(e) =>
                  setEducationStatus(e.target.value as EducationStatus)
                }
              >
                {educationOptions.map((ed) => (
                  <MenuItem key={ed} value={ed}>
                    {ed}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.educationStatus && (
                <FormHelperText>{fieldErrors.educationStatus}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Telefon"
              fullWidth
              size="small"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              error={!!fieldErrors.phoneNumber}
              helperText={fieldErrors.phoneNumber}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              sx={{ minWidth: 200 }}
              label="Üye Kayıt Tarihi"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              error={!!fieldErrors.registrationDate}
              helperText={fieldErrors.registrationDate}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ maxWidth: 200 }}>
            <TextField
              label="Kara Defter No"
              fullWidth
              size="small"
              value={ledgerNo}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                if (onlyDigits.length <= 10) {
                  setLedgerNo(onlyDigits);
                }
              }}
              inputProps={{ maxLength: 10 }}
              error={!!fieldErrors.ledgerNo}
              helperText={fieldErrors.ledgerNo}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Vazgeç</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          Kaydet
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberFormDialog;
