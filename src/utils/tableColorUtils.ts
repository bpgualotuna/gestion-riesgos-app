/**
 * Table Styling Utilities
 * Utilities para colorear filas de tablas según estado
 */

/**
 * Determina el color de fila basado en el estado activo
 */
export const getRowStatusColor = (isActive: boolean | undefined): 'active' | 'inactive' | 'default' => {
  if (isActive === undefined) return 'default';
  return isActive ? 'active' : 'inactive';
};

/**
 * Retorna los estilos de color para una fila
 */
export const getRowColorStyles = (status: 'active' | 'inactive' | 'default') => {
  switch (status) {
    case 'active':
      return {
        backgroundColor: '#e8f5e9', // Verde claro
        borderLeft: '4px solid #4caf50',
      };
    case 'inactive':
      return {
        backgroundColor: '#f5f5f5', // Gris claro
        borderLeft: '4px solid #bdbdbd',
      };
    default:
      return { backgroundColor: 'transparent' };
  }
};

/**
 * Retorna clase de fila para MUI DataGrid
 */
export const getRowClassName = (row: any, statusField = 'activo'): string => {
  const isActive = row[statusField];
  return isActive ? 'row-active' : 'row-inactive';
};

/**
 * Retorna la clase CSS y estilos para tabla coloreada
 */
export const getTableColorStyles = () => ({
  '& .row-active': {
    backgroundColor: '#e8f5e9 !important',
    borderLeft: '4px solid #4caf50',
    '&:hover': {
      backgroundColor: '#c8e6c9 !important',
    },
  },
  '& .row-inactive': {
    backgroundColor: '#f5f5f5 !important',
    borderLeft: '4px solid #bdbdbd',
    '&:hover': {
      backgroundColor: '#eeeeee !important',
    },
  },
  '& .row-success': {
    backgroundColor: '#e8f5e9 !important',
    '&:hover': {
      backgroundColor: '#c8e6c9 !important',
    },
  },
  '& .row-warning': {
    backgroundColor: '#fff3e0 !important',
    '&:hover': {
      backgroundColor: '#ffe0b2 !important',
    },
  },
  '& .row-error': {
    backgroundColor: '#ffebee !important',
    '&:hover': {
      backgroundColor: '#ffcdd2 !important',
    },
  },
  '& .row-info': {
    backgroundColor: '#e3f2fd !important',
    '&:hover': {
      backgroundColor: '#bbdefb !important',
    },
  },
});
