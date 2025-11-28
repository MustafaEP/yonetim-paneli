import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  IconButton,
  Alert,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../api/client";
import { useConfig } from "../context/ConfigContext";
import MemberFormDialog from "../components/MemberFormDialog";
import { useAuth } from "../context/AuthContext";
import type {
  Member,
  MemberListResponse,
  MemberStatus,
  Gender,
  EducationStatus,
} from "../types/member";
import { turkeyCities } from "../data/turkeyCities";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import InfoIcon from "@mui/icons-material/Info";


const MembersPage: React.FC = () => {
  const { config } = useConfig();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(config.defaultPageLimit || 10);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MemberStatus | "ALL">("ALL");
  const [filterProvince, setFilterProvince] = useState<string | "ALL">("ALL");
  const [filterGender, setFilterGender] = useState<Gender | "ALL">("ALL");
  const [filterEducation, setFilterEducation] =
    useState<EducationStatus | "ALL">("ALL");


  const pageCount = Math.max(1, Math.ceil(total / limit));

  const fetchMembers = async (pageNumber: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: pageNumber,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterStatus !== "ALL") {
        params.status = filterStatus;
      }

      if (filterProvince !== "ALL") {
        params.province = filterProvince;
      }

      if (filterGender !== "ALL") {
        params.gender = filterGender;
      }

      if (filterEducation !== "ALL") {
        params.educationStatus = filterEducation;
      }

      const res = await api.get<MemberListResponse>("/members", {
        params,
      });

      setMembers(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch (err: any) {
      console.error("Üyeler alınırken hata:", err);
      setError(
        err?.response?.data?.message || "Üyeler alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchMembers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchMembers(value);
  };

  const handleOpenCreate = () => {
    setEditingMember(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleCloseDialog = (changed?: boolean, message?: string) => {
    setDialogOpen(false);
    if (changed) {
      fetchMembers(page);
      if (message) {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  const handleDelete = async (member: Member) => {
    if (!window.confirm(`${member.firstName} ${member.lastName} silinsin mi?`))
      return;

    try {
      setError(null);
      await api.delete(`/members/${member.id}`);
      setSuccess("Üye silindi.");
      setTimeout(() => setSuccess(null), 3000);
      fetchMembers(page);
    } catch (err: any) {
      console.error("Üye silinirken hata:", err);
      setError(
        err?.response?.data?.message || "Üye silinirken bir hata oluştu."
      );
    }
  };

  const handleApplyFilters = () => {
    fetchMembers(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterStatus("ALL");
    setFilterProvince("ALL");
    setFilterGender("ALL");
    setFilterEducation("ALL");
    fetchMembers(1);
  };

  const formatMembersForExport = () => {
    return members.map((m) => ({
      "Üyelik Durumu": m.status,
      "Ad": m.firstName,
      "Soyad": m.lastName,
      "TC Kimlik No": m.nationalId || "",
      "İl": m.province || "",
      "İlçe": m.district || "",
      "Çalıştığı Kurum": m.institution || "",
      "Telefon": m.phoneNumber || "",
      "Kayıt Tarihi": m.registrationDate
        ? new Date(m.registrationDate).toLocaleDateString("tr-TR")
        : "",
      "Üye Kayıt No": m.registrationNo || "",
      "Kara Defter No": m.ledgerNo || "",
    }));
  };

  const handleExportExcel = () => {
    if (members.length === 0) {
      alert("Dışa aktarılacak üye bulunamadı.");
      return;
    }

    const data = formatMembersForExport();
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Uyeler");

    XLSX.writeFile(workbook, "uyeler.xlsx");
  };

  const handleExportPDF = () => {
    if (members.length === 0) {
      alert("Dışa aktarılacak üye bulunamadı.");
      return;
    }

    const data = formatMembersForExport();

    const doc = new jsPDF("l", "pt", "a4"); // yatay A4
    const columns = Object.keys(data[0]);
    const rows = data.map((row) => columns.map((col) => (row as any)[col]));

    doc.setFontSize(14);
    doc.text("Üye Listesi", 40, 40);

    // BURASI ÖNEMLİ: doc.autoTable DEĞİL, autoTable(doc, {...})
    // @ts-ignore
    autoTable(doc, {
      startY: 60,
      head: [columns],
      body: rows,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
      },
    });

    doc.save("uyeler.pdf");
  };





  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Üyeler
      </Typography>
      {user && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Giriş yapan: {user.name} ({user.role})
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Üst bar: başlık ve buton */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Üye Listesi</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
            >
              Excel'e Aktar
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportPDF}
            >
              PDF'e Aktar
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
            >
              Yeni Üye
            </Button>
          </Box>
        </Box>

        {/* Filtre alanı */}
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              label="Ara (ad, soyad, TC, kayıt no, kurum)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Üyelik Durumu</InputLabel>
              <Select
                label="Üyelik Durumu"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as MemberStatus | "ALL")
                }
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="BEKLEME">BEKLEME</MenuItem>
                <MenuItem value="AKTİF">AKTİF</MenuItem>
                <MenuItem value="İSTİFA">İSTİFA</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>İl</InputLabel>
              <Select
                label="İl"
                value={filterProvince}
                onChange={(e) =>
                  setFilterProvince(e.target.value as string | "ALL")
                }
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                {turkeyCities.map((city) => (
                  <MenuItem key={city.name} value={city.name}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Cinsiyet</InputLabel>
              <Select
                label="Cinsiyet"
                value={filterGender}
                onChange={(e) =>
                  setFilterGender(e.target.value as Gender | "ALL")
                }
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="ERKEK">ERKEK</MenuItem>
                <MenuItem value="KADIN">KADIN</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Öğrenim Durumu</InputLabel>
              <Select
                label="Öğrenim Durumu"
                value={filterEducation}
                onChange={(e) =>
                  setFilterEducation(
                    e.target.value as EducationStatus | "ALL"
                  )
                }
              >
                <MenuItem value="ALL">Tümü</MenuItem>
                <MenuItem value="İLKÖĞRETİM">İLKÖĞRETİM</MenuItem>
                <MenuItem value="LİSE">LİSE</MenuItem>
                <MenuItem value="YÜKSEKOKUL">YÜKSEKOKUL</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
              <Button
                variant="contained"
                size="small"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                Filtrele
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={handleResetFilters}
                disabled={loading}
              >
                Temizle
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>


      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Üyelik Durumu</TableCell>
              <TableCell>Ad Soyad</TableCell>
              <TableCell>TC Kimlik</TableCell>
              <TableCell>İl / İlçe</TableCell>
              <TableCell>Telefon</TableCell>
              <TableCell>Kayıt Tarihi</TableCell>
              <TableCell>Kayıt No</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.status}</TableCell>
                  <TableCell>
                    {m.firstName} {m.lastName}
                  </TableCell>
                  <TableCell>{m.nationalId || "-"}</TableCell>
                  <TableCell>
                    {m.province || "-"} {m.district ? ` / ${m.district}` : ""}
                  </TableCell>
                  <TableCell>{m.phoneNumber || "-"}</TableCell>
                  <TableCell>
                    {m.registrationDate
                      ? new Date(m.registrationDate).toLocaleDateString("tr-TR")
                      : "-"}
                  </TableCell>
                  <TableCell>{m.registrationNo || "-"}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/members/${m.id}`)}
                      title="Detay"
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenEdit(m)} title="Düzenle">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(m)}
                      title="Sil"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {pageCount > 1 && (
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Box>
      )}

      <MemberFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        editingMember={editingMember}
      />
    </Box>
  );
};

export default MembersPage;
