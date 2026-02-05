/**
 * Error Boundary Component
 * Captures React errors and displays a fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error capturado por ErrorBoundary:', error);
    console.error('📋 Error Info:', errorInfo);
    console.error('📚 Error Stack:', error.stack);
    console.error('🔍 Component Stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 4,
            background: '#E8E8E8',
            width: '100%',
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <Typography variant="h5" gutterBottom>
              Error en la aplicación
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </Typography>
            {this.state.error?.stack && (
              <Typography variant="caption" component="pre" sx={{ mt: 2, fontSize: '0.7rem', overflow: 'auto' }}>
                {this.state.error.stack}
              </Typography>
            )}
          </Alert>
          <Button variant="contained" onClick={this.handleReset}>
            Volver al Login
          </Button>
        </Box>
      );
    }

    return <>{this.props.children}</>;
  }
}

