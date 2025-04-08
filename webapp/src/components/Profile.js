import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Grid,
  Button,
  Snackbar,
  Divider,
  List,
  ListItem,
  ListItemText,
  Drawer,
} from "@mui/material";

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

  const localUsername = localStorage.getItem("username");

  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/profile/${username}`);
        setUser(response.data);
        setUserId(response.data._id);
      } catch (error) {
        setError(error.response?.data?.error || "No se pudo obtener la informaci\u00f3n del perfil");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, navigate]);

  const fetchFriends = async () => {
    if (username !== localUsername) return;

    try {
      const response = await axios.post(`${apiEndpoint}/friends`, { username });
      setFriends(response.data.friends);
    } catch (error) {
      console.error("Error al obtener la lista de amigos:", error);
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
        friendId: friendIdInput,
      });

      await fetchFriends();

      alert("Amigo añadido correctamente.");
      setFriendIdInput("");
    } catch (error) {
      alert("Error al añadir amigo.");
      console.error(error);
    }
  };

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
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        color: "#ffffff",
        position: "relative",
      }}
    >
      {username === localUsername && (
        <Drawer
          anchor="right"
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: 240,
              boxSizing: 'border-box',
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
              color: "#fff",
              borderLeft: "1px solid #ffffff33"
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ color: "#fff", textAlign: "center" }}>👥 Amigos</Typography>
            <Divider sx={{ backgroundColor: "#ffffff33", mb: 1 }} />

            <List dense>
              {friends.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#ccc", textAlign: "center", mt: 1 }}>
                  No tienes amigos añadidos.
                </Typography>
              ) : (
                friends.map((friend, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={friend} primaryTypographyProps={{ color: "white" }} />
                  </ListItem>
                ))
              )}
            </List>

            <Divider sx={{ my: 1, backgroundColor: "#ffffff33" }} />

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 2 }}>
              <Typography variant="caption" sx={{ color: "#ffffffaa" }}>
                Tu ID: {userId || "No disponible"}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 1, color: "#fff", borderColor: "#fff", minWidth: "32px", px: 1 }}
                onClick={() => {
                  if (userId) {
                    navigator.clipboard.writeText(userId);
                  }
                }}
              >
                📋
              </Button>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
                A\u00f1adir amigo por ID:
              </Typography>
              <Box component="form" onSubmit={handleAddFriend}>
                <input
                  type="text"
                  value={friendIdInput}
                  onChange={(e) => setFriendIdInput(e.target.value)}
                  placeholder="ID del amigo"
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                    marginBottom: "6px"
                  }}
                />
                <Button type="submit" size="small" fullWidth variant="contained" sx={{
                  backgroundColor: "#00bcd4", fontWeight: "bold", "&:hover": { backgroundColor: "#0097a7" }
                }}>
                  A\u00f1adir amigo
                </Button>
              </Box>
            </Box>
          </Box>
        </Drawer>
      )}

      <Card
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          color: "#ffffff",
          borderRadius: 3,
          p: 4,
          minWidth: 450,
          maxWidth: 600,
          boxShadow: 5,
        }}
      >
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#ff4081" }}>
              {user.username}
            </Typography>
            <Typography variant="body1" sx={{ color: "#ffffff99" }}>
              Jugador activo
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                🎮 Juegos Jugados
              </Typography>
              <Typography variant="body1">{user.gamesPlayed}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                ✅ Respuestas Correctas
              </Typography>
              <Typography variant="body1" sx={{ color: "#0f0" }}>
                {user.correctAnswers}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                ❌ Respuestas Incorrectas
              </Typography>
              <Typography variant="body1" sx={{ color: "#f00" }}>
                {user.wrongAnswers}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h6" sx={{ color: "#ffffff" }}>
                ⏳ Tiempo Jugado
              </Typography>
              <Typography variant="body1">{user.totalTimePlayed} seg</Typography>
            </Grid>
          </Grid>

          {user?.gameHistory?.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 1, textAlign: "center", color: "#ffffff" }}>
                Historial de Partidas
              </Typography>
              <Box
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 2,
                  p: 2,
                }}
              >
                {user.gameHistory
                  .slice()
                  .reverse()
                  .map((game, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                        borderBottom: "1px solid #ffffff33",
                        pb: 1,
                      }}
                    >
                      <Typography variant="body2" color="#ccc">
                        {new Date(game.date).toLocaleString()}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Typography variant="body2" sx={{ color: "lightgreen" }}>
                          ✅ {game.correct}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "red" }}>
                          ❌ {game.wrong}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#ffffffcc" }}>
                          ⏱ {game.timePlayed}s
                        </Typography>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/startmenu")}
              sx={{ backgroundColor: "#ff4081", color: "#fff", fontWeight: "bold", "&:hover": { bgcolor: "#f50057" } }}
            >
              Volver al men\u00fa
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate("/ranking")}
              sx={{ backgroundColor: "#ff4081", color: "#fff", fontWeight: "bold", "&:hover": { bgcolor: "#f50057" } }}
            >
              Ver ranking
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={openSnackbar} autoHideDuration={6000} message={`Error: ${error}`} onClose={() => setOpenSnackbar(false)} />
    </Box>
  );
};

export default Profile;
