import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography, Menu, MenuItem } from "@mui/material";

const StartMenu = () => {
  const [username, setUsername] = useState(null);
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
  

  const handleOpenAccount = (event) => {
    setAnchorEl(event.currentTarget); // Guarda la referencia del botón
  };
  const handleClose = () => setAnchorEl(null);
  const handleStartGame = () => navigate("/game");
  const handleOpenRanking = () => navigate("/ranking");
  const handleOpenProfile = () => {
    if (username) {
      navigate(`/profile/${username}`);
    } else {
      alert("No se ha iniciado sesión.");
    }
  };
  const handleOpenSettings = () => navigate(`/settings/${username}`);	
  const handleLogout = () => {
    localStorage.removeItem("username"); // Clear username from local storage
    setUsername(null); // Reset username state
    navigate("/"); // Redirect to the start menu or login page
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
        color: " #ffffff",
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
          onClick={handleOpenAccount}
          sx={{
            backgroundColor: " #ff4081",
            color: "#fff",
            fontWeight: "bold",
            boxShadow: 3,
            '&:hover': { bgcolor: ' #f50057' },
          }}
        >
          Cuenta
        </Button>
        <Menu 
          anchorEl={anchorEl} 
          open={Boolean(anchorEl)} 
          onClose={handleClose}
          sx={{
            "& .MuiMenu-paper": {
              backgroundColor: "#6a11cb",
              backdropFilter: "blur(10px)",
              boxShadow: 5,
            },
          }}>
          <MenuItem 
            onClick={handleOpenProfile}
            sx={{
              backgroundColor: ' #6a11cb',
              color: '#fff',
              "&:hover": { backgroundColor: "#fff", color: " #6a11cb" }
            }}
            >Perfil
          </MenuItem>
          <MenuItem 
            onClick={handleOpenSettings}
            sx={{
              backgroundColor: ' #6a11cb',
              color: '#fff',
              "&:hover": { backgroundColor: "#fff", color: " #6a11cb" }
            }}
            >Ajustes
          </MenuItem>
          <MenuItem 
            onClick={() => {
              handleLogout();
              handleClose();
            }}
            sx={{
              backgroundColor: ' #6a11cb',
              color: '#fff',
              "&:hover": { backgroundColor: "#fff", color: " #6a11cb" }
            }}
            >Cerrar Sesion
          </MenuItem>
      </Menu>
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
            background: " #6a11cb",
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
            data-testid="play-button"
          >
            Comenzar
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

export default StartMenu;
