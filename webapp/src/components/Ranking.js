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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#1a1a1a" }}>
        <CircularProgress sx={{ color: "#00FFFF" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", color: "red", marginTop: "20px" }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1a1a1a", color: "#00FFFF", padding: "20px" }}>
      <Card sx={{ backgroundColor: "#2b2b2b", color: "#00FFFF", borderRadius: 3, p: 4, minWidth: 600, maxWidth: 800, boxShadow: "0px 4px 10px rgba(0, 255, 255, 0.3)" }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>Ranking de Jugadores</Typography>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2 }}>
              <Typography>Ordenar por:</Typography>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ backgroundColor: "#222", color: "#00FFFF", borderRadius: 1, padding: "5px 10px" }}
              >
                <MenuItem value="correctAnswers">Aciertos</MenuItem>
                <MenuItem value="wrongAnswers">Fallos</MenuItem>
                <MenuItem value="gamesPlayed">Partidas Jugadas</MenuItem>
              </Select>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{ backgroundColor: "#1a1a1a", color: "#00FFFF", maxHeight: "400px", overflowY: "auto", borderRadius: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>#</TableCell>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>Jugador</TableCell>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>🎮 Partidas</TableCell>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>✅ Aciertos</TableCell>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>❌ Fallos</TableCell>
                  <TableCell sx={{ color: "#00FFFF", fontWeight: "bold", backgroundColor: "#222" }}>⏳ Tiempo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow 
                    key={player.username} 
                    hover
                    sx={{ 
                      cursor: "pointer", 
                      "&:hover": { backgroundColor: "#00FFFF33" }, 
                      backgroundColor: player.username === loggedInUser ? "#00AAFF55" : "inherit"
                    }}
                    onClick={() => navigate(`/profile/${player.username}`)} 
                  >
                    <TableCell sx={{ color: "#fff" }}>{index + 1}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>
                      {player.username} {player.username === loggedInUser && "⭐"}
                    </TableCell>
                    <TableCell sx={{ color: "#fff" }}>{player.gamesPlayed}</TableCell>
                    <TableCell sx={{ color: "#0f0" }}>{player.correctAnswers}</TableCell>
                    <TableCell sx={{ color: "#f00" }}>{player.wrongAnswers}</TableCell>
                    <TableCell sx={{ color: "#fff" }}>{player.totalTimePlayed} seg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button variant="contained" onClick={() => navigate("/startmenu")} sx={{ backgroundColor: "#00FFFF", color: "#212121", fontWeight: "bold" }}>
              Volver al menú
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Ranking;
