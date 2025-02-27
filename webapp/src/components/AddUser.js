import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar } from '@mui/material';

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
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5">Add User</Typography>
      <TextField margin="normal" fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField margin="normal" fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button variant="contained" color="primary" onClick={addUser}>Add User</Button>
      <Snackbar open={openSnackbar} autoHideDuration={6000} message="User added successfully" />
      {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
    </Container>
  );
};

export default AddUser;