import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Box, Paper } from '@mui/material';
import Globe from 'react-globe.gl';

// Constantes para configuración
const ARC_INTERVAL_MS = 2000; // Intervalo para añadir un nuevo arco (en milisegundos)
const MAX_ARCS = 5; // Número máximo de arcos visibles a la vez
const ARC_STROKE = 0.5; // Grosor del arco
const ARC_ANIMATION_SPEED = 3000; // Velocidad de la animación del trazo (más bajo = más rápido)

const Home = () => {
  const globeEl = useRef();
  const [globeWidth, setGlobeWidth] = useState(window.innerWidth);
  const [globeHeight, setGlobeHeight] = useState(window.innerHeight);
  const [arcsData, setArcsData] = useState([]); // Estado para los datos de los arcos

  // --- Efecto para generar arcos periódicamente ---
  useEffect(() => {
    const generateRandomArc = () => {
      // Genera latitudes y longitudes aleatorias para inicio y fin
      const startLat = (Math.random() - 0.5) * 180;
      const startLng = (Math.random() - 0.5) * 360;
      const endLat = (Math.random() - 0.5) * 180;
      const endLng = (Math.random() - 0.5) * 360;

      // Devuelve el objeto del arco
      return {
        startLat,
        startLng,
        endLat,
        endLng,
        // Color aleatorio o fijo (ej: un tono cyan/blanco)
        color: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, 255, 0.8)`,
      };
    };

    // Configura el intervalo para añadir arcos
    const interval = setInterval(() => {
      setArcsData(prevArcs => {
        const newArc = generateRandomArc();
        // Añade el nuevo arco y limita el total al MAX_ARCS, eliminando el más antiguo
        // .slice(-(MAX_ARCS - 1)) toma los últimos N-1 elementos
        const updatedArcs = [...prevArcs.slice(-(MAX_ARCS - 1)), newArc];
        return updatedArcs;
      });
    }, ARC_INTERVAL_MS); // Se ejecuta cada ARC_INTERVAL_MS milisegundos

    // Función de limpieza para detener el intervalo cuando el componente se desmonte
    return () => {
      clearInterval(interval);
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  // Ajustar tamaño del globo si la ventana cambia de tamaño
  useEffect(() => {
    const handleResize = () => {
      setGlobeWidth(window.innerWidth);
      setGlobeHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configurar la rotación automática del globo
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.enableZoom = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 2;
      controls.enablePan = false;
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;
    }
  }, []);

  return (
    <Box
      data-testid="home-container"
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000010',
      }}
    >
      {/* Globo terráqueo en el fondo */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        }}
      >
        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-day.jpg" // Textura de día
          atmosphereColor="rgba(60, 120, 255, 0.7)"
          atmosphereAltitude={0.25}
          width={globeWidth}
          height={globeHeight}

          // --- Props para los Arcos ---
          arcsData={arcsData}          // Datos de los arcos desde el estado
          arcColor="color"             // Usa la propiedad 'color' de cada objeto en arcsData
          arcDashLength={0.4}          // Longitud del segmento del trazo
          arcDashGap={0.1}             // Espacio entre segmentos
          arcDashAnimateTime={ARC_ANIMATION_SPEED} // Tiempo de animación del trazo
          arcStroke={ARC_STROKE}       // Grosor del arco
          // --------------------------
        />
      </Box>

      {/* Contenido principal superpuesto */}
      <Paper
        elevation={10}
        sx={{
          p: { xs: 3, sm: 5 },
          borderRadius: 4,
          textAlign: 'center',
          maxWidth: 500,
          width: '90%',
          bgcolor: 'rgba(20, 20, 40, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* ... (El contenido de Typography y Buttons sigue igual) ... */}
        <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 1 }}>
          World Capitals Quiz
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
          Test your geography knowledge!
        </Typography>
        <Box mt={3}>
          <Button
            fullWidth
            variant="contained"
            sx={{
              mb: 2,
              bgcolor: '#00bcd4',
              '&:hover': { bgcolor: '#00acc1' },
              fontWeight: 'bold',
              py: 1.5,
            }}
            component={Link}
            to="/login"
            data-testid="login-button"
          >
            Login
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{
              borderColor: '#00bcd4',
              color: '#00bcd4',
              '&:hover': {
                borderColor: 'white',
                color: 'white',
                bgcolor: 'rgba(0, 188, 212, 0.1)',
              },
              fontWeight: 'bold',
              py: 1.5,
            }}
            component={Link}
            to="/register"
            data-testid="register-button"
          >
            Register
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Home;