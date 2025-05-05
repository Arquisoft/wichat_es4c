import { Box, TextField, styled } from '@mui/material';
import { animated } from 'react-spring';

export const AnimatedPaper = styled(animated(Box))(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  textAlign: 'center',
  maxWidth: 420,
  width: '100%',
  background: 'rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  color: 'white',
  position: 'relative',
  zIndex: 1,
}));

export const InputField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 0), // Usamos margin para consistencia
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.light,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.secondary.main,
    },
  },
}));