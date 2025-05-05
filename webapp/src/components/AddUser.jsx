// src/components/AddUser.js (Refactorizado)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Snackbar, Box, InputAdornment } from '@mui/material';
import { Typewriter } from 'react-simple-typewriter';
import { useSpring } from 'react-spring';
import { FaUser, FaLock } from 'react-icons/fa';

// Importamos el componente del fondo del globo
import GlobeBackground from './GlobeBackground';
// Importamos los estilos compartidos
import { AnimatedPaper, InputField } from '../../src/assets/styles/StyledComponents';

const AddUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

  // Esta animación es específica del formulario, se queda aquí
  const formAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  const validateInput = () => {
    let isValid = true;
    setUsernameError('');
    setPasswordError('');

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      isValid = false;
    }

    if (password.length < 3) {
      setPasswordError('Password must be at least 3 characters long');
      isValid = false;
    }

    return isValid;
  };

  const addUser = async () => {
    if (validateInput()) {
      try {
        await axios.post(`${apiEndpoint}/adduser`, { username, password });
        setMessage(`User ${username} created successfully!`);
        setRegisterSuccess(true);
        setOpenSnackbar(true);
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        const errorMessage = err.response?.data?.error || 'Error creating user';
        setError(errorMessage);
        setOpenSnackbar(true); // Abre Snackbar para mostrar el error
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addUser();
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
      <Container component="main" maxWidth="xs" sx={{ zIndex: 1 }}>
        <AnimatedPaper style={formAnimation}>
          {registerSuccess ? (
            <div>
              <Typewriter words={[message]} cursor cursorStyle="|" typeSpeed={50} />
              <Typography variant="body1" sx={{ mt: 2, color: 'white' }}>
                Redirecting to login...
              </Typography>
            </div>
          ) : (
            <div>
              <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                Register
              </Typography>
              <InputField
                id="username"
                fullWidth
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyPress}
                error={!!usernameError}
                helperText={usernameError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUser color="rgba(0, 0, 0, 0.6)" />
                    </InputAdornment>
                  ),
                }}
              />
              <InputField
                id="password"
                fullWidth
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyPress}
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock color="rgba(0, 0, 0, 0.6)" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                data-testid="submit-button"
                fullWidth
                variant="contained"
                color="secondary"
                sx={{ mt: 3, borderRadius: 4, fontWeight: 'bold' }}
                onClick={addUser}
              >
                Create Account
              </Button>
               {/* Usamos un solo Snackbar y controlamos su contenido y apertura */}
              <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={error ? `Error: ${error}` : "User created"}
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

export default AddUser;