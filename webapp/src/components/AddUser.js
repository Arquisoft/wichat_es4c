import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, Button, Snackbar, Box, styled, TextField, InputAdornment } from '@mui/material';
import Globe from 'react-globe.gl';
import { Typewriter } from 'react-simple-typewriter';
import { useSpring, animated } from 'react-spring';
import { FaUser, FaLock } from 'react-icons/fa';

const ARC_INTERVAL_MS = 2000;
const MAX_ARCS = 5;
const ARC_STROKE = 0.5;
const ARC_ANIMATION_SPEED = 3000;

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

const AddUser = () => {
  const globeEl = useRef();
  const [globeWidth, setGlobeWidth] = useState(window.innerWidth);
  const [globeHeight, setGlobeHeight] = useState(window.innerHeight);
  const [arcsData, setArcsData] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

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

  const addUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setMessage(`User ${username} created successfully!`);
      setRegisterSuccess(true);
      setOpenSnackbar(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating user');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addUser();
    }
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
          arcStroke={ARC_STROKE}
        />
      </Box>

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
                fullWidth
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
                fullWidth
                type="password"
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
                sx={{ mt: 3, borderRadius: 4, fontWeight: 'bold' }}
                onClick={addUser}
              >
                Create Account
              </Button>
              <Snackbar open={openSnackbar} autoHideDuration={6000} message="User created" />
              {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
            </div>
          )}
        </AnimatedPaper>
      </Container>
    </Box>
  );
};

export default AddUser;
