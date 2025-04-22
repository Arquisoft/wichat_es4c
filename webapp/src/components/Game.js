import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Button, Grid,
 RadioGroup, Paper, CircularProgress, Snackbar, Alert
} from '@mui/material';
import Countdown from 'react-countdown';
import LLMChat from "./LLMChat";
import { Howl } from 'howler';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';
import mapBg from '../assets/images/world-bg.png';

const Game = () => {
  const navigate = useNavigate();
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState({});
  const [timerEndTime, setTimerEndTime] = useState(Date.now() + 10000);
  const [answered, setAnswered] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [questionCounter, setQuestionCounter] = useState(0); // Contador de preguntas
  const startTime = useRef(Date.now());
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const username = localStorage.getItem("username");
  const hasFetched = useRef(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); 
  const correctSound = new Howl({ src: [correctSoundFile] });
  const wrongSound = new Howl({ src: [wrongSoundFile] });

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const playSound = (sound) => {
    if (soundEnabled) {
      sound.play();
    }
  };


  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const newGame = useCallback(async () => {
    try {
      if (username) {
        await axios.post(`${apiEndpoint}/incrementGamesPlayed`, { username });
      }
    } catch (error) {
      console.error("Error incrementing game:", error);
    }
  }, [username, apiEndpoint]);


  const fetchQuestion = useCallback(async () => {
    if (loadingQuestion) return;

    setLoadingQuestion(true);

    try {
      setQuestionData(null);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);
      startTime.current = Date.now();

      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoadingQuestion(false);
    }
  }, [loadingQuestion, apiEndpoint, settings.answerTime]);

  // useEffect para inicializar el juego
  useEffect(() => {
    if (!hasFetched.current && settings.answerTime) {
      newGame();
      fetchQuestion();
      hasFetched.current = true;
    }
  }, [newGame, fetchQuestion, settings.answerTime]);


  useEffect(() => {
    if (!username) {
      navigate("/startmenu");
      return;
    }

    const fetchUserSettings = async () => {
      try {
        const response = await fetch(`http://localhost:8001/getSettings/${username}`);
        if (!response.ok) {
          throw new Error("No se pudo obtener la información del perfil");
        }
        const data = await response.json();
        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSettings();
}, [username, navigate]);


useEffect(() => {
  if (user) {
    setSettings({
      answerTime: user.answerTime || 10, // Valores por defecto en caso de undefined
      questionAmount: user.questionAmount || 10, // Aquí se define el número de preguntas
      capitalQuestions: user.capitalQuestions ?? true,
      flagQuestions: user.flagQuestions ?? true,
      monumentQuestions: user.monumentQuestions ?? true,
      foodQuestions: user.foodQuestions ?? true,
    });
  }
}, [user]);

useEffect(() => {
  if (settings.answerTime) {
    setTimerEndTime(Date.now() + settings.answerTime * 1000);
  }
}, [settings.answerTime]);

  useEffect(() => {
    setPaused(loadingQuestion);
  }, [loadingQuestion]);


  const handleAnswer = async (answer) => {
    if (!answer || loadingQuestion) return;

  
    const isCorrect = answer === questionData.answer;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
  
    setFeedback({
      ...feedback,
      [answer]: isCorrect ? "✅" : "❌"
    });
  
    setAnswered(true);
    setPaused(true);
  
    // Reproducir sonido según la respuesta
    if (isCorrect) {
      playSound(correctSound);
    } else {
      playSound(wrongSound);
    }
  
    setTimerEndTime(Date.now() + settings.answerTime * 1000); // Reiniciar el temporizador
  
    if (username) {
      try {
        await axios.post(`${apiEndpoint}/updateStats`, {
          username,
          isCorrect,
          timeTaken
        });
      } catch (error) {
        console.error("Error al actualizar estadísticas:", error);
      }
    }
  
    setTimeout(() => {
      setPaused(false);
      setQuestionCounter((prev) => prev + 1); // Incrementar el contador de preguntas
  
      if (questionCounter + 1 >= settings.questionAmount) {
        setSnackbarOpen(true); // Mostrar Snackbar
        setTimeout(() => navigate("/startmenu"), 3000); // Redirigir al menú principal después de 3 segundos
      } else {
        fetchQuestion();
      }
    }, 1000);
  };
  

  const renderer = ({ seconds, completed }) => {
    if (paused) {
        return (
            <Typography variant="h4" color="textSecondary">
                Pausado...
            </Typography>
        );
    }

    if (completed) {
        // Avoid calling setState during rendering
        setTimeout(() => {
            setSnackbarOpen(true);
            navigate("/startmenu");
        }, 0);

        return (
            <Typography variant="h4" color="#fff">
                ⏳ Tiempo agotado
            </Typography>
        );
    }

    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress
                variant="determinate"
                value={(seconds / settings.answerTime) * 100}
                size={80}
                thickness={4}
                sx={{ color: seconds < 3 ? "red" : "#ff4081" }}
            />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
                    {seconds}s
                </Typography>
            </Box>
        </Box>
    );
  };

  return (
    <>
      <Box
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `url(${mapBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#0C2D48",
                  backdropFilter: "blur(10px)",
                  boxShadow: 5,
                  color: "#fff",
                }}
              >
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
                          style={{ width: "100%", maxWidth: "450px", maxHeight: "300px" ,borderRadius: "8px", fontFamily: "Orbitron, sans-serif" }}
                        />
                      </Box>
                    )}
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {questionData.question}
                    </Typography>
                    <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
                    {questionData.choices.map((option, index) => (
                      <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
                        <Button
                          variant="contained"
                          color={answered ? (option === questionData.answer ? "success" : "error") : "primary"}
                          fullWidth
                          onClick={() => handleAnswer(option)}
                          disabled={answered} // Deshabilitar los botones después de responder
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            backgroundColor: "#FF6584", 
                            color: "#fff", 
                            fontFamily: "Orbitron, sans-serif",
                            "&:hover": {
                              backgroundColor: "#e91e63",
                            },
                          }}
                        >
                          {option}
                        </Button>
                        {feedback[option] && (
                          <Typography
                            variant="h6"
                            sx={{
                              ml: 2,
                              color: feedback[option] === "✅" ? "green" : "red",
                            }}
                          >
                            {feedback[option]}
                          </Typography>
                        )}
                      </Box>
                    ))}

                    {answered && selectedAnswer !== questionData.answer && (
                      <Typography
                        variant="h6"
                        sx={{ mt: 2, color: "#fff", textAlign: "center", fontFamily: "Orbitron, sans-serif", }}
                      >
                        La respuesta correcta era: {questionData.answer} ✅
                      </Typography>
                    )}
                    </RadioGroup>
                  </>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                    <CircularProgress />
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "#0C2D48",
                  backdropFilter: "blur(10px)",
                  boxShadow: 5,
                  textAlign: "center",
                  alignSelf: "center",
                  width: "50%",
                }}
              >
                <Typography variant="h5" gutterBottom color="#fff" sx={{fontFamily: "Orbitron, sans-serif",}}>Tiempo restante:</Typography>
                <Countdown
                sx={{ fontFamily: "Orbitron, sans-serif"}}
                  date={timerEndTime}
                  renderer={renderer}
                  autoStart={!paused}
                  onComplete={() => {
                      if (!answered) {
                          setAnswered(true); 
                      }
                  }}
                />
              </Paper>
              
              <Paper
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: 3,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                  boxShadow: 5,
                  textAlign: "center",
                }}
              >
                {questionData && questionData.answer && <LLMChat correctAnswer={questionData.answer} />}
              </Paper>
            </Grid>
          </Grid>
        </Container>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
          }}
        >
          <Button
            variant="contained"
            color={soundEnabled ? "success" : "error"}
            onClick={toggleSound}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontFamily: "Orbitron, sans-serif",
              backgroundColor: soundEnabled ? "#4caf50" : "#f44336",
              color: "#fff",
              "&:hover": {
                backgroundColor: soundEnabled ? "#388e3c" : "#d32f2f",
              },
            }}
          >
            {soundEnabled ? "🔊 Sonido Activado" : "🔇 Sonido Desactivado"}
          </Button>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="info" sx={{ width: '100%', fontFamily: "Orbitron, sans-serif", }}>
          {answered ? "¡Fin del juego! Volviendo al menú principal..." : "⏳ Tiempo agotado. Volviendo al menú principal..."}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Game;