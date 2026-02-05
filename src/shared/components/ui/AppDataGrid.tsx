/**
 * Custom DataGrid Component
 * Wrapper around MUI DataGrid with custom styling
 */

import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps } from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';
import { PAGINACION } from '../../../shared/utils/constants';

export default function AppDataGrid(props: DataGridProps) {
  return (
    <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          {...props}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: PAGINACION.TAMANO_PAGINA_POR_DEFECTO,
              },
            },
            ...props.initialState,
          }}
          pageSizeOptions={PAGINACION.OPCIONES_TAMANO_PAGINA}
          disableRowSelectionOnClick
          sx={{
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
            ...props.sx,
          }}
        />
      </Box>
    </Paper>
  );
}
