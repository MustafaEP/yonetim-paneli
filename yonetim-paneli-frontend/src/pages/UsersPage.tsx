import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Toolbar,
  Box,
  Button,
  Chip,
  Select,
  MenuItem,
  type SelectChangeEvent,
  Alert,
  TextField,
  Pagination,
} from "@mui/material";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types/auth";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

interface UsersResponse {
  users: UserItem[];
  page: number;
  limit: number;
  total: number;
}

const roleOptions: UserRole[] = ["ADMIN", "MANAGER", "EDITOR", "VIEWER"];

const UsersPage: React.FC = () => {
  const { config } = useConfig();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // pagination & filters
  const [limit] = useState(() => config.defaultPageLimit || 10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);


  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const fetchUsers = async (pageNumber: number = 1) => {
    try {
      setError(null);
      setLoading(true);

      const params: any = {
        page: pageNumber,
        limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterRole !== "ALL") {
        params.role = filterRole;
      }

      if (status === "ACTIVE") {
        params.status = "active";
      } else if (status === "INACTIVE") {
        params.status = "inactive";
      }

      const res = await api.get<UsersResponse>("/users", { params });

      setUsers(res.data.users);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch (err: any) {
      console.error("Kullanıcılar alınırken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Kullanıcılar alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchUsers(value);
  };

  const handleApplyFilters = () => {
    fetchUsers(1);
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleRoleChange = (id: number, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  };

  const handleSaveRole = async (userId: number, role: UserRole) => {
    try {
      setError(null);
      setSuccess(null);
      await api.patch(`/users/${userId}/role`, { role });
      setSuccess("Kullanıcı rolü güncellendi.");
    } catch (err: any) {
      console.error("Rol güncellenirken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Rol güncellenirken bir hata oluştu."
      );
    }
  };

  const getRoleChipColor = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "error";
      case "MANAGER":
        return "primary";
      case "EDITOR":
        return "success";
      case "VIEWER":
      default:
        return "default";
    }
  };

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ mb: 2 }}>
        <Toolbar
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          {/* Üst başlık + butonlar */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography variant="h6" component="div">
                Kullanıcılar ve Roller
              </Typography>
              {currentUser && (
                <Typography variant="body2" color="text.secondary">
                  Giriş yapan: {currentUser.name} ({currentUser.role})
                </Typography>
              )}
            </Box>
            <Box>
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => navigate("/products")}
              >
                Ürünler
              </Button>
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => fetchUsers(page)}
                disabled={loading}
              >
                Yenile
              </Button>
              <Button variant="contained" color="error" onClick={logout}>
                Çıkış Yap
              </Button>
            </Box>
          </Box>

          {/* Filtre alanı */}
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              label="Ara (isim / email)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
              size="small"
              value={filterRole}
              onChange={(e: SelectChangeEvent) =>
                setFilterRole(e.target.value as UserRole | "ALL")
              }
            >
              <MenuItem value="ALL">Tüm Roller</MenuItem>
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={status}
              onChange={(e: SelectChangeEvent) =>
                setStatus(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
            >
              <MenuItem value="ALL">Tümü (Aktif/Pasif)</MenuItem>
              <MenuItem value="ACTIVE">Sadece Aktif</MenuItem>
              <MenuItem value="INACTIVE">Sadece Pasif</MenuItem>
            </Select>

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
              onClick={() => {
                setSearch("");
                setFilterRole("ALL");
                setStatus("ALL");
                fetchUsers(1);
              }}
            >
              Temizle
            </Button>
          </Box>
        </Toolbar>
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

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ad</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Kullanıcı yok.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => {
                const canEdit =
                  isAdmin && currentUser && currentUser.id !== u.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={u.role}
                          color={getRoleChipColor(u.role)}
                          size="small"
                        />
                        {canEdit && (
                          <Select
                            size="small"
                            value={u.role}
                            onChange={(e: SelectChangeEvent) =>
                              handleRoleChange(
                                u.id,
                                e.target.value as UserRole
                              )
                            }
                            sx={{ minWidth: 120 }}
                          >
                            {roleOptions.map((role) => (
                              <MenuItem key={role} value={role}>
                                {role}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Chip label="Aktif" color="success" size="small" />
                      ) : (
                        <Chip label="Pasif" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {canEdit ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleSaveRole(u.id, u.role)}
                        >
                          Kaydet
                        </Button>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {currentUser?.id === u.id
                            ? "Kendi rolünü değiştiremezsin"
                            : "Yetki yok"}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default UsersPage;
