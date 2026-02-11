/**
 * Redux Slice for Risk Management
 */

import { createSlice } from '@reduxjs/toolkit';
import type { Riesgo, FiltrosRiesgo } from '../../types';

interface RiesgoState {
  selectedRiesgo: Riesgo | null;
  filtros: FiltrosRiesgo;
  searchTerm: string;
}

const initialState: RiesgoState = {
  selectedRiesgo: null,
  filtros: {
    clasificacion: 'all',
    nivelRiesgo: 'all',
  },
  searchTerm: '',
};

const riesgoSlice = createSlice({
  name: 'riesgo',
  initialState,
  reducers: {
    setSelectedRiesgo: (state, action) => {
      state.selectedRiesgo = action.payload;
    },
    setFiltros: (state, action) => {
      state.filtros = { ...state.filtros, ...action.payload };
    },
    resetFiltros: (state) => {
      state.filtros = initialState.filtros;
      state.searchTerm = '';
    },
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
  },
});

export const { setSelectedRiesgo, setFiltros, resetFiltros, setSearchTerm } = riesgoSlice.actions;
export default riesgoSlice.reducer;
