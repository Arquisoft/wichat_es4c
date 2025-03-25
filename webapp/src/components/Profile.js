import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, CircularProgress, Grid, Button } from "@mui/material";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:8001/profile/${username}`);
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del perfil");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" }}>
        <CircularProgress sx={{ color: "#ffffff" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", color: "#ff4081", marginTop: "20px" }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)", color: "#ffffff" }}>
      <Card sx={{ backgroundColor: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", color: "#ffffff", borderRadius: 3, p: 4, minWidth: 450, maxWidth: 600, boxShadow: 5 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#ff4081" }}>{user.username}</Typography>
            <Typography variant="body1" sx={{ color: "#ffffff99" }}>Jugador activo</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>🎮 Juegos Jugados</Typography>
              <Typography variant="body1">{user.gamesPlayed}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>✅ Respuestas Correctas</Typography>
              <Typography variant="body1" sx={{ color: "#0f0" }}>{user.correctAnswers}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>❌ Respuestas Incorrectas</Typography>
              <Typography variant="body1" sx={{ color: "#f00" }}>{user.wrongAnswers}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>⏳ Tiempo Jugado</Typography>
              <Typography variant="body1">{user.totalTimePlayed} seg</Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button variant="contained" onClick={() => navigate("/startmenu")} sx={{ backgroundColor: "#ff4081", color: "#fff", fontWeight: "bold", '&:hover': { bgcolor: '#f50057' } }}>
              Volver al menú
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
