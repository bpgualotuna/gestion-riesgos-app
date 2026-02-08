/**
 * Custom DataGrid Component
 * Wrapper around MUI DataGrid with custom styling and row coloring
 */

import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps } from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';
import { PAGINATION } from '../../utils/constants';

interface AppDataGridProps extends DataGridProps {
  showRowColors?: boolean;
  colorByStatus?: (row: any) => 'active' | 'inactive' | 'default';
}

export default function AppDataGrid({ 
  showRowColors = true, 
  colorByStatus,
  ...props 
}: AppDataGridProps) {
  const fallbackGetRowId = (row: any) =>
    row?.id ?? row?.codigo ?? row?.key ?? row?.nombre ?? row?.name ?? row?.uuid;

  const getRowBackgroundColor = (row: any) => {
    // Always return transparent - no row coloring
    return 'transparent';
  };

  return (
    <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          {...props}
          getRowId={props.getRowId ?? fallbackGetRowId}
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
