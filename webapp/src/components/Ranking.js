import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem } from "@mui/material";

const Ranking = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("correctAnswers");
  const loggedInUser = localStorage.getItem("username"); 

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(`http://localhost:8001/ranking?sortBy=${sortBy}`);
        if (!response.ok) {
          throw new Error("No se pudo obtener el ranking");
        }
        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [sortBy]);

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
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", 
        background: 'linear-gradient(90deg,rgb(73, 17, 203),rgb(113, 29, 182),rgb(38, 35, 223), #66ccff, #4e69c2)',
        backgroundSize: '400% 400%',
        animation: 'gradientWave 10s infinite normal forwards',
        '@keyframes gradientWave': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          }
        }, 
        color: "#ffffff", padding: "20px" }}>
      <Card sx={{ backgroundColor: " #6a11cb", backdropFilter: "blur(10px)", color: "#ffffff", borderRadius: 3, p: 4, minWidth: 600, maxWidth: 800, boxShadow: 5 }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2, color: "#ff4081" }}>Ranking de Jugadores</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Typography>Ordenar por:</Typography>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ backgroundColor: " #ff4081", color: "#fff", borderRadius: 1, padding: "5px 10px", maxHeight:"40px"}}
              >
                <MenuItem value="correctAnswers" sx={{background: sortBy === "correctAnswers" ? "#3b0f6b" : "#6a11cb", color: "#fff", "&:hover": { background: " #3b0f6b" }}}>Aciertos</MenuItem>
                <MenuItem value="wrongAnswers"sx={{background: sortBy === "correctAnswers" ? "#3b0f6b" : "#6a11cb", color: "#fff", "&:hover": { background: " #3b0f6b" }}}>Fallos</MenuItem>
                <MenuItem value="gamesPlayed"sx={{background: sortBy === "correctAnswers" ? "#3b0f6b" : "#6a11cb", color: "#fff", "&:hover": { background: " #3b0f6b" }}}>Partidas Jugadas</MenuItem>
              </Select>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#ffffff", maxHeight: "400px", overflowY: "auto", borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead sx={{ backgroundColor: " #66ccff" }}>
                <TableRow>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>#</TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>Jugador</TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>🎮 Partidas</TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>✅ Aciertos</TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>❌ Fallos</TableCell>
                  <TableCell sx={{ color: "#ffffff", fontWeight: "bold", backgroundColor: "#2575fc" }}>⏳ Tiempo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow 
                    key={player.username} 
                    hover
                    sx={{ 
                      cursor: "pointer", 
                      "&:hover": { backgroundColor: "#f5005733" }, 
                      backgroundColor: player.username === loggedInUser ? "#ff408155" : "inherit"
                    }}
                    onClick={() => navigate(`/profile/${player.username}`)} 
                  >
                    <TableCell sx={{ color: "#ffffff" }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: "#ffffff", fontWeight: "bold" }}>
                      {player.username} {player.username === loggedInUser && "⭐"}
                    </TableCell>
                    <TableCell sx={{ color: "#ffffff" }}>{player.gamesPlayed}</TableCell>
                    <TableCell sx={{ color: "#0f0" }}>{player.correctAnswers}</TableCell>
                    <TableCell sx={{ color: "#f00" }}>{player.wrongAnswers}</TableCell>
                    <TableCell sx={{ color: "#ffffff" }}>{player.totalTimePlayed} seg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <Button variant="contained" onClick={() => navigate("/startmenu")} sx={{ backgroundColor: "#ff4081", color: "#fff", fontWeight: "bold", '&:hover': { bgcolor: ' #f50057' } }}>
              Volver al menú
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Ranking;
