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
} from "@mui/material";
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

  const fetchProducts = async () => {
    try {
      const response = await api.get<ProductsResponse>("/products");
      setProducts(response.data.products);
    } catch (err) {
      console.error("Ürünler alınırken hata:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const isAdmin = user?.role === "ADMIN";

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            {isAdmin && (
              <Button
                variant="outlined"
                sx={{ mr: 1 }}
                onClick={() => navigate("/users")}
              >
                Kullanıcılar
              </Button>
            )}
            <Button
              variant="outlined"
              sx={{ mr: 1 }}
              onClick={fetchProducts}
            >
              Yenile
            </Button>
            <Button variant="contained" color="error" onClick={logout}>
              Çıkış Yap
            </Button>
          </Box>
        </Toolbar>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Ad</TableCell>
              <TableCell>Fiyat</TableCell>
              <TableCell>Stok</TableCell>
              <TableCell>Oluşturulma</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default ProductsPage;
