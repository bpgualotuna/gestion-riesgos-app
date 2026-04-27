import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

type LoadingActionButtonProps = ButtonProps & {
  loading: boolean;
  loadingText: string;
};

export default function LoadingActionButton({
  loading,
  loadingText,
  children,
  disabled,
  startIcon,
  ...buttonProps
}: LoadingActionButtonProps) {
  return (
    <Button
      {...buttonProps}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
    >
      {loading ? loadingText : children}
    </Button>
  );
}
