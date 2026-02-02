/**
 * Main Application Component
 * Configures providers: Theme, Redux, Router, Auth
 */

import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { theme } from './app/theme';
import { store } from './app/store';
import { router } from './app/router';
import { AuthProvider } from './contexts/AuthContext';
import { ProcesoProvider } from './contexts/ProcesoContext';
import { RiesgoProvider } from './contexts/RiesgoContext';
import { NotificacionProvider } from './contexts/NotificacionContext';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <NotificacionProvider>
            <ProcesoProvider>
              <RiesgoProvider>
                <RouterProvider router={router} />
              </RiesgoProvider>
            </ProcesoProvider>
          </NotificacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
