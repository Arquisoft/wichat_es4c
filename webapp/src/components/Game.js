import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container, Typography, Box, Button, Grid, CssBaseline,
  Radio, RadioGroup, FormControlLabel, Paper, CircularProgress
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Countdown from 'react-countdown';
import LLMChat from "./LLMChat";

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
    button: {
      textTransform: 'none',
      fontWeight: 'bold',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)'
        }
      }
    }
  }
});

const Game = () => {
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState({});
  const [timerEndTime, setTimerEndTime] = useState(Date.now() + 10000);
  const [answered, setAnswered] = useState(false);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";

  useEffect(() => {
    fetchQuestion();
  }, []);

  const fetchQuestion = async () => {
    try {
      // Limpia el estado antes de hacer la solicitud
      setQuestionData(null);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);

      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setTimerEndTime(Date.now() + 10000);
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;
    const isCorrect = selectedAnswer === questionData.answer;

    setFeedback({
      ...feedback,
      [selectedAnswer]: isCorrect ? "✅" : "❌"
    });
    setAnswered(true);

    if (isCorrect) {
      setTimeout(() => {
        fetchQuestion();
      }, 1000); // Espera 1 segundo antes de cargar la siguiente pregunta
    }
  };

  const renderer = ({ minutes, seconds, completed }) => {
    if (completed) {
      setAnswered(true);
      return <Typography variant="h4" color="error">⏳ Tiempo agotado</Typography>;
    }
    return (
      <Typography variant="h4" color="secondary">
        {minutes}:{seconds < 10 ? '0' : ''}{seconds}
      </Typography>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Paper>
              {questionData ? (
                <>
                  {questionData.image && (
                    <Box display="flex" justifyContent="center" my={2}>
                      <img 
                        src={questionData.image} 
                        alt={
                          questionData.type === 'monument' ? 'Monumento' :
                          questionData.type === 'food' ? 'Comida típica' :
                          questionData.type === 'flag' ? 'Bandera' :
                          questionData.type === 'capital' ? 'Capital' :
                          `Imagen de ${questionData.question}`
                        } 
                        style={{ width: "100%", maxWidth: "450px", borderRadius: "8px" }}
                      />
                    </Box>
                  )}
                  <Typography variant="h6" gutterBottom>{questionData.question}</Typography>
                  <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
                    {questionData.choices.map((option, index) => (
                      <Box key={index} display='flex' alignItems='center'>
                        <FormControlLabel 
                          value={option} 
                          control={<Radio disabled={answered} />} 
                          label={option} 
                        />
                        {feedback[option] && (
                          <Typography variant="h6" sx={{ ml: 2, color: feedback[option] === "✅" ? "green" : "red" }}>
                            {feedback[option]}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </RadioGroup>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleAnswerSubmit} 
                    disabled={!selectedAnswer || answered}
                  >
                    Enviar Respuesta
                  </Button>
                </>
              ) : (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Typography variant="h5" gutterBottom>Tiempo restante:</Typography>
              <Countdown date={timerEndTime} renderer={renderer} />
            </Paper>
            
            <Paper sx={{ mt: 4, p: 3, textAlign: 'center' }}> {/* Se redujo el margen superior */}
              <LLMChat />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Game;