import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar, Box, styled, InputAdornment } from '@mui/material';
import Globe from 'react-globe.gl';
import { useSpring, animated } from 'react-spring';
import { FaUser, FaLock } from 'react-icons/fa';

// Constantes para configuración del globo
const ARC_INTERVAL_MS = 2000;
const MAX_ARCS = 5;
const ARC_STROKE = 0.5;
const ARC_ANIMATION_SPEED = 3000;

// Estilos para el contenedor del formulario
const AnimatedPaper = styled(animated(Box))(({ theme }) => ({
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

// Estilos para los campos de texto
const InputField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(2, 0),
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

const Login = ({ onLoginSuccess }) => {
  const globeEl = useRef();
  const [globeWidth, setGlobeWidth] = useState(window.innerWidth);
  const [globeHeight, setGlobeHeight] = useState(window.innerHeight);
  const [arcsData, setArcsData] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

  const formAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { mass: 1, tension: 170, friction: 26 },
  });

  useEffect(() => {
    const generateRandomArc = () => {
      const startLat = (Math.random() - 0.5) * 180;
      const startLng = (Math.random() - 0.5) * 360;
      const endLat = (Math.random() - 0.5) * 180;
      const endLng = (Math.random() - 0.5) * 360;
      return {
        startLat,
        startLng,
        endLat,
        endLng,
        color: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, 255, 0.8)`,
      };
    };

    const interval = setInterval(() => {
      setArcsData(prevArcs => [...prevArcs.slice(-(MAX_ARCS - 1)), generateRandomArc()]);
    }, ARC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setGlobeWidth(window.innerWidth);
      setGlobeHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;
    }
  }, []);

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
      navigate('/startmenu');
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
    }
  };

  // Manejar enter en los campos
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      loginUser();
    }
  };

  const handleGoBack = (e) => {
    navigate('/');
  };

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#000010',
    }}>
    <Box
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
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
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="rgba(60, 120, 255, 0.5)"
          atmosphereAltitude={0.15}
          width={globeWidth}
          height={globeHeight}
          arcsData={arcsData}
          arcColor="color"
          arcDashLength={0.3}
          arcDashGap={0.15}
          arcDashAnimateTime={ARC_ANIMATION_SPEED}
          arcStroke={() => ARC_STROKE}
        />
      </Box>

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
                margin="normal"
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
                margin="normal"
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
                  mt: 3,
                  borderRadius: 4,
                  fontWeight: 'bold',
                }}
                onClick={loginUser}
              >
                Login
              </Button>
              <Snackbar open={openSnackbar} autoHideDuration={6000} message="Login successful" />
              {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
            </div>
          )}
        </AnimatedPaper>
      </Container>
    </Box>
  );
};

export default Login;