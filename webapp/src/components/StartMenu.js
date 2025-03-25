import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";

const StartMenu = () => {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();
  const storedUsername = localStorage.getItem("username");

  useEffect(() => {
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  const handleStartGame = () => navigate("/game");
  const handleOpenRanking = () => navigate("/ranking");
  const handleOpenProfile = () => {
    if (username) {
      navigate(`/profile/${storedUsername}`);
    } else {
      alert("No se ha iniciado sesión.");
    }
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        color: "#ffffff",
        textAlign: "center",
      }}
    >
      <Box sx={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleOpenRanking}
          sx={{
            backgroundColor: "#ff4081",
            color: "#fff",
            fontWeight: "bold",
            boxShadow: 3,
            '&:hover': { bgcolor: '#f50057' },
          }}
        >
          Ranking
        </Button>
        <Button
          variant="contained"
          onClick={handleOpenProfile}
          sx={{
            backgroundColor: "#ff4081",
            color: "#fff",
            fontWeight: "bold",
            boxShadow: 3,
            '&:hover': { bgcolor: '#f50057' },
          }}
        >
          Cuenta
        </Button>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Box
          component="img"
          src="https://cdn.pixabay.com/photo/2020/09/23/07/53/quiz-5595288_1280.jpg"
          alt="Imagen"
          sx={{
            maxWidth: 500,
            height: "auto",
            borderRadius: 3,
            boxShadow: 5,
          }}
        />

        <Card
          sx={{
            maxWidth: 500,
            height: "auto",
            p: 3,
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            boxShadow: 5,
            textAlign: "left",
          }}
        >
          <CardContent>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold", color: "#ff4081" }}>
              ¿Cómo jugar?
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "18px", fontWeight: "light" , color: "#ffffff" }}>
              Pon a prueba tu conocimiento! Pulsa 'Comenzar' y empieza el reto. Se te mostrará una imagen y 5 posibles
              respuestas. Cada pregunta debe ser respondida en un tiempo determinado. Se ofrece la posibilidad de obtener
              pistas mediante un chatbot.
            </Typography>
          </CardContent>
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: "#ff4081",
              color: "#fff",
              fontSize: "1.2rem",
              padding: "12px 24px",
              width: "100%",
              boxShadow: 3,
              fontWeight: "bold",
              '&:hover': { bgcolor: '#f50057' },
            }}
            onClick={handleStartGame}
          >
            Comenzar
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

export default StartMenu;
