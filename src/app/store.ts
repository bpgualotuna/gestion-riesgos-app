/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import { riesgosApi } from "../api/services/riesgosApi";
import { planTrazabilidadApi } from "../api/services/planTrazabilidadApi";
import riesgoReducer from '../store/slices/riesgoSlice';

export const store = configureStore({
  reducer: {
    [riesgosApi.reducerPath]: riesgosApi.reducer,
    [planTrazabilidadApi.reducerPath]: planTrazabilidadApi.reducer,
    riesgo: riesgoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(riesgosApi.middleware)
      .concat(planTrazabilidadApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
