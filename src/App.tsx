/**
 * Main Application Component
 * Configures providers: Theme, Redux, Router
 */

import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { theme } from './app/theme';
import { store } from './app/store';
import { router } from './app/router';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
