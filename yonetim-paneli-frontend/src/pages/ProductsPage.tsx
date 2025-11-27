import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Box,
  Button,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state'leri
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form state'leri
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");

  const resetForm = () => {
    setFormName("");
    setFormPrice("");
    setFormStock("");
  };

  const fetchProducts = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.get<ProductsResponse>("/products");
      setProducts(response.data.products);
    } catch (err: any) {
      console.error("Ürünler alınırken hata:", err);
      setError(
        err?.response?.data?.message || "Ürünler alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Backend'deki role-permission matrisine uygun:
  // ADMIN: read + create + update + delete
  // MANAGER: read + create + update
  // EDITOR: read + create + update
  // VIEWER: sadece read
  const role = user?.role;
  const canCreateOrUpdate =
    role === "ADMIN" || role === "MANAGER" || role === "EDITOR";
  const canDelete = role === "ADMIN";

  // === CREATE ===
  const handleOpenCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleCreateProduct = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formName || !formPrice || !formStock) {
        setError("Lütfen tüm alanları doldurun.");
        return;
      }

      await api.post("/products", {
        name: formName,
        price: Number(formPrice),
        stock: Number(formStock),
      });

      setSuccess("Ürün başarıyla oluşturuldu.");
      setCreateOpen(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error("Ürün oluşturulurken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Ürün oluşturulurken bir hata oluştu."
      );
    }
  };

  // === EDIT ===
  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormName(product.name);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setEditOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    try {
      setError(null);
      setSuccess(null);

      if (!formName || !formPrice || !formStock) {
        setError("Lütfen tüm alanları doldurun.");
        return;
      }

      await api.put(`/products/${selectedProduct.id}`, {
        name: formName,
        price: Number(formPrice),
        stock: Number(formStock),
      });

      setSuccess("Ürün güncellendi.");
      setEditOpen(false);
      setSelectedProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error("Ürün güncellenirken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Ürün güncellenirken bir hata oluştu."
      );
    }
  };

  // === DELETE ===
  const handleDeleteProduct = async (id: number) => {
    const confirm = window.confirm("Bu ürünü silmek istediğinden emin misin?");
    if (!confirm) return;

    try {
      setError(null);
      setSuccess(null);

      await api.delete(`/products/${id}`);
      setSuccess("Ürün silindi.");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Ürün silinirken hata:", err);
      setError(
        err?.response?.data?.message || "Ürün silinirken bir hata oluştu."
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Üst toolbar */}
      <Paper sx={{ mb: 2 }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" component="div">
              Ürünler
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary">
                Giriş yapan: {user.name} ({user.role})
              </Typography>
            )}
          </Box>
          <Box>
            {/* Sadece ADMIN Users sayfasını görsün */}
            {role === "ADMIN" && (
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => navigate("/users")}
              >
                Kullanıcılar
              </Button>
            )}

            {/* Create butonu sadece create/update yetkisi olanlarda */}
            {canCreateOrUpdate && (
              <Button
                variant="contained"
                startIcon={<Add />}
                sx={{ mr: 1 }}
                onClick={handleOpenCreate}
              >
                Yeni Ürün
              </Button>
            )}

            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={fetchProducts}
              disabled={loading}
            >
              Yenile
            </Button>
            <Button variant="contained" color="error" onClick={logout}>
              Çıkış Yap
            </Button>
          </Box>
        </Toolbar>
      </Paper>

      {/* Hata / Başarı mesajları */}
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

      {/* Ürün tablosu */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ad</TableCell>
              <TableCell>Fiyat</TableCell>
              <TableCell>Stok</TableCell>
              <TableCell>Oluşturulma</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Henüz ürün yok.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.price}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    {new Date(p.createdAt).toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell align="right">
                    {/* Edit butonu: create/update yetkisi olan herkes */}
                    {canCreateOrUpdate && (
                      <IconButton
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    )}

                    {/* Delete butonu: sadece ADMIN */}
                    {canDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* CREATE DIALOG */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Yeni Ürün Ekle</DialogTitle>
        <DialogContent>
          <TextField
            label="Ürün Adı"
            fullWidth
            margin="normal"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <TextField
            label="Fiyat"
            fullWidth
            margin="normal"
            type="number"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
          <TextField
            label="Stok"
            fullWidth
            margin="normal"
            type="number"
            value={formStock}
            onChange={(e) => setFormStock(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>İptal</Button>
          <Button variant="contained" onClick={handleCreateProduct}>
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Ürünü Düzenle</DialogTitle>
        <DialogContent>
          <TextField
            label="Ürün Adı"
            fullWidth
            margin="normal"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <TextField
            label="Fiyat"
            fullWidth
            margin="normal"
            type="number"
            value={formPrice}
            onChange={(e) => setFormPrice(e.target.value)}
          />
          <TextField
            label="Stok"
            fullWidth
            margin="normal"
            type="number"
            value={formStock}
            onChange={(e) => setFormStock(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditOpen(false);
              setSelectedProduct(null);
            }}
          >
            İptal
          </Button>
          <Button variant="contained" onClick={handleUpdateProduct}>
            Güncelle
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductsPage;
