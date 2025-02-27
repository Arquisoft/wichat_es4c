import React from 'react';
import { Container, Typography, Box, Button, Grid, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';

// Crear un tema personalizado para mejorar la estética
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
    h6: {
      fontSize: '1.2rem',
    },
  },
});

const Game = () => {
  const renderer = ({ minutes, seconds }) => (
    <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
      {minutes}:{seconds < 10 ? '0' : ''}{seconds}
    </Typography>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4} alignItems="stretch" sx={{ height: '100vh' }}>
          {/* Imagen y test */}
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://phantom-elmundo.unidadeditorial.es/6e8c8b3a133c654746642bad3c52e5bd/resize/828/f/webp/assets/multimedia/imagenes/2022/08/03/16595421832009.jpg"
              alt="Imagen del juego"
              sx={{
                width: '100%',
                borderRadius: 3,
                boxShadow: 3,
              }}
            />
            <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                Pregunta: ¿Cuál es la capital de Francia?
              </Typography>
              {["Respuesta 1", "Respuesta 2", "Respuesta 3", "Respuesta 4"].map((respuesta, index) => (
                <Button
                  key={index}
                  variant="contained"
                  fullWidth
                  sx={{ my: 1, bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                >
                  {respuesta}
                </Button>
              ))}
            </Box>
          </Grid>
          
          {/* Contador y espacio para componente futuro */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 3,
            }}>
              <Typography variant="h5" gutterBottom>
                Tiempo restante:
              </Typography>
              <Countdown date={Date.now() + 60000} renderer={renderer} />
            </Box>
            <Box sx={{
              mt: 4,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 3,
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Typography variant="h6" color="text.secondary">
                Espacio para componente futuro
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Game;
