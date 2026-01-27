/**
 * Custom DataGrid Component
 * Wrapper around MUI DataGrid with custom styling
 */

import { DataGrid } from '@mui/x-data-grid';
import type { DataGridProps } from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';
import { PAGINATION } from '../../utils/constants';

export default function AppDataGrid(props: DataGridProps) {
  return (
    <Paper elevation={2} sx={{ height: '100%', width: '100%' }}>
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          {...props}
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
            },
            ...props.sx,
          }}
        />
      </Box>
    </Paper>
  );
}
