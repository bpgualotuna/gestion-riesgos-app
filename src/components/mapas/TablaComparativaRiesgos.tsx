import { useState } from 'react';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import {
  ArrowDownward as ArrowDownIcon,
  ArrowUpward as ArrowUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { getEtiquetaNivel, getColorNivel } from '../../utils/calificacionRiesgo';

export interface ComparativaRiesgo {
  riesgoId: string;
  numero?: number;
  sigla?: string;
  descripcion: string;
  procesoNombre: string;
  valorInherente: number;
  valorResidual: number;
  cambio: 'bajo' | 'subio' | 'se-mantuvo';
  diferencia: number;
  porcentajeReduccion: number;
}

interface TablaComparativaRiesgosProps {
  riesgos: ComparativaRiesgo[];
}

export default function TablaComparativaRiesgos({ riesgos }: TablaComparativaRiesgosProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const slice = riesgos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Detalle: Cambios por Riesgo
      </Typography>
      {riesgos.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 1,
            px: 0,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            borderRadius: '8px 8px 0 0',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Mostrando {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, riesgos.length)} de {riesgos.length}
          </Typography>
          <TablePagination
            component="div"
            count={riesgos.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Mostrar"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ border: 'none', '.MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 1, minHeight: 40 } }}
          />
        </Box>
      )}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 400 }}>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Riesgo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Proceso</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Inherente</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Residual</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Cambio</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Reducción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slice.map((riesgo, index) => (
              <TableRow key={riesgo.riesgoId} sx={{ '&:hover': { backgroundColor: '#fafafa' } }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  #{riesgo.numero} {riesgo.sigla}
                </TableCell>
                <TableCell sx={{ fontSize: '0.9rem' }}>{riesgo.procesoNombre}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${riesgo.valorInherente} (${getEtiquetaNivel(riesgo.valorInherente)})`}
                    sx={{
                      backgroundColor: getColorNivel(riesgo.valorInherente),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${riesgo.valorResidual} (${getEtiquetaNivel(riesgo.valorResidual)})`}
                    sx={{
                      backgroundColor: getColorNivel(riesgo.valorResidual),
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  {riesgo.cambio === 'bajo' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <ArrowDownIcon sx={{ color: '#10b981', fontSize: 18 }} />
                      <Chip label="Bajó" color="success" size="small" variant="outlined" />
                    </Box>
                  )}
                  {riesgo.cambio === 'subio' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <ArrowUpIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                      <Chip label="Subió" color="error" size="small" variant="outlined" />
                    </Box>
                  )}
                  {riesgo.cambio === 'se-mantuvo' && (
                    <Chip label="Igual" color="info" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  {riesgo.diferencia > 0 ? (
                    <Chip
                      label={`-${riesgo.porcentajeReduccion}%`}
                      icon={<TrendingDownIcon />}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
