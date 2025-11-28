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
} from "@mui/material";
import api from "../api/client";
import type {
  Member,
  MemberStatus,
  Gender,
  EducationStatus
} from "../types/member";
import { turkeyCities } from "../data/turkeyCities";


interface MemberFormDialogProps {
  open: boolean;
  onClose: (changed?: boolean, message?: string) => void;
  editingMember: Member | null;
}

const statusOptions: MemberStatus[] = ["BEKLEME", "AKTİF", "İSTİFA"];
const genderOptions: Gender[] = ["ERKEK", "KADIN"];
const educationOptions: EducationStatus[] = [
  "İLKÖĞRETİM",
  "LİSE",
  "YÜKSEKOKUL",
];

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
  const [educationStatus, setEducationStatus] =
    useState<EducationStatus | "">("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [ledgerNo, setLedgerNo] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

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


  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      // client-side validation
      const isValid = validateForm();
      if (!isValid) {
        return;
      }

      const payload = {
        status,
        registrationNo: registrationNo || undefined,
        nationalId: nationalId || undefined,
        firstName,
        lastName,
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

      // Zod validasyon hatalarını da göster
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
        setError(
          resp?.message || "Üye kaydedilirken bir hata oluştu."
        );
      }
    } finally {
      setSaving(false);
    }
  };


  const selectedCity = turkeyCities.find((c) => c.name === province);

  const validateForm = (): boolean => {
    const errors: FieldErrorMap = {};

    if (!firstName.trim()) {
      errors.firstName = "Ad zorunludur.";
    }
    if (!lastName.trim()) {
      errors.lastName = "Soyad zorunludur.";
    }

    if (nationalId && nationalId.length !== 11) {
      errors.nationalId = "TC kimlik numarası 11 haneli olmalıdır.";
    }

    if (phoneNumber && phoneNumber.length < 10) {
      errors.phoneNumber = "Telefon numarası en az 10 haneli olmalıdır.";
    }

    if (registrationDate && Number.isNaN(Date.parse(registrationDate))) {
      errors.registrationDate = "Geçerli bir tarih giriniz.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };


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
              onChange={(e) => setRegistrationNo(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="TC Kimlik No"
              fullWidth
              size="small"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
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
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Baba Adı"
              fullWidth
              size="small"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Doğum Yeri"
              fullWidth
              size="small"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
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
            <FormControl fullWidth size="small">
              <InputLabel>İl</InputLabel>
              <Select
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
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl
              fullWidth
              size="small"
              disabled={!selectedCity}
            >
              <InputLabel>İlçe</InputLabel>
              <Select
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
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Çalıştığı Kurum"
              fullWidth
              size="small"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
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
            <FormControl fullWidth size="small">
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
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
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
          <Grid item xs={12} sm={6}>
            <TextField
              label="Kara Defter No"
              fullWidth
              size="small"
              value={ledgerNo}
              onChange={(e) => setLedgerNo(e.target.value)}
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
