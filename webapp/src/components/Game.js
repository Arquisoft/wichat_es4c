import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  CssBaseline,
  RadioGroup,
  Paper,
  CircularProgress
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Countdown from "react-countdown";
import LLMChat from "./LLMChat";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#121212", paper: "#1E1E1E" },
    primary: { main: "#BB86FC" },
    secondary: { main: "#03DAC6" },
    text: { primary: "#FFFFFF", secondary: "#B0B0B0" }
  },
  typography: {
    h4: { fontWeight: "bold" },
    h6: { fontSize: "1.2rem" },
    button: { textTransform: "none", fontWeight: "bold" }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.3)"
        }
      }
    }
  }
});

const Game = () => {
  // Estados para la pregunta actual y retroalimentación
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState({});
  const [timerEndTime, setTimerEndTime] = useState(Date.now() + 10000);
  const [answered, setAnswered] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [paused, setPaused] = useState(false);

  // Estados para acumular estadísticas de la partida
  const [gameStats, setGameStats] = useState({ correct: 0, wrong: 0, time: 0 });
  const [questionCount, setQuestionCount] = useState(0);
  const maxQuestions = 10;
  const [gameFinished, setGameFinished] = useState(false);

  const startTime = useRef(Date.now());
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const username = localStorage.getItem("username");
  const hasFetched = useRef(false);

  // Inicia un nuevo juego: incrementa partidas jugadas y reinicia estadísticas locales
  const newGame = useCallback(async () => {
    try {
      if (username) {
        await axios.post(`${apiEndpoint}/incrementGamesPlayed`, { username });
      }
      setGameStats({ correct: 0, wrong: 0, time: 0 });
      setQuestionCount(0);
      setGameFinished(false);
      fetchQuestion();
    } catch (error) {
      console.error("Error al iniciar el juego:", error);
    }
  }, [username, apiEndpoint]);

  // Obtiene la siguiente pregunta (si el juego no terminó)
  const fetchQuestion = useCallback(async () => {
    if (loadingQuestion || gameFinished) return;
    setLoadingQuestion(true);
    try {
      setQuestionData(null);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);
      startTime.current = Date.now();
      const response = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(response.data);
      setTimerEndTime(Date.now() + 10000);
    } catch (error) {
      console.error("Error al obtener la pregunta:", error);
    } finally {
      setLoadingQuestion(false);
    }
  }, [loadingQuestion, apiEndpoint, gameFinished]);

  useEffect(() => {
    if (!hasFetched.current) {
      newGame();
      hasFetched.current = true;
    }
  }, [newGame]);

  useEffect(() => {
    setPaused(loadingQuestion);
  }, [loadingQuestion]);

  // Maneja la respuesta del usuario: acumula estadísticas locales y decide si sigue con otra pregunta o finaliza el juego
  const handleAnswer = (answer) => {
    if (!answer || loadingQuestion || answered) return;
    const isCorrect = answer === questionData.answer;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

    setFeedback({
      ...feedback,
      [answer]: isCorrect ? "✅" : "❌"
    });
    setAnswered(true);

    // Actualiza las estadísticas locales de la partida
    setGameStats((prevStats) => ({
      correct: prevStats.correct + (isCorrect ? 1 : 0),
      wrong: prevStats.wrong + (!isCorrect ? 1 : 0),
      time: prevStats.time + timeTaken
    }));

    // Incrementa el contador de preguntas y determina si finaliza el juego
    setQuestionCount((prevCount) => {
      const newCount = prevCount + 1;
      if (newCount >= maxQuestions) {
        // Finaliza el juego después de mostrar el feedback por un segundo
        setTimeout(() => finishGame(), 1000);
      } else {
        // Continúa con la siguiente pregunta
        setTimeout(() => {
          fetchQuestion();
        }, 1000);
      }
      return newCount;
    });
  };

  // Envía las estadísticas acumuladas al servidor una sola vez al finalizar la partida
  const finishGame = async () => {
    setGameFinished(true);
    try {
      await axios.post(`${apiEndpoint}/updateStats`, {
        username,
        correct: gameStats.correct,
        wrong: gameStats.wrong,
        timeTaken: gameStats.time
      });
      console.log("Juego finalizado y estadísticas enviadas.");
    } catch (error) {
      console.error("Error al enviar las estadísticas del juego:", error);
    }
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
      return (
        <Typography variant="h4" color="error">
          ⏳ Tiempo agotado
        </Typography>
      );
    }
    return (
      <Box position="relative" display="inline-flex">
        <CircularProgress
          variant="determinate"
          value={(seconds / 10) * 100}
          size={80}
          thickness={4}
          sx={{ color: seconds < 3 ? "red" : "secondary.main" }}
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
          <Typography variant="h6" color="textSecondary">
            {seconds}s
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4} alignItems="stretch">
          <Grid item xs={12} md={6}>
            <Paper>
              {!gameFinished && questionData ? (
                <>
                  {questionData.image && (
                    <Box display="flex" justifyContent="center" my={2}>
                      <img
                        src={questionData.image}
                        alt={
                          questionData.type === "monument"
                            ? "Monumento"
                            : questionData.type === "food"
                            ? "Comida típica"
                            : questionData.type === "flag"
                            ? "Bandera"
                            : questionData.type === "capital"
                            ? "Capital"
                            : `Imagen de ${questionData.question}`
                        }
                        style={{
                          width: "100%",
                          maxWidth: "450px",
                          borderRadius: "8px"
                        }}
                      />
                    </Box>
                  )}
                  <Typography variant="h6" gutterBottom>
                    {questionData.question}
                  </Typography>
                  <RadioGroup
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  >
                    {questionData.choices.map((option, index) => (
                      <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Button
                          variant="contained"
                          color={
                            answered
                              ? option === questionData.answer
                                ? "success"
                                : "error"
                              : "primary"
                          }
                          fullWidth
                          onClick={() => handleAnswer(option)}
                          disabled={answered}
                          sx={{
                            textTransform: "none",
                            fontWeight: "bold",
                            backgroundColor: answered
                              ? option === questionData.answer
                                ? "green"
                                : option === selectedAnswer
                                ? "red"
                                : "primary.main"
                              : "primary.main",
                            "&:hover": {
                              backgroundColor: answered
                                ? option === questionData.answer
                                  ? "green"
                                  : option === selectedAnswer
                                  ? "red"
                                  : "primary.dark"
                                : "primary.dark"
                            }
                          }}
                        >
                          {option}
                        </Button>
                        {feedback[option] && (
                          <Typography
                            variant="h6"
                            sx={{
                              ml: 2,
                              color: feedback[option] === "✅" ? "green" : "red"
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
                        sx={{ mt: 2, color: "green", textAlign: "center" }}
                      >
                        La respuesta correcta era: {questionData.answer} ✅
                      </Typography>
                    )}
                  </RadioGroup>
                </>
              ) : gameFinished ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  height="300px"
                >
                  <Typography variant="h4" gutterBottom>
                    Juego Finalizado
                  </Typography>
                  <Typography variant="h6">
                    Aciertos: {gameStats.correct}
                  </Typography>
                  <Typography variant="h6">
                    Fallos: {gameStats.wrong}
                  </Typography>
                  <Typography variant="h6">
                    Tiempo total: {gameStats.time} segundos
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={newGame}
                    sx={{ mt: 3 }}
                  >
                    Nuevo Juego
                  </Button>
                </Box>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="200px"
                >
                  <CircularProgress />
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column" }}>
            <Paper
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 3
              }}
            >
              <Typography variant="h5" gutterBottom>
                Tiempo restante:
              </Typography>
              <Countdown
                date={timerEndTime}
                renderer={renderer}
                autoStart={!paused}
                onComplete={() => {
                  if (!answered) {
                    setAnswered(true);
                    // Si el tiempo se agota, tratamos la respuesta como incorrecta
                    handleAnswer("");
                  }
                }}
              />
            </Paper>
            <Paper sx={{ mt: 4, p: 3, textAlign: "center" }}>
              {questionData && questionData.answer && (
                <LLMChat correctAnswer={questionData.answer} />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default Game;
