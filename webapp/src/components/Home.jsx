import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button } from '@mui/material';

const Home = () => {
  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5" align="center">
        Welcome to the 2025 edition of the Software Architecture course
      </Typography>
      <Button fullWidth variant="contained" color="primary" sx={{ mt: 2 }} component={Link} to="/login">
        Login
      </Button>
      <Button fullWidth variant="outlined" color="secondary" sx={{ mt: 2 }} component={Link} to="/register">
        Register
      </Button>
    </Container>
  );
};

export default Home;
