import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Card, CardContent, Typography, CircularProgress, Grid, Button, Snackbar, Avatar } from "@mui/material";
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import "../assets/css/AnimatedBackground.css";

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "radial-gradient(circle, #3f51b5 0%, #1a237e 100%)" }}>
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
    <Box className="start-menu-container" sx={{
      width: "100vw",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      color: "#ffffff",
      padding: 4,
      backgroundSize: "200% 200%",
      animation: "floatBg 40s ease-in-out infinite",
      '@keyframes floatBg': {
        '0%': { backgroundPosition: '0% 0%' },
        '50%': { backgroundPosition: '100% 100%' },
        '100%': { backgroundPosition: '0% 0%' }
      },
    }}>
      <Card sx={{
        backgroundColor: "rgba(255, 255, 255, 0)",
        backdropFilter: "blur(15px)",
        color: "#ffffff",
        borderRadius: 4,
        p: 4,
        maxWidth: 600,
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
      }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Avatar sx={{
              bgcolor: "#e91e63",
              width: 80,
              height: 80,
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: 1,
            }}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#e91e63", mb: 0.5, fontFamily: "Roboto, sans-serif" }}
              data-testid="profile-username"
            >
              {user.username}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#f5f5f599", fontFamily: "Roboto, sans-serif" }}>
              <PublicIcon sx={{ verticalAlign: "middle", marginRight: 0.5 }} /> Jugador activo
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <PublicIcon sx={{ color: "#64b5f6", mr: 1, fontSize: "1.5rem" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontFamily: "Roboto, sans-serif" }}>Juegos Jugados</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontFamily: "Roboto, sans-serif" }}>{user.gamesPlayed}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CheckCircleOutlineIcon sx={{ color: "#4caf50", mr: 1, fontSize: "1.5rem" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontFamily: "Roboto, sans-serif" }}>Respuestas Correctas</Typography>
              </Box>
              <Typography variant="h6" sx={{fontFamily: "Roboto, sans-serif" }}>{user.correctAnswers}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <CancelOutlinedIcon sx={{ color: "#f44336", mr: 1, fontSize: "1.5rem" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontFamily: "Roboto, sans-serif" }}>Respuestas Incorrectas</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontFamily: "Roboto, sans-serif" }}>{user.wrongAnswers}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TimerOutlinedIcon sx={{ color: "#ffc107", mr: 1, fontSize: "1.5rem" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", fontFamily: "Roboto, sans-serif" }}>Tiempo Jugado</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontFamily: "Roboto, sans-serif" }}>{user.totalTimePlayed} seg</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
            <Button
              variant="contained"
              onClick={() => navigate("/startmenu")}
              startIcon={<ArrowBackIcon />}
              sx={{
                backgroundColor: "#f50057",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#c51162" },
                fontFamily: "Roboto, sans-serif",
              }}
            >
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/ranking")}
              endIcon={<LeaderboardIcon />}
              sx={{
                backgroundColor: "#00bcd4",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { backgroundColor: "#008394" },
                fontFamily: "Roboto, sans-serif",
              }}
              data-testid="view-ranking-button"
            >
              Ranking
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={openSnackbar} autoHideDuration={6000} message={`Error: ${error}`} onClose={() => setOpenSnackbar(false)} />
    </Box>
  );
};

export default Profile;