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
  Pagination,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

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
  page: number;
  limit: number;
  total: number;
}


const ProductsPage: React.FC = () => {
  const { config } = useConfig();
  
  const [products, setProducts] = useState<Product[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // pagination & filters
  const [limit] = useState(() => config.defaultPageLimit || 10);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);


  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const pageCount = Math.max(1, Math.ceil(total / limit));

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

  const fetchProducts = async (pageNumber: number = 1) => {
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
      if (minPrice.trim()) {
        params.minPrice = Number(minPrice);
      }
      if (maxPrice.trim()) {
        params.maxPrice = Number(maxPrice);
      }

      const response = await api.get<ProductsResponse>("/products", {
        params,
      });

      setProducts(response.data.products);
      setTotal(response.data.total);
      setPage(response.data.page);
    } catch (err: any) {
      console.error("Ürünler alınırken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Ürünler alınırken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchProducts(value);
  };

  const handleApplyFilters = () => {
    fetchProducts(1); // filtre değişince hep 1. sayfadan başla
  };

  useEffect(() => {
    fetchProducts(1);
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
        <Toolbar sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
              {role === "ADMIN" && (
                <Button
                  variant="outlined"
                  sx={{ mr: 1 }}
                  onClick={() => navigate("/users")}
                >
                  Kullanıcılar
                </Button>
              )}

              {canCreateOrUpdate && (
                <Button
                  variant="contained"
                  sx={{ mr: 1 }}
                  startIcon={<Add />}
                  onClick={handleOpenCreate}
                >
                  Yeni Ürün
                </Button>
              )}

              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => fetchProducts(page)}
                disabled={loading}
              >
                Yenile
              </Button>
              <Button variant="contained" color="error" onClick={logout}>
                Çıkış Yap
              </Button>
            </Box>
          </Box>

          {/* Filtre Alanı */}
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
              label="Ara (isim)"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <TextField
              label="Min Fiyat"
              size="small"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <TextField
              label="Max Fiyat"
              size="small"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
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
                setMinPrice("");
                setMaxPrice("");
                fetchProducts(1);
              }}
            >
              Temizle
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
      
      {/* Pagination */}
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
