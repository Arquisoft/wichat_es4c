import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { Box } from '@mui/material'; // Importamos Box desde MUI

// Constantes para configuración del globo (pueden quedarse aquí o ir a un archivo de constantes global si se usan en más sitios)
const ARC_INTERVAL_MS = 2000;
const MAX_ARCS = 5;
const ARC_STROKE = 0.5;
const ARC_ANIMATION_SPEED = 3000;

const GlobeBackground = () => {
  const globeEl = useRef();
  const [globeWidth, setGlobeWidth] = useState(window.innerWidth);
  const [globeHeight, setGlobeHeight] = useState(window.innerHeight);
  const [arcsData, setArcsData] = useState([]);

  // Efecto para generar arcos aleatorios
  useEffect(() => {
    const generateRandomArc = () => {
      const startLat = (Math.random() - 0.5) * 180;
      const startLng = (Math.random() - 0.5) * 360;
      const endLat = (Math.random() - 0.5) * 180;
      const endLng = (Math.random() - 0.5) * 360;
      return {
        startLat,
        startLng,
        endLat,
        endLng,
        color: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, 255, 0.8)`,
      };
    };

    const interval = setInterval(() => {
      setArcsData(prevArcs => [...prevArcs.slice(-(MAX_ARCS - 1)), generateRandomArc()]);
    }, ARC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Efecto para manejar el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      setGlobeWidth(window.innerWidth);
      setGlobeHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efecto para configurar los controles del globo
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

  // El componente sólo renderiza la caja con el globo posicionado absolutamente
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0, // Asegura que esté detrás del formulario
      }}
    >
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        atmosphereColor="rgba(60, 120, 255, 0.5)"
        atmosphereAltitude={0.15}
        width={globeWidth}
        height={globeHeight}
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.3}
        arcDashGap={0.15}
        arcDashAnimateTime={ARC_ANIMATION_SPEED}
        arcStroke={() => ARC_STROKE}
      />
    </Box>
  );
};

export default GlobeBackground;