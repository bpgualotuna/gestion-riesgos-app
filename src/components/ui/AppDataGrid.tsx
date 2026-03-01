/**
 * Custom DataGrid Component
 * Wrapper around MUI DataGrid with custom styling and row coloring.
 * Pasar loading=true mientras se cargan datos para mostrar overlay y no "no hay datos" prematuro.
 * Responsive: scroll horizontal en móvil, altura y densidad adaptativas.
 */

import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps } from '@mui/x-data-grid';
import { Box, Paper, useTheme, useMediaQuery } from '@mui/material';
import { PAGINATION } from '../../utils/constants';

interface AppDataGridProps extends DataGridProps {
  showRowColors?: boolean;
  colorByStatus?: (row: any) => 'active' | 'inactive' | 'default';
  /** Mientras sea true se muestra overlay de carga; no se muestra "no hay datos" hasta que sea false */
  loading?: boolean;
}

export default function AppDataGrid({ 
  showRowColors = true, 
  colorByStatus,
  loading = false,
  ...props 
}: AppDataGridProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fallbackGetRowId = (row: any) =>
    row?.id ?? row?.codigo ?? row?.key ?? row?.nombre ?? row?.name ?? row?.uuid;

  const getRowBackgroundColor = (row: any) => {
    return 'transparent';
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', width: '100%', minWidth: 0, overflow: 'hidden' }}>
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
          loading={loading}
          getRowId={props.getRowId ?? fallbackGetRowId}
          density={isMobile ? 'compact' : 'standard'}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
              },
            },
            ...props.initialState,
          }}
          pageSizeOptions={PAGINATION.PAGE_SIZE_OPTIONS}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell': {
              fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
            },
            '& .MuiDataGrid-columnHeaders': {
              fontSize: { xs: '0.75rem', sm: '0.8125rem', md: '0.875rem' },
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
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
