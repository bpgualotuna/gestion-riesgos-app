// Wrapper para Grid2 que funciona con Rolldown
// En Material-UI v7, Grid2 fue renombrado a Grid y cambió su API
// Este wrapper convierte las props xs, sm, md, etc. a la prop size
import Grid, { GridProps as MuiGridProps } from '@mui/material/Grid';
import React from 'react';

export interface Grid2Props extends Omit<MuiGridProps, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> {
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
}

const Grid2 = React.forwardRef<HTMLDivElement, Grid2Props>((props, ref) => {
  const { xs, sm, md, lg, xl, ...rest } = props;
  
  // Convertir props de breakpoint a size
  const size: MuiGridProps['size'] = {};
  if (xs !== undefined) {
    if (typeof xs === 'boolean') {
      size.xs = xs ? 'grow' : false;
    } else if (xs === 'auto') {
      size.xs = 'auto';
    } else {
      size.xs = xs;
    }
  }
  if (sm !== undefined) {
    if (typeof sm === 'boolean') {
      size.sm = sm ? 'grow' : false;
    } else if (sm === 'auto') {
      size.sm = 'auto';
    } else {
      size.sm = sm;
    }
  }
  if (md !== undefined) {
    if (typeof md === 'boolean') {
      size.md = md ? 'grow' : false;
    } else if (md === 'auto') {
      size.md = 'auto';
    } else {
      size.md = md;
    }
  }
  if (lg !== undefined) {
    if (typeof lg === 'boolean') {
      size.lg = lg ? 'grow' : false;
    } else if (lg === 'auto') {
      size.lg = 'auto';
    } else {
      size.lg = lg;
    }
  }
  if (xl !== undefined) {
    if (typeof xl === 'boolean') {
      size.xl = xl ? 'grow' : false;
    } else if (xl === 'auto') {
      size.xl = 'auto';
    } else {
      size.xl = xl;
    }
  }

  return <Grid ref={ref} size={Object.keys(size).length > 0 ? size : undefined} {...rest} />;
});

Grid2.displayName = 'Grid2';

export default Grid2;

