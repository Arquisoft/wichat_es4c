import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Container, Typography, Box, Button, Grid, CssBaseline, 
  Radio, RadioGroup, FormControlLabel 
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    primary: {
      main: '#BB86FC',
    },
    secondary: {
      main: '#03DAC6',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    h4: {
      fontWeight: 'bold',
    },
    h6: {
      fontSize: '1.2rem',
    },
  },
});

const Game = () => {
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState({});
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8004";

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setSelectedAnswer("");
      setFeedback({});
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  const handleAnswerSubmit = () => {
    setFeedback({
      ...feedback,
      [selectedAnswer]: selectedAnswer === questionData.answer ? "✅" : "❌"
    });
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
          {questionData ? (
            <Grid item xs={12} md={6}>
              {questionData.image && (
                <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
                  <img 
                    src={questionData.image} 
                    alt={`Bandera de ${questionData.question}`} 
                    style={{ width: "500px", height: "auto", borderRadius: "5px", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" }} 
                  />
                </Box>
              )}
              <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {questionData.question}
                </Typography>
                <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
                  {questionData.choices.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel value={option} control={<Radio />} label={option} />
                      {feedback[option] && (
                        <Typography variant="h6" sx={{ ml: 2, color: feedback[option] === "✅" ? "green" : "red" }}>
                          {feedback[option]}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </RadioGroup>
                <Button variant="contained" color="primary" onClick={handleAnswerSubmit} sx={{ marginTop: 2 }}>
                  Enviar Respuesta
                </Button>
                <Button variant="outlined" color="secondary" onClick={fetchQuestion} sx={{ marginTop: 2, marginLeft: 17 }}>
                  Siguiente Pregunta
                </Button>
              </Box>
            </Grid>
          ) : (
            <Typography variant="h6" align="center" sx={{ marginTop: 3 }}>
              Cargando pregunta...
            </Typography>
          )}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 3,
            }}>
              <Typography variant="h5" gutterBottom>
                Tiempo restante:
              </Typography>
              <Countdown date={Date.now() + 60000} renderer={renderer} />
            </Box>
            <Box sx={{
              mt: 4,
              p: 3,
              bgcolor: 'background.paper',
              borderRadius: 3,
              boxShadow: 3,
              textAlign: 'center',
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
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
