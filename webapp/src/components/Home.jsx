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
        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
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
            Don't have an account? Register here.
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;
