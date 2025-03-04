import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Box, Button, Grid, CssBaseline, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#121212', paper: '#1E1E1E' },
    primary: { main: '#BB86FC' },
    secondary: { main: '#03DAC6' },
    text: { primary: '#FFFFFF', secondary: '#B0B0B0' },
  },
  typography: {
    h4: { fontWeight: 'bold' },
    h6: { fontSize: '1.2rem' },
  },
});

const Game = () => {
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8004";

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setSelectedAnswer("");
      setFeedback("");
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === questionData?.answer) {
      setFeedback("Correcto 🎉");
    } else {
      setFeedback("Incorrecto ❌");
    }
  };

  const renderer = ({ minutes, seconds }) => (
    <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
      {minutes}:{seconds < 10 ? '0' : ''}{seconds}
    </Typography>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4} alignItems="stretch" sx={{ height: '100vh' }}>
          <Grid item xs={12} md={6}>
            {questionData?.image && (
              <Box component="img" src={questionData.image} alt="Imagen de la pregunta"
                sx={{ width: '100%', borderRadius: 3, boxShadow: 3 }}
              />
            )}
            <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" gutterBottom>
                {questionData ? questionData.question : "Cargando pregunta..."}
              </Typography>
              <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
                {questionData?.choices?.map((option, index) => (
                  <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
                ))}
              </RadioGroup>
              <Button variant="contained" color="primary" onClick={handleAnswerSubmit} sx={{ mt: 2 }}>
                Enviar Respuesta
              </Button>
              {feedback && (
                <Typography variant="h6" sx={{ mt: 2, color: feedback.includes("Correcto") ? "green" : "red" }}>
                  {feedback}
                </Typography>
              )}
              <Button variant="outlined" color="secondary" onClick={fetchQuestion} sx={{ mt: 2 }}>
                Siguiente Pregunta
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom>
                Tiempo restante:
              </Typography>
              <Countdown date={Date.now() + 60000} renderer={renderer} />
            </Box>
            <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3, textAlign: 'center', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Espacio para componente futuro
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Game;