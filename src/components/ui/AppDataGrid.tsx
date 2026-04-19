/**
 * Custom DataGrid Component
 * Paginación arriba (total y pasar página por página). 5 ítems por página por defecto.
 * Sin barra de paginación abajo.
 */

import { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps, GridPaginationModel } from '@mui/x-data-grid';
import { Box, Paper, useTheme, useMediaQuery, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { PAGINATION } from '../../utils/constants';

interface AppDataGridProps extends DataGridProps {
  showRowColors?: boolean;
  colorByStatus?: (row: any) => 'active' | 'inactive' | 'default';
  loading?: boolean;
}

export default function AppDataGrid({
  showRowColors = true,
  colorByStatus,
  loading = false,
  rows = [],
  initialState: propsInitialState,
  ...props
}: AppDataGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>(() => ({
    page: 0,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  }));

  const rowCount = Array.isArray(rows) ? rows.length : 0;
  const totalPages = Math.max(1, Math.ceil(rowCount / paginationModel.pageSize));
  const from = rowCount === 0 ? 0 : paginationModel.page * paginationModel.pageSize + 1;
  const to = Math.min((paginationModel.page + 1) * paginationModel.pageSize, rowCount);

  const fallbackGetRowId = (row: any) =>
    row?.id ?? row?.codigo ?? row?.key ?? row?.nombre ?? row?.name ?? row?.uuid;

  return (
    <Paper elevation={2} sx={{ height: '100%', width: '100%', minWidth: 0, overflow: 'hidden' }}>
      {/* Paginación arriba: total y pasar página por página */}
      {rowCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            px: 1.5,
            py: 1,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Mostrando {from} - {to} de {rowCount}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              disabled={paginationModel.page <= 0}
              onClick={() => setPaginationModel((p) => ({ ...p, page: p.page - 1 }))}
              aria-label="Página anterior"
            >
              <ChevronLeft />
            </IconButton>
            <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>
              Pág. {paginationModel.page + 1} de {totalPages}
            </Typography>
            <IconButton
              size="small"
              disabled={paginationModel.page >= totalPages - 1}
              onClick={() => setPaginationModel((p) => ({ ...p, page: p.page + 1 }))}
              aria-label="Página siguiente"
            >
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>
      )}
      <Box
        sx={{
          height: { xs: 380, sm: 480, md: 600 },
          width: '100%',
          minWidth: 0,
          overflow: 'auto',
          '& .MuiDataGrid-root': {
            minWidth: { xs: 400, sm: 500 },
          },
        }}
      >
        <DataGrid
          {...props}
          rows={rows}
          loading={loading}
          getRowId={props.getRowId ?? fallbackGetRowId}
          density={isMobile ? 'compact' : 'standard'}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: PAGINATION.DEFAULT_PAGE_SIZE },
            },
            ...propsInitialState,
          }}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-footerContainer': { display: 'none' },
            '& .MuiDataGrid-cell': {
              fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
            },
            '& .MuiDataGrid-columnHeaders': {
              fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
            },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
              backgroundColor: 'rgba(25, 118, 210, 0.08) !important',
            },
            ...props.sx,
          }}
        />
      </Box>
    </Paper>
  );
}
