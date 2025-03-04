import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Button, CircularProgress } from '@mui/material';

const Profile = ({ username, setShowProfile }) => { // 🔹 NUEVO: Recibe setShowProfile como prop
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8001';

  useEffect(() => {
    if (!username) {
      setError("No se recibió un usuario válido.");
      setLoading(false);
      return;
    }
  
    const fetchProfile = async () => {
      try {
        console.log(`Haciendo petición a: ${apiEndpoint}/profile/${username}`);
        const response = await axios.get(`${apiEndpoint}/profile/${username}`);
        setUserData(response.data);
      } catch (err) {
        setError("Error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <Container component="main" maxWidth="xs">
        <CircularProgress sx={{ marginTop: 4 }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container component="main" maxWidth="xs">
        <Typography variant="h6" color="error" sx={{ marginTop: 4 }}>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Typography variant="h4" sx={{ marginTop: 3 }}>
        Perfil de {userData.username}
      </Typography>
      <Typography variant="body1" sx={{ marginTop: 2 }}>
        Juegos Jugados: {userData.gamesPlayed}
      </Typography>
      <Typography variant="body1">
        Preguntas Acertadas: {userData.correctAnswers}
      </Typography>
      <Typography variant="body1">
        Preguntas Falladas: {userData.wrongAnswers}
      </Typography>
      <Typography variant="body1">
        Tiempo Total Jugado: {userData.totalTimePlayed} segundos
      </Typography>
      
      <Typography variant="h6" sx={{ marginTop: 2 }}>Historial de Partidas</Typography>
      {userData.gameHistory.length > 0 ? (
        userData.gameHistory.map((game, index) => (
          <Typography key={index} variant="body2">
            {new Date(game.date).toLocaleDateString()} - Correctas: {game.correct}, Incorrectas: {game.wrong}, Tiempo: {game.timePlayed}s
          </Typography>
        ))
      ) : (
        <Typography variant="body2">No hay partidas registradas.</Typography>
      )}

      <Button variant="contained" color="secondary" sx={{ marginTop: 2 }}>
        Editar Perfil
      </Button>

      {/* 🔹 NUEVO: Botón de volver que mantiene la sesión activa */}
      <Button
        variant="outlined"
        color="primary"
        sx={{ marginTop: 2, marginLeft: 2 }}
        onClick={() => setShowProfile(false)} // 🔹 Cambia showProfile a false sin afectar isLoggedIn
      >
        Volver
      </Button>
    </Container>
  );
};

export default Profile;
