import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar, Paper, Box } from '@mui/material';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

const AddUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();

  const addUser = async () => {
    try {
      await axios.post(`${apiEndpoint}/adduser`, { username, password });
      setOpenSnackbar(true);
      setTimeout(() => navigate('/login'), 2000); // Redirigir después de 2 segundos
    } catch (error) {
      setError(error.response?.data?.error || "Failed to add user.");
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Container component="main" maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
            Register
          </Typography>
          <TextField
            margin="normal"
            fullWidth
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            margin="normal"
            fullWidth
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            data-testid="submit-button"
            sx={{ mt: 2 }}
            onClick={addUser}
          >
            Sign Up
          </Button>
          <Snackbar open={openSnackbar} autoHideDuration={6000} message="User added successfully" />
          {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
        </Paper>
      </Container>
    </Box>
  );
};

export default AddUser;