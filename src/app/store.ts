/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { riesgosApi } from '../features/gestion-riesgos/api/riesgosApi';
import riesgoReducer from '../features/gestion-riesgos/slices/riesgoSlice';

export const store = configureStore({
  reducer: {
    [riesgosApi.reducerPath]: riesgosApi.reducer,
    riesgo: riesgoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(riesgosApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
