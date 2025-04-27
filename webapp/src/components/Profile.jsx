// Profile.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Card, CardContent, Typography, CircularProgress, Grid, Button, Snackbar,
  Avatar, Tooltip, IconButton,
  Divider, List, ListItem, ListItemText, Drawer
} from "@mui/material";
import PublicIcon from '@mui/icons-material/Public';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CloseIcon from '@mui/icons-material/Close';

import "../assets/css/AnimatedBackground.css";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const localUsername = localStorage.getItem("username");

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendIdInput, setFriendIdInput] = useState("");

  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`${apiEndpoint}/profile/${username}`);
        setUser(res.data);
        setUserId(res.data._id);
      } catch (err) {
        setError("No se pudo obtener la información del perfil");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    const fetchFriends = async () => {
      if (username !== localUsername) return;
      try {
        const response = await axios.post(`${apiEndpoint}/friends`, { username });
        setFriends(response.data.friends);
      } catch (err) {
        console.error("Error al obtener amigos:", err);
      }
    };

    fetchUserProfile();
    fetchFriends();
  }, [username, navigate, localUsername]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!userId || !friendIdInput) return;
    try {
      await axios.post(`${apiEndpoint}/addFriend`, { userId, friendId: friendIdInput });
      setFriendIdInput("");
      const response = await axios.post(`${apiEndpoint}/friends`, { username });
      setFriends(response.data.friends);
    } catch (err) {
      alert("Error al añadir amigo.");
    }
  };

  const handleRemoveFriend = async (friendUsername) => {
    try {
      await axios.post(`${apiEndpoint}/removeFriend`, { userId, friendUsername });
      const response = await axios.post(`${apiEndpoint}/friends`, { username });
      setFriends(response.data.friends);
    } catch (err) {
      alert("Error al eliminar amigo.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "radial-gradient(circle, #3f51b5 0%, #1a237e 100%)" }}>
        <CircularProgress sx={{ color: "#ffffff" }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography variant="h6" color="error">Error al cargar el perfil</Typography>
      </Box>
    );
  }

  return (
    <Box className="start-menu-container" sx={{
      width: "100vw", minHeight: "100vh",
      display: "flex", justifyContent: "center", alignItems: "center",
      padding: 4, backgroundSize: "200% 200%", animation: "floatBg 40s ease-in-out infinite"
    }}>
      {/* Drawer amigos */}
      {username === localUsername && (
        <Drawer anchor="right" variant="permanent" sx={{
          width: 240, flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240, backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(6px)", borderLeft: "1px solid #ffffff33", color: "#fff"
          }
        }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" align="center">Amigos</Typography>
            <Divider sx={{ mb: 1 }} />
            <List dense>
              {friends.length === 0 ? (
                <Typography variant="body2" align="center" sx={{ color: "#ccc" }}>
                  No tienes amigos añadidos.
                </Typography>
              ) : (
                friends.map((friend, i) => (
                  <ListItem key={i} sx={{ borderRadius: 1, '&:hover': { backgroundColor: "#ffffff22" } }}
                    secondaryAction={
                      <Tooltip title="Eliminar amigo">
                        <IconButton sx={{ color: "#f44336" }} onClick={() => handleRemoveFriend(friend)}>
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    }>
                    <ListItemText primary={friend} primaryTypographyProps={{
                      color: "white", fontWeight: "bold", sx: { cursor: "pointer" },
                      onClick: () => navigate(`/profile/${friend}`)
                    }} />
                  </ListItem>
                ))
              )}
            </List>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
              <Typography variant="caption" sx={{ color: "#ffffffaa" }}>
                Tu ID: {userId || "No disponible"}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 1, color: "#fff", borderColor: "#fff", minWidth: "32px", px: 1 }}
                onClick={() => { if (userId) navigator.clipboard.writeText(userId); }}
              >
                📋
              </Button>
            </Box>

            <Divider sx={{ my: 1 }} />
            <Box display="flex" flexDirection="column" gap={1} mt={2}>
              <Typography variant="body2">Añadir amigo por ID:</Typography>
              <Box component="form" onSubmit={handleAddFriend}>
                <input
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value)}
                  placeholder="ID del amigo"
                  style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <Button type="submit" variant="contained" size="small" fullWidth
                  sx={{ backgroundColor: "#00bcd4", mt: 1, fontWeight: "bold", "&:hover": { backgroundColor: "#0097a7" } }}>
                  Añadir amigo
                </Button>
              </Box>
            </Box>
          </Box>
        </Drawer>
      )}

      {/* Contenido perfil */}
      <Box sx={{
        width: "100vw", minHeight: "100vh",
        display: "flex", justifyContent: "center", alignItems: "center",
        color: "#ffffff", padding: 4, backgroundSize: "200% 200%",
        animation: "floatBg 40s ease-in-out infinite"
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
                bgcolor: "#e91e63", width: 80, height: 80,
                fontSize: "2.5rem", fontWeight: "bold", mb: 1
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
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Juegos Jugados</Typography>
                </Box>
                <Typography variant="h6" data-testid="games-played-count">{user.gamesPlayed}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CheckCircleOutlineIcon sx={{ color: "#4caf50", mr: 1, fontSize: "1.5rem" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Respuestas Correctas</Typography>
                </Box>
                <Typography variant="h6" data-testid="correct-answers">{user.correctAnswers}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CancelOutlinedIcon sx={{ color: "#f44336", mr: 1, fontSize: "1.5rem" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Respuestas Incorrectas</Typography>
                </Box>
                <Typography variant="h6" data-testid="wrong-answers">{user.wrongAnswers}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TimerOutlinedIcon sx={{ color: "#ffc107", mr: 1, fontSize: "1.5rem" }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Tiempo Jugado</Typography>
                </Box>
                <Typography variant="h6" data-testid="total-time">{user.totalTimePlayed} seg</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="contained"
                onClick={() => navigate("/startmenu")}
                startIcon={<ArrowBackIcon />}
                sx={{ backgroundColor: "#f50057", color: "#fff", fontWeight: "bold" }}
              >
                Volver
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate("/ranking")}
                endIcon={<LeaderboardIcon />}
                sx={{ backgroundColor: "#00bcd4", color: "#fff", fontWeight: "bold" }}
              >
                Ranking
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Snackbar open={openSnackbar} autoHideDuration={6000} message={`Error: ${error}`} onClose={() => setOpenSnackbar(false)} />
      </Box>
    </Box>
  );
};

export default Profile;
