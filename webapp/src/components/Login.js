import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Typography, TextField, Button, Snackbar } from '@mui/material';
import { Typewriter } from "react-simple-typewriter";

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const navigate = useNavigate();
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
  const apiKey = process.env.REACT_APP_LLM_API_KEY || 'None';

  const loginUser = async () => {
    try {
      const response = await axios.post(`${apiEndpoint}/login`, { username, password });

      const question = `Please, generate a greeting message for a student called ${username} that is a student of the Software Architecture course in the University of Oviedo. Be nice and polite.`;
      const model = "empathy";

      let greetingMessage = "Welcome!";
      
      if (apiKey !== 'None') {
        try {
          const messageResponse = await axios.post(`${apiEndpoint}/askllm`, { question, model, apiKey });
          greetingMessage = messageResponse.data?.answer || "Default greeting message.";
        } catch (error) {
          greetingMessage = "Failed to fetch greeting message.";
        }
      } else {
        greetingMessage = "LLM API key is not set. Cannot contact the LLM.";
      }

      setMessage(greetingMessage);
      setCreatedAt(response.data?.createdAt || '');
      setLoginSuccess(true);
      setOpenSnackbar(true);

      localStorage.setItem("username", username);
      onLoginSuccess();
      navigate('/startmenu');
    } catch (error) {
      setError(error.response?.data?.error || "Login failed. Please try again.");
    }
  };


  return (
    <Container component="main" maxWidth="xs" sx={{ marginTop: 4 }}>
      {loginSuccess ? (
        <div>
          <Typewriter words={[message]} cursor cursorStyle="|" typeSpeed={50} />
          <Typography variant="body1" sx={{ textAlign: 'center', marginTop: 2 }}>
            Your account was created on {new Date(createdAt).toLocaleDateString()}.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 2 }}
          >
            Ir al Juego
          </Button>
        </div>
      ) : (
        <div>
          <Typography component="h1" variant="h5">Login</Typography>
          <TextField margin="normal" fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <TextField margin="normal" fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button variant="contained" color="primary" onClick={loginUser}>Login</Button>
          <Snackbar open={openSnackbar} autoHideDuration={6000} message="Login successful" />
          {error && <Snackbar open={!!error} autoHideDuration={6000} message={`Error: ${error}`} />}
        </div>
      )}
    </Container>
  );
};

export default Login;