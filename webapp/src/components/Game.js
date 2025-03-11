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
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [timerEndTime, setTimerEndTime] = useState(Date.now() + 10000);
  const [gameRegistered, setGameRegistered] = useState(false);
  const [answered, setAnswered] = useState(false);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8004";

  useEffect(() => {
    registerGame(); 
    fetchQuestion();
  }, []);



  const registerGame = async () => {
    if (gameRegistered) return; 
    const loggedInUser = localStorage.getItem("username");
    if (!loggedInUser) return;
    try {
      await axios.post("http://localhost:8001/incrementGamesPlayed", { username: loggedInUser });
      setGameRegistered(true); 
    } catch (error) {
      console.error("Error al registrar la partida:", error);
    }
  };

  const fetchQuestion = async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);
      
      setTimerEndTime(Date.now() + 10000);
    } catch (error) {
      console.error("Error fetching question:", error);
    }
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) return;
    const loggedInUser = localStorage.getItem("username");
    const isCorrect = selectedAnswer === questionData.answer;
  
    setFeedback({
      ...feedback,
      [selectedAnswer]: isCorrect ? "✅" : "❌"
    });
    setAnswered(true);
  
    // Si la respuesta es incorrecta, ponemos el contador a 0
    if (!isCorrect) {
      setTimeRemaining(0);
    }
  
    try {
      await axios.post("http://localhost:8001/updateStats", {
        username: loggedInUser,
        isCorrect,
        timeTaken: 10 - timeRemaining
      });
    } catch (error) {
      console.error("Error al actualizar estadísticas:", error);
    }
  
    // Si la respuesta es correcta, cargamos la siguiente pregunta
    if (isCorrect) {
      fetchQuestion();
    }
  };


  const handleTick = ({ total }) => {
    if (timeRemaining === 0) {

    }else {
      setTimeRemaining(Math.ceil(total / 1000));
    }
  };

  const renderer = ({ minutes, seconds, completed }) => {
    if (completed || timeRemaining === 0) {
      setAnswered(true);
      return <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>⏳ Tiempo agotado</Typography>;
    } else {
      return (
        <Typography variant="h4" color="secondary" sx={{ fontWeight: 'bold' }}>
          {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </Typography>
      );
    }
  };

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
                    alt={`Imagen de ${questionData.question}`} 
                    style={{ width: "500px", height: "auto", borderRadius: "5px", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" }} 
                  />
                </Box>
              )}
              <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {questionData.question}
                </Typography>
                <RadioGroup
                  value={selectedAnswer}
                  onChange={(e) => !answered && setSelectedAnswer(e.target.value)}
                >
                  {questionData.choices.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel value={option} control={<Radio disabled={answered} />} label={option} />
                      {feedback[option] && (
                        <Typography variant="h6" sx={{ ml: 2, color: feedback[option] === "✅" ? "green" : "red" }}>
                          {feedback[option]}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </RadioGroup>
                <Button variant="contained" color="primary" onClick={handleAnswerSubmit} sx={{ marginTop: 2 }} disabled={!selectedAnswer || answered}>
                  Enviar Respuesta
                </Button>
              </Box>
            </Grid>
          ) : (
            <Typography variant="h6" align="center" sx={{ marginTop: 3 }}>
              Cargando pregunta...
            </Typography>
          )}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom>
                Tiempo restante:
              </Typography>
              <Countdown date={timerEndTime} renderer={renderer} onTick={handleTick} />
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
            }}></Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Game;
