import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Snackbar, Box, InputAdornment } from '@mui/material';
import { useSpring } from 'react-spring';
import { FaUser, FaLock } from 'react-icons/fa';

// Importamos el componente del fondo del globo
import GlobeBackground from './GlobeBackground';
// Importamos los estilos compartidos
import { AnimatedPaper, InputField } from '../../src/assets/styles/StyledComponents';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

  // Esta animación es específica del formulario, se queda aquí
  const formAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  const loginUser = async () => {
    try {
      const response = await axios.post(`${apiEndpoint}/login`, { username, password });
      setCreatedAt(response.data?.createdAt || '');
      setLoginSuccess(true);
      setOpenSnackbar(true);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", username);
      localStorage.setItem("role", response.data.role);
      onLoginSuccess();
      // Only navigate if login was successful
      setTimeout(() => navigate('/startmenu'), 1000);
    } catch (error) {
      let errMsg = "Login failed. Please try again.";
  
      if (error.response?.data) {
        const data = error.response.data;
  
        if (typeof data === "string") {
          errMsg = data;
        } else if (Array.isArray(data)) {
          errMsg = data.map(e => e?.msg || JSON.stringify(e)).join(", ");
        } else if (typeof data === "object") {
          errMsg = data.error || data.message || JSON.stringify(data);
        }
      }
      setError(errMsg);
      setOpenSnackbar(true);
      return; // Explicit return to prevent any further execution
    }
  };

  // Manejar enter en los campos
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loginUser();
    }
  };

  const handleGoBack = () => { // handleGoBack no necesita el evento
    navigate('/');
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
    // Si hay un error, también limpiarlo al cerrar el snackbar (opcional)
    if (error) setError('');
  };


  return (
    // Esta caja es el contenedor principal, se queda en el componente
    <Box sx={{
      height: '100vh',
      width: '100vw',
      position: 'relative', // Importante para que el fondo absoluto funcione
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#000010', // El fondo oscuro también se queda aquí
    }}>
      {/* Renderizamos el componente del fondo del globo */}
      <GlobeBackground />

      {/* Botón de Volver atrás, se queda en el componente principal */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10, // Asegura que esté por encima del globo y el formulario
        }}
      >
        <Button
          variant="contained"
          onClick={handleGoBack}
          sx={{
            textTransform: "none",
            fontWeight: "bold",
            fontFamily: "Orbitron, sans-serif",
            backgroundColor:"#454c5a",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#3a404c",
            },
          }}
        >
          Volver atrás
        </Button>
      </Box>

      {/* Contenedor del formulario, se queda en el componente */}
      <Container component="main" maxWidth="xs" sx={{ zIndex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedPaper style={formAnimation}>
          {loginSuccess ? (
            <div>
              <Typography variant="body1" sx={{ textAlign: 'center', marginTop: 2, color: 'white' }}>
                Your account was created on {new Date(createdAt).toLocaleDateString()}.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                sx={{ marginTop: 2, fontWeight: 'bold', borderRadius: 4 }}
                onClick={() => navigate('/startmenu')}
              >
                Go to Game
              </Button>
            </div>
          ) : (
            <div>
              <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white', mb: 2 }}>
                Login
              </Typography>
              <InputField
                // margin="normal" // Eliminado, ahora viene del estilo compartido
                fullWidth
                id="username"
                variant="outlined"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUser color="rgba(0, 0, 0, 0.6)" />
                    </InputAdornment>
                  ),
                }}
              />
              <InputField
                // margin="normal" // Eliminado, ahora viene del estilo compartido
                fullWidth
                id="password"
                type="password"
                variant="outlined"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock color="rgba(0, 0, 0, 0.6)" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                data-testid="submit-button"
                sx={{
                  mt: 3, // Este margen es específico del botón, se queda
                  borderRadius: 4,
                  fontWeight: 'bold',
                }}
                onClick={loginUser}
              >
                Login
              </Button>
              {/* Usamos un solo Snackbar y controlamos su contenido y apertura */}
              <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={error ? `Error: ${error}` : "Login successful"}
                // Opcional: dar color de error al snackbar si hay error
                ContentProps={{
                  sx: {
                    backgroundColor: error ? 'red' : 'green',
                  }
                }}
              />
              {/* Eliminamos el Snackbar de error duplicado */}
            </div>
          )}
        </AnimatedPaper>
      </Container>
    </Box>
  );
};

export default Login;