import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Box,
  Pagination,
  Chip,
} from "@mui/material";
import api from "../api/client";
import type {
  ActivityLogItem,
  ActivityLogResponse,
} from "../types/activity";

const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  const fetchLogs = async (pageNumber: number) => {
    try {
      setError(null);
      const res = await api.get<ActivityLogResponse>("/activity", {
        params: { page: pageNumber, limit },
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(res.data.page);
    } catch (err: any) {
      console.error("Aktivite logları alınırken hata:", err);
      setError(
        err?.response?.data?.message ||
          "Aktivite logları alınırken bir hata oluştu."
      );
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    fetchLogs(value);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Aktivite Geçmişi
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Bu ekranda sistemde yapılan önemli işlemleri görebilirsiniz.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Kullanıcı</TableCell>
              <TableCell>İşlem</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Detay</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Kayıt bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString("tr-TR")}
                  </TableCell>
                  <TableCell>
                    {log.user ? (
                      <>
                        <Typography variant="body2">
                          {log.user.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {log.user.email}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sistem / Bilinmiyor
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {log.entity ? (
                      <Typography variant="body2">
                        {log.entity}
                        {log.entityId ? ` #${log.entityId}` : ""}
                      </Typography>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.details || "-"}
                    </Typography>
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
    </Box>
  );
};

export default ActivityLogPage;
