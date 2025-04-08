import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Box, Paper } from '@mui/material';

const Home = () => {
  return (
    <Box
      data-testid="home-container"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(90deg,rgb(73, 17, 203),rgb(113, 29, 182),rgb(38, 35, 223), #66ccff, #4e69c2)',
        backgroundSize: '400% 400%',
        animation: 'gradientWave 10s infinite normal forwards',
        '@keyframes gradientWave': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          }
      }
    }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 5,
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 500,
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          color: 'white',
        }}
      >
        <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
          Welcome to the 2025 Edition
        </Typography>
        <Typography variant="h6" gutterBottom>
          Software Architecture Course
        </Typography>
        <Box mt={3}>
          <Button
            fullWidth
            variant="contained"
            sx={{ mb: 2, bgcolor: '#ff4081', '&:hover': { bgcolor: '#f50057' } }}
            component={Link}
            to="/login"
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: '#ff4081', color: '#ff4081' } }}
            component={Link}
            to="/register"
          >
            Register
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
