import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box, Card, CardContent, Typography, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Button, Select, MenuItem,
  Pagination // Importa el componente Pagination de Material-UI
} from "@mui/material";
import "../assets/css/Ranking.css";

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

const Ranking = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("correctAnswers");
  const loggedInUser = localStorage.getItem("username");

  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 5; // Define cuántos jugadores mostrar por página

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/ranking?sortBy=${sortBy}`);
        setPlayers(response.data);
      } catch (error) {
        setError(error.response?.data?.error || "No se pudo obtener el ranking");
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [sortBy]);

  // Calcula los índices del primer y último jugador en la página actual
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = players.slice(indexOfFirstPlayer, indexOfLastPlayer);
  const totalPages = Math.ceil(players.length / playersPerPage);

  // Función para cambiar de página
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (loading) {
    return (
      <Box sx={{
        display: "flex", justifyContent: "center", alignItems: "center", height: "100vh",
        background: "#0d0d1a"
      }}>
        <CircularProgress sx={{ color: "#b388ff" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", color: "#ff4081", mt: 4, fontFamily: 'Orbitron, sans-serif' }}>
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="start-menu-container" sx={{
      width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      backgroundSize: "200% 200%",
      animation: "floatBg 40s ease-in-out infinite",
      '@keyframes floatBg': {
        '0%': { backgroundPosition: '0% 0%' },
        '50%': { backgroundPosition: '100% 100%' },
        '100%': { backgroundPosition: '0% 0%' }
      },
      p: 2,
      fontFamily: 'Orbitron, sans-serif',
      overflow: "hidden"
    }}>
      <Card sx={{
        backdropFilter: "blur(16px)",
        backgroundColor: "rgba(15, 15, 30, 0.72)",
        border: "1px solid rgba(179,136,255,0.2)",
        borderRadius: 5,
        p: 4,
        maxWidth: 960,
        width: "95%",
        boxShadow: "0 0 30px rgba(179,136,255,0.2)",
        color: "#e0e0ff",
        animation: "fadeIn 1s ease-out",
        overflowX: "hidden"
      }}>
        <CardContent>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h3" sx={{
              fontWeight: "bold",
              color: "#b388ff",
              textShadow: "0 0 12px #b388ff",
              letterSpacing: 2
            }}>
              Ranking Global
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 3 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{
                  backgroundColor: "#b388ff",
                  color: "#0d0d1a",
                  borderRadius: 2,
                  fontWeight: "bold",
                  boxShadow: "0 0 10px #b388ff",
                  fontFamily: "Orbitron, sans-serif",
                  width: "250px",
                  margin: "0 auto",
                  "& .MuiSelect-icon": {
                    color: "#0d0d1a"
                  },
                  "& .MuiOutlinedInput-root": {
                    paddingRight: "8px",
                    backgroundColor: "#b388ff",
                    borderRadius: "8px",
                  }
                }}
              >
                <MenuItem value="correctAnswers">✅ Aciertos</MenuItem>
                <MenuItem value="wrongAnswers">❌ Fallos</MenuItem>
                <MenuItem value="gamesPlayed">🎮 Partidas Jugadas</MenuItem>
              </Select>
            </Box>
          </Box>

          <TableContainer component={Paper} sx={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            borderRadius: 3,
            maxHeight: 420,
            overflowY: "auto",
            overflowX: "hidden",
            boxShadow: "inset 0 0 12px rgba(179,136,255,0.2)",
            backdropFilter: "blur(8px)",
            scrollbarWidth: "thin",
            scrollbarColor: "#b388ff88 transparent",
            "&::-webkit-scrollbar": {
              width: "8px"
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#b388ff88",
              borderRadius: "8px",
              boxShadow: "inset 0 0 6px #b388ff"
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent"
            }
          }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {["#", "Jugador", "🎮 Partidas", "✅ Aciertos", "❌ Fallos", "⏳ Tiempo"].map((col, i) => (
                    <TableCell
                      key={i}
                      sx={{
                        backgroundColor: "rgba(25, 0, 50, 0.85)",
                        color: "#d1b3ff",
                        fontWeight: "bold",
                        textShadow: "0 0 6px #b388ff",
                        fontFamily: "Orbitron, sans-serif",
                        borderBottom: "1px solid rgba(179,136,255,0.2)",
                        textAlign: "center"
                      }}
                    >
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPlayers.map((player, index) => (
                  <TableRow
                    key={player.username}
                    hover
                    onClick={() => navigate(`/profile/${player.username}`)}
                    sx={{
                      backgroundColor: player.username === loggedInUser ? "#b388ff22" : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.3s, transform 0.2s",
                      "&:hover": {
                        backgroundColor: "#b388ff11",
                        transform: "scale(1.015)"
                      },
                      "& td": {
                        borderBottom: "1px solid rgba(255,255,255,0.05)"
                      }
                    }}
                  >
                    <TableCell sx={{ color: "#fff", textAlign: "center" }}>{indexOfFirstPlayer + index + 1}</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
                      {player.username}
                      {player.username === loggedInUser && <span style={{ marginLeft: 6 }}>🌟</span>}
                    </TableCell>
                    <TableCell sx={{ color: "#fff", textAlign: "center" }}>{player.gamesPlayed}</TableCell>
                    <TableCell sx={{ color: "#7fffda", textAlign: "center" }}>{player.correctAnswers}</TableCell>
                    <TableCell sx={{ color: "#ff6b6b", textAlign: "center" }}>{player.wrongAnswers}</TableCell>
                    <TableCell sx={{ color: "#fff", textAlign: "center" }}>{player.totalTimePlayed} seg</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Componente de Paginación */}
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="secondary"
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#fff",
                  fontFamily: "Orbitron, sans-serif",
                  "&.Mui-selected": {
                    backgroundColor: "#b388ff",
                  }
                }
              }}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
            <Button
              variant="contained"
              onClick={() => navigate("/startmenu")}
              sx={{
                backgroundColor: "#b388ff",
                color: "#0d0d1a",
                fontWeight: "bold",
                borderRadius: 3,
                px: 5,
                py: 1.7,
                fontSize: "1.1rem",
                fontFamily: "Orbitron, sans-serif",
                textTransform: "uppercase",
                boxShadow: "0 0 14px #b388ff",
                transition: "0.3s",
                "&:hover": {
                  backgroundColor: "#a76dff",
                  boxShadow: "0 0 20px #b388ff"
                }
              }}
            >
              Volver al menú
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Ranking;