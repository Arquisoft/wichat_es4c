import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Card, CardContent, Typography, CircularProgress, Grid, Button, Snackbar } from "@mui/material";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/profile/${username}`);
        setUser(response.data);
      } catch (error) {
        setError(error.response?.data?.error || "No se pudo obtener la información del perfil");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#212121" }}>
        <CircularProgress sx={{ color: "#00FFFF" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#212121", color: "#00FFFF" }}>
      <Card sx={{ backgroundColor: "#333", color: "#00FFFF", borderRadius: 3, p: 4, minWidth: 450, maxWidth: 600 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>{user?.username}</Typography>
            <Typography variant="body1" sx={{ color: "#aaa" }}>Jugador activo</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h6">🎮 Juegos Jugados</Typography>
              <Typography variant="body1">{user?.gamesPlayed}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">✅ Respuestas Correctas</Typography>
              <Typography variant="body1">{user?.correctAnswers}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">❌ Respuestas Incorrectas</Typography>
              <Typography variant="body1">{user?.wrongAnswers}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6">⏳ Tiempo Jugado</Typography>
              <Typography variant="body1">{user?.totalTimePlayed} seg</Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button variant="contained" onClick={() => navigate("/startmenu")} sx={{ backgroundColor: "#00FFFF", color: "#212121" }}>
              Volver al menú
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={openSnackbar} autoHideDuration={6000} message={`Error: ${error}`} onClose={() => setOpenSnackbar(false)} />
    </Box>
  );
};

export default Profile;
