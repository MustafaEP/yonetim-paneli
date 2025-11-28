import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import type { Member } from "../types/member";

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<Member>(`/members/${id}`);
      setMember(res.data);
    } catch (err: any) {
      console.error("Üye detayı alınırken hata:", err);
      setError(
        err?.response?.data?.message || "Üye detayı alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  if (!member) {
    return (
      <Box>
        <Typography>Üye bulunamadı.</Typography>
        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Geri Dön
        </Button>
      </Box>
    );
  }

  return (
    <Box id="print-area" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Üst bar */}
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
            >
            <Typography variant="h5">
                Üye Detayı – {member.firstName} {member.lastName}
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }} className="print-hidden">
                <Button variant="outlined" onClick={() => navigate(-1)}>
                Geri
                </Button>
                <Button variant="contained" onClick={handlePrint}>
                Yazdır / PDF
                </Button>
            </Box>
        </Box>

      <Paper sx={{ p: 3 }}>
        {/* Üyelik Bilgileri */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Üyelik Bilgileri
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Üyelik Durumu</Typography>
            <Typography>{member.status}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Üye Kayıt No</Typography>
            <Typography>{member.registrationNo || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Kara Defter No</Typography>
            <Typography>{member.ledgerNo || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Kayıt Tarihi</Typography>
            <Typography>
              {member.registrationDate
                ? new Date(member.registrationDate).toLocaleDateString("tr-TR")
                : "-"}
            </Typography>
          </Grid>
        </Grid>

        {/* Kimlik Bilgileri */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Kimlik Bilgileri
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Adı</Typography>
            <Typography>{member.firstName}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Soyadı</Typography>
            <Typography>{member.lastName}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">TC Kimlik No</Typography>
            <Typography>{member.nationalId || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Anne Adı</Typography>
            <Typography>{member.motherName || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Baba Adı</Typography>
            <Typography>{member.fatherName || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Doğum Yeri</Typography>
            <Typography>{member.birthPlace || "-"}</Typography>
          </Grid>
        </Grid>

        {/* Çalışma Bilgileri */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Çalışma Bilgileri
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Çalıştığı İl</Typography>
            <Typography>{member.province || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Çalıştığı İlçe</Typography>
            <Typography>{member.district || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Çalıştığı Kurum</Typography>
            <Typography>{member.institution || "-"}</Typography>
          </Grid>
        </Grid>

        {/* Diğer Bilgiler */}
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Diğer Bilgiler
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Cinsiyet</Typography>
            <Typography>{member.gender || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Öğrenim Durumu</Typography>
            <Typography>{member.educationStatus || "-"}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography color="text.secondary">Telefon</Typography>
            <Typography>{member.phoneNumber || "-"}</Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default MemberDetailPage;
