import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography, Menu, MenuItem } from "@mui/material";
import "../assets/css/StartMenu.css";
import WIChatLogo from "../assets/images/WIChat.png";


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
    setAnchorEl(event.currentTarget);
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
    localStorage.removeItem("username");
    setUsername(null);
    navigate("/");
  };

  return (
    <Box className="start-menu-container">
      {/* Contenido del menú */}
      <Box sx={{ position: "absolute", top: 20, right: 25, display: "flex", gap: 5 }}>
        <Button
          variant="contained"
          onClick={handleOpenRanking}
          sx={{
            backgroundColor: "#FF6584",
            color: "#fff",
            fontWeight: "bold",
            width: 130,
            boxShadow: 3,
            scale: 1.15,
            fontFamily: "Orbitron, sans-serif",
            "&:hover": { bgcolor: "#f50057" },
          }}
        >
          Ranking
        </Button>
        <Button
          variant="contained"
          onClick={handleOpenAccount}
          sx={{
            backgroundColor: "#FF6584",
            color: "#fff",
            fontWeight: "bold",
            width: 130,
            boxShadow: 3,
            scale: 1.15,
            borderRadius: 1,
            fontFamily: "Orbitron, sans-serif",
            "&:hover": { bgcolor: "#f50057" },
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
              boxShadow: 5,
              width: 150,
              borderRadius: 1,
              transformOrigin: 'top right',
            },
          }}
        >
          <MenuItem
            onClick={handleOpenProfile}
            sx={{
              backgroundColor: "#6a11cb",
              color: "#fff",
              fontFamily: "Orbitron, sans-serif",
              "&:hover": { backgroundColor: "#fff", color: "#6a11cb" },
            }}
          >
            Perfil
          </MenuItem>
          <MenuItem
            onClick={handleOpenSettings}
            sx={{
              backgroundColor: "#6a11cb",
              color: "#fff",
              fontFamily: "Orbitron, sans-serif",
              "&:hover": { backgroundColor: "#fff", color: "#6a11cb" },
            }}
          >
            Ajustes
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleLogout();
              handleClose();
            }}
            sx={{
              backgroundColor: "#6a11cb",
              color: "#fff",
              fontFamily: "Orbitron, sans-serif",
              "&:hover": { backgroundColor: "#fff", color: "#6a11cb" },
            }}
          >
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <Box
          component="img"
          src={WIChatLogo}
          alt="Imagen"
          sx={{
            maxWidth: 700,
            maxHeight: 500,
            height: "auto",
            borderRadius: 3,
            boxShadow: 5,
          }}
        />
        <Card
          className="start-card"
          sx={{
            margin: "0 auto",
            padding: "24px 24px 20px", 
            width: 540,
            minHeight: 500, 
            background: "#0C2D48",
            textAlign: "center",
            borderRadius: "10px",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between", 
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              border: "4px solid transparent",
              borderRadius: "10px",
              background: "linear-gradient(270deg, red, orange, yellow, green, blue, indigo, violet, red)",
              backgroundSize: "400% 400%",
              zIndex: -1,
              animation: "animatedBorder 8s linear infinite alternate",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "destination-out",
              padding: "4px",
            },
            "@keyframes animatedBorder": {
              "0%": { backgroundPosition: "0% 50%" },
              "100%": { backgroundPosition: "100% 50%" },
            },
          }}
        >

          <CardContent>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: "bold", color: "#FF6584", fontFamily: "Orbitron, sans-serif" }}>
              ¿CÓMO JUGAR?
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "20px", fontWeight: "bold", color: "#FED43F", fontFamily: "Orbitron, sans-serif", marginTop: 8 }}>
              Pon a prueba tu conocimiento! Pulsa 'Comenzar' y empieza el reto. Se te mostrará una imagen y 4 posibles
              respuestas. Cada pregunta debe ser respondida en un tiempo determinado. Se ofrece la posibilidad de obtener
              pistas mediante un chatbot.
            </Typography>
          </CardContent>
          <Button
            variant="contained"
            sx={{
              mt: 2,
              backgroundColor: "#FF6584",
              color: "#fff",
              fontSize: "1.2rem",
              padding: "12px 24px",
              width: "100%",
              boxShadow: 3,
              fontWeight: "bold",
              "&:hover": { bgcolor: "#f50057" },
              fontFamily: "Orbitron, sans-serif"
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
