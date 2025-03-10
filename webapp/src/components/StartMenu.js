import React, { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography, Menu, MenuItem } from "@mui/material";

const StartMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [username, setUsername] = useState(null);
  const navigate = useNavigate(); // Hook para redirigir
  const storedUsername = localStorage.getItem("username");

  useEffect(() => {
    
    if (storedUsername) {
      console.log(`Username stored: ${storedUsername}`);
      
      setUsername(storedUsername);
    }
  }, []);


  const handleOpenRanking = () => {
    navigate("/ranking"); 
  };
  
  // Controla la apertura del menú
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Controla el cierre del menú
  const handleClose = () => {
    setAnchorEl(null);
  };

  // Redirige a la página del juego
  const handleStartGame = () => {
    navigate("/game");
  };

  const handleOpenProfile = () => {
    if (username) {
      console.log(`Intentando abrir perfil de usuario: ${storedUsername}`);
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
        backgroundColor: "#212121", // Fondo gris oscuro
        color: "#00FFFF", // Texto en cian
      }}
    >
      {/* Botones superiores */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Button
          variant="contained"
          onClick={handleOpenRanking}
          sx={{ mr: 1, backgroundColor: "#00FFFF", color: "#212121" }}
        >
          Ranking
        </Button>

        {/* Botón de cuenta */}
        
        <Button
          variant="contained"
          onClick={handleOpenProfile}
          sx={{ mr: 1, backgroundColor: "#00FFFF", color: "#212121" }}
        >
  
          Cuenta
        </Button>
      </Box>

      {/* Contenido principal */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "80%",
        }}
      >
        {/* Imagen */}
        <Box
          component="img"
          src="https://cdn.pixabay.com/photo/2020/09/23/07/53/quiz-5595288_1280.jpg"
          alt="Imagen"
          sx={{
            maxWidth: 500,
            height: "auto",
            mr: 4,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between", // Espaciado entre elemento
          }}
        />

        {/* Tarjeta de instrucciones */}
        <Card
          sx={{
            maxWidth: 500,
            height: 300,
            p: 2,
            backgroundColor: "#333", // Gris oscuro para la tarjeta
            color: "#00FFFF", // Texto en cian
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography variant="h3" gutterBottom>
              ¿Cómo jugar?
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: "18px",
                fontFamily: "Circular, Manrope, sans-serif",
                fontWeight: "light",
              }}
              gutterBottom
            >
              Pon a prueba tu conocimiento! Pulsa 'Comenzar' y empieza el reto.
              Se te mostrará una imagen y 5 posibles respuestas. Cada pregunta
              debe ser respondida en un tiempo determinado. Se ofrece la
              posibilidad de obtener pistas mediante un chatbot.
            </Typography>
          </CardContent>
          <Button
            variant="contained"
            sx={{
              mt: 0.75,
              backgroundColor: "#00FFFF",
              color: "#212121",
              fontSize: "1.2rem", // Texto más grande
              padding: "12px 24px", // Botón más grande
              width: "100%", // Ancho completo
              display: "flex",
              alignSelf: "center",
            }}
            onClick={handleStartGame} // Agrega la función aquí
          >
            Comenzar
          </Button>
        </Card>
      </Box>
    </Box>
  );
};

export default StartMenu;