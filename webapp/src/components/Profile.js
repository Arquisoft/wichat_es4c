import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Card, CardContent, Typography, CircularProgress, Grid, Button,
  Snackbar, Divider, List, ListItem, ListItemText, Drawer
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendIdInput, setFriendIdInput] = useState("");
  const [challengeRequest, setChallengeRequest] = useState(null);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [waitingForChallenge, setWaitingForChallenge] = useState(false);
  const [challengedFriend, setChallengedFriend] = useState("");

  const localUsername = localStorage.getItem("username");

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

    const checkChallengeRequest = async () => {
      if (username !== localUsername) return;
      try {
        const res = await axios.get(`${apiEndpoint}/profile/${localUsername}`);
        if (res.data.challengeRequest?.from) {
          setChallengeRequest(res.data.challengeRequest);
          setChallengeDialogOpen(true);
        }
      } catch (err) {
        console.error("Error al comprobar retos:", err);
      }
    };

    const checkIfChallengeAccepted = async () => {
      try {
        const res = await axios.get(`${apiEndpoint}/checkChallengeStatus/${localUsername}`);
        if (res.data.status === "accepted") {
          navigate(`/game?duel=true&player1=${localUsername}&player2=${res.data.opponent}`);
        }
      } catch (err) {
        console.error("Error comprobando estado del reto:", err);
      }
    };

    let interval;
    if (waitingForChallenge) {
      interval = setInterval(checkIfChallengeAccepted, 3000);
    }

    fetchUserProfile();
    checkChallengeRequest();

    return () => clearInterval(interval);
  }, [username, navigate, localUsername, waitingForChallenge]);

  const fetchFriends = async () => {
    if (username !== localUsername) return;

    try {
      const response = await axios.post(`${apiEndpoint}/friends`, { username });
      setFriends(response.data.friends);
    } catch (error) {
      console.error("Error al obtener amigos:", error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [username, localUsername]);

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!userId || !friendIdInput) return;

    try {
      await axios.post(`${apiEndpoint}/addFriend`, {
        userId,
        friendId: friendIdInput
      });
      await fetchFriends();
      alert("Amigo añadido correctamente.");
      setFriendIdInput("");
    } catch (err) {
      alert("Error al añadir amigo.");
    }
  };

  const handleRemoveFriend = async (friendUsername) => {
    try {
      await axios.post(`${apiEndpoint}/removeFriend`, {
        userId,
        friendUsername
      });
      await fetchFriends();
      alert("Amigo eliminado correctamente.");
    } catch (err) {
      alert("Error al eliminar amigo.");
    }
  };

  const sendChallenge = async (friendUsername) => {
    try {
      await axios.post(`${apiEndpoint}/challengeFriend`, {
        fromUsername: localUsername,
        toUsername: friendUsername
      });
      setChallengedFriend(friendUsername);
      setWaitingForChallenge(true);
    } catch (err) {
      alert("Error al enviar el reto.");
    }
  };

  const acceptChallenge = async () => {
    try {
      await axios.post(`${apiEndpoint}/acceptChallenge`, {
        username: localUsername,
        from: challengeRequest?.from
      });
      navigate(`/game?duel=true&player1=${challengeRequest?.from}&player2=${localUsername}`);
    } catch (err) {
      alert("Error al aceptar el reto.");
    }
  };

  const rejectChallenge = async () => {
    try {
      await axios.post(`${apiEndpoint}/rejectChallenge`, {
        username: localUsername
      });
      setChallengeDialogOpen(false);
      setChallengeRequest(null);
    } catch (err) {
      alert("Error al rechazar el reto.");
    }
  };

  if (loading) {
    return <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" }}>
      <CircularProgress sx={{ color: "#ffffff" }} />
    </Box>;
  }

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)", color: "#ffffff", position: "relative" }}>
      <Drawer anchor="right" variant="permanent" sx={{
        width: 240, flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(6px)",
          color: "#fff",
          borderLeft: "1px solid #ffffff33"
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
                    <>
                      <Tooltip title="Retar a batalla">
                        <IconButton sx={{ color: "#0f0" }} onClick={() => sendChallenge(friend)}>
                          ⚔️
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar amigo">
                        <IconButton sx={{ color: "#f44336" }} onClick={() => handleRemoveFriend(friend)}>
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  }>
                  <ListItemText primary={friend} primaryTypographyProps={{
                    color: "white", fontWeight: "bold", sx: { cursor: "pointer" },
                    onClick: () => navigate(`/profile/${friend}`)
                  }} />
                </ListItem>
              ))
            )}
          </List>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
            <Typography variant="caption">Tu ID: {userId || "No disponible"}</Typography>
            <Button variant="outlined" size="small" onClick={() => navigator.clipboard.writeText(userId)} sx={{ color: "#fff", borderColor: "#fff" }}>
              📋
            </Button>
          </Box>
          <Box mt={2}>
            <Typography variant="body2">Añadir amigo por ID:</Typography>
            <Box component="form" onSubmit={handleAddFriend}>
              <input value={friendIdInput} onChange={(e) => setFriendIdInput(e.target.value)} placeholder="ID del amigo"
                style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "6px" }} />
              <Button type="submit" variant="contained" size="small" fullWidth sx={{ backgroundColor: "#00bcd4", fontWeight: "bold", "&:hover": { backgroundColor: "#0097a7" } }}>
                Añadir amigo
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", marginRight: username === localUsername ? "240px" : 0 }}>
        <Card sx={{
          backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", color: "#ffffff",
          borderRadius: 3, p: 4, minWidth: 450, maxWidth: 600, boxShadow: 5
        }}>
          <CardContent>
            <Typography variant="h4" align="center" sx={{ fontWeight: "bold", color: "#ff4081", mb: 1 }}>
              {user.username}
            </Typography>
            <Typography align="center" sx={{ color: "#ffffff99" }}>Jugador activo</Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}><Typography>🎮 Juegos Jugados</Typography><Typography>{user.gamesPlayed}</Typography></Grid>
              <Grid item xs={6}><Typography>✅ Respuestas Correctas</Typography><Typography sx={{ color: "#0f0" }}>{user.correctAnswers}</Typography></Grid>
              <Grid item xs={6}><Typography>❌ Respuestas Incorrectas</Typography><Typography sx={{ color: "#f00" }}>{user.wrongAnswers}</Typography></Grid>
              <Grid item xs={6}><Typography>⏳ Tiempo Jugado</Typography><Typography>{user.totalTimePlayed}s</Typography></Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Dialogos de desafío */}
      <Dialog open={challengeDialogOpen} onClose={() => setChallengeDialogOpen(false)}>
        <DialogTitle>¡Has sido retado!</DialogTitle>
        <DialogContent>
          <Typography>{challengeRequest?.from} te ha retado a una batalla. ¿Aceptas?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={rejectChallenge} sx={{ color: "#f44336" }}>Rechazar</Button>
          <Button onClick={acceptChallenge} sx={{ color: "#4caf50" }} autoFocus>Aceptar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={waitingForChallenge} disableEscapeKeyDown hideBackdrop>
        <DialogTitle>Esperando respuesta...</DialogTitle>
        <DialogContent>
          <Typography>Has retado a <strong>{challengedFriend}</strong>. Esperando su respuesta...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setWaitingForChallenge(false);
            setChallengedFriend("");
          }} sx={{ color: "#f44336", fontWeight: "bold" }}>
            Cancelar reto
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={6000} message={`Error: ${error}`} onClose={() => setOpenSnackbar(false)} />
    </Box>
  );
};

export default Profile;
