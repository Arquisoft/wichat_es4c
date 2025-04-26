import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Button, Grid,
  RadioGroup, Paper, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import Countdown from 'react-countdown';
import LLMChat from "./LLMChat";
import { Howl } from 'howler';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';
import backgroundMusicFile from '../assets/sounds/backgroundMusic.mp3';
import mapBg from '../assets/images/world-bg.png';

const backgroundMusic = new Howl({
  src: [backgroundMusicFile],
  loop: true,
  volume: 0.1,
});

const Game = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const params    = new URLSearchParams(location.search);
  const isDuel    = params.get("duel") === "true";
  const player1   = params.get("player1");
  const player2   = params.get("player2");
  const opponent  = isDuel
    ? (localStorage.getItem("username") === player1 ? player2 : player1)
    : "";

  const [duelStats, setDuelStats]             = useState(null);
  const [questionData, setQuestionData]       = useState(null);
  const [selectedAnswer, setSelectedAnswer]   = useState("");
  const [feedback, setFeedback]               = useState({});
  const [timerEndTime, setTimerEndTime]       = useState(Date.now() + 10000);
  const [answered, setAnswered]               = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [paused, setPaused]                   = useState(false);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [correctCount, setCorrectCount]       = useState(0);
  const [wrongCount, setWrongCount]           = useState(0);
  const [totalTime, setTotalTime]             = useState(0);
  const [showSummaryModal, setShowSummaryModal]     = useState(false);
  const [resultDialogOpen, setResultDialogOpen]     = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [snackbarOpen, setSnackbarOpen]             = useState(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [soundEnabled, setSoundEnabled]             = useState(true);

  const startTime   = useRef(Date.now());
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const username    = localStorage.getItem("username");
  const hasFetched  = useRef(false);
  const [user, setUser]         = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const correctSound = new Howl({ src: [correctSoundFile], volume: 0.2 });
  const wrongSound   = new Howl({ src: [wrongSoundFile],   volume: 0.2 });

  // Pause when summary, duel result, or waiting
  useEffect(() => {
    setPaused(showSummaryModal || resultDialogOpen || waitingForOpponent);
  }, [showSummaryModal, resultDialogOpen, waitingForOpponent]);

  // Background music
  useEffect(() => {
    if (soundEnabled) backgroundMusic.play();
    else              backgroundMusic.pause();
    return () => backgroundMusic.stop();
  }, [soundEnabled]);

  const toggleSound = () => setSoundEnabled(prev => !prev);
  const playSound   = sound => { if (soundEnabled) sound.play(); };
  const handleSnackbarClose       = () => setSnackbarOpen(false);
  const handleOpenConfirmationModal  = () => setOpenConfirmationModal(true);
  const handleCloseConfirmationModal = () => setOpenConfirmationModal(false);
  const handleConfirmExit = () => {
    backgroundMusic.stop();
    setPaused(true);
    navigate("/startmenu");
  };

  const newGame = useCallback(async () => {
    try {
      if (username) await axios.post(`${apiEndpoint}/incrementGamesPlayed`, { username });
    } catch (err) {
      console.error("Error incrementing game:", err);
    }
  }, [username, apiEndpoint]);

  const fetchQuestion = useCallback(async () => {
    if (loadingQuestion) return;
    setLoadingQuestion(true);
    try {
      startTime.current = Date.now();
      setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
      setQuestionData(null);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);

      const res = await axios.get(`${apiEndpoint}/question`, {
      params: {
        capital: settings.capitalQuestions?.toString() ?? 'true',
        flag: settings.flagQuestions?.toString() ?? 'true',
        monument: settings.monumentQuestions?.toString() ?? 'true',
        food: settings.foodQuestions?.toString() ?? 'true',
      }
      });
      setQuestionData(res.data);
    } catch (err) {
      console.error("Error fetching question:", err);
    } finally {
      setLoadingQuestion(false);
    }
  }, [
    loadingQuestion,
    apiEndpoint,
    settings.capitalQuestions,
    settings.flagQuestions,
    settings.monumentQuestions,
    settings.foodQuestions
  ]);

  useEffect(() => {
    if (settings.answerTime && !hasFetched.current) {
      newGame();
      fetchQuestion();
      hasFetched.current = true;
    }
  }, [settings.answerTime, newGame, fetchQuestion]);

  useEffect(() => {
    if (!username) { handleConfirmExit(); return; }
    (async () => {
      try {
        const resp = await fetch(`http://localhost:8001/getSettings/${username}`);
        if (!resp.ok) throw new Error("Failed to fetch settings");
        const data = await resp.json();
        setUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!user) return;
    setSettings({
      answerTime:      user.answerTime   || 10,
      questionAmount:  user.questionAmount || 10,
      capitalQuestions:  user.capitalQuestions  ?? true,
      flagQuestions:     user.flagQuestions     ?? true,
      monumentQuestions: user.monumentQuestions ?? true,
      foodQuestions:     user.foodQuestions     ?? true,
    });
  }, [user]);

  const handleAnswer = async answer => {
    if (!answer || loadingQuestion || answered) return;
    const isCorrect = answer === questionData.answer;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

    setFeedback(f => ({ ...f, [answer]: isCorrect ? "✅" : "❌" }));
    setAnswered(true);
    playSound(isCorrect ? correctSound : wrongSound);
    setCorrectCount(c => c + (isCorrect ? 1 : 0));
    setWrongCount(w => w + (isCorrect ? 0 : 1));
    setTotalTime(t => t + timeTaken);

    setTimeout(async () => {
      const next = questionCounter + 1;
      setQuestionCounter(next);

      if (next >= settings.questionAmount) {
        if (isDuel) {
          const payload = {
            username,
            opponent,
            correct: correctCount + (isCorrect ? 1 : 0),
            time: totalTime + timeTaken
          };
          try {
            await axios.post(`${apiEndpoint}/submitDuelResult`, payload);
          } catch (err) {
            console.error("Error submitDuelResult:", err);
          }
          setWaitingForOpponent(true);
          const interval = setInterval(async () => {
            try {
              const { data } = await axios.post(
                `${apiEndpoint}/checkDuelResult`,
                { username, opponent }
              );
              if (data.status === "done") {
                clearInterval(interval);
                setWaitingForOpponent(false);
                setDuelStats(data);
                setResultDialogOpen(true);
              }
            } catch (err) {
              console.error("Polling error:", err);
            }
          }, 2000);
        } else {
          const finalCorrect   = correctCount + (isCorrect  ? 1 : 0);
          const finalWrong     = wrongCount   + (isCorrect  ? 0 : 1);
          const finalTimeTaken = totalTime    + timeTaken;
          try {
            await axios.post(`${apiEndpoint}/updateStats`, {
              username,
              correct:   finalCorrect,
              wrong:     finalWrong,
              timeTaken: finalTimeTaken
            });
          } catch (err) {
            console.error("Error updateStats:", err);
          }
          setShowSummaryModal(true);
        }
      } else {
        fetchQuestion();
      }
      setAnswered(false);
    }, 1000);
  };

  const renderer = ({ seconds, completed }) => {
    if (paused) {
      return <Typography variant="h4" color="textSecondary">Pausado...</Typography>;
    }
    if (completed) {
      if (!isDuel) setShowSummaryModal(true);
      else setWrongCount(w => w + 1);
      return <Typography variant="h4" color="#fff">⏳ Tiempo agotado</Typography>;
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
        <Box position="absolute" top={0} left={0} bottom={0} right={0}
             display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
            {seconds}s
          </Typography>
        </Box>
      </Box>
    );
  };



  const handlePlayAgain = () => {

    setCorrectCount(0);
    setWrongCount(0);
    setTotalTime(0);
    setQuestionCounter(0);
    setShowSummaryModal(false);
    setAnswered(false);             
    setPaused(false);               
    setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000); 

    fetchQuestion();
  };

  return (
    <>
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: `url(${mapBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      {/* Header */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
          {isDuel ? `⚔️ ${player1} vs ${player2}` : `👤 ${username}`}
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={toggleSound}
          sx={{ textTransform: "none", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", backgroundColor: soundEnabled ? "#4caf50" : "#f44336", color: "#fff", "&:hover": { backgroundColor: soundEnabled ? "#388e3c" : "#d32f2f" } }}
        >
          {soundEnabled ? "🔊 Sonido Activado" : "🔇 Sonido Desactivado"}
        </Button>
        <Button
          variant="contained2"
          onClick={handleOpenConfirmationModal}
          sx={{ textTransform: "none", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", backgroundColor: "#f44336", color: "#fff", "&:hover": { backgroundColor: "#d32f2f" } }}
        >
          Salir al menú principal
        </Button>
      </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Paper sx={{
                p: 3, borderRadius: 3,
                backgroundColor: "#0C2D48", boxShadow: 5, color: "#fff"
              }}>
                {questionData ? (
                  <>
                    {questionData.image && (
                      <Box display="flex" justifyContent="center" my={2}>
                        <img
                          src={questionData.image}
                          alt={
                            questionData.type === 'monument' ? 'Monumento' :
                            questionData.type === 'food'     ? 'Comida típica' :
                            questionData.type === 'flag'     ? 'Bandera' :
                            questionData.type === 'capital'  ? 'Capital' :
                            `Imagen de ${questionData.question}`
                          }
                          style={{
                            width: "100%",
                            maxWidth: "450px",
                            maxHeight: "300px",
                            borderRadius: "8px",
                            fontFamily: "Orbitron, sans-serif"
                          }}
                        />
                      </Box>
                    )}
                    <Typography variant="h6" gutterBottom sx={{ fontFamily: "Orbitron, sans-serif" }}>
                      {questionData.question}
                    </Typography>
                    <RadioGroup value={selectedAnswer} onChange={e => setSelectedAnswer(e.target.value)}>
                      {questionData.choices.map((opt, i) => (
                        <Box key={i} display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <Button
                            variant="contained"
                            color={answered
                              ? (opt === questionData.answer ? "success" : "error")
                              : "primary"
                            }
                            fullWidth
                            onClick={() => handleAnswer(opt)}
                            disabled={answered}
                            sx={{
                              textTransform: "none",
                              fontWeight: "bold",
                              backgroundColor: "#FF6584",
                              color: "#fff",
                              fontFamily: "Orbitron, sans-serif",
                              "&:hover": { backgroundColor: "#e91e63" }
                            }}
                          >
                            {opt}
                          </Button>
                          {feedback[opt] && (
                            <Typography ml={2} color={feedback[opt] === "✅" ? "green" : "red"} variant="h6">
                              {feedback[opt]}
                            </Typography>
                          )}
                        </Box>
                      ))}
                      {answered && selectedAnswer !== questionData.answer && (
                        <Typography sx={{ mt: 2, color: "#fff", textAlign: "center", fontFamily: "Orbitron, sans-serif" }}>
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
              <Paper sx={{
                p: 3, borderRadius: 3,
                backgroundColor: "#0C2D48", boxShadow: 5, textAlign: "center", width: "50%", alignSelf: "center"
              }}>
                <Typography variant="h5" gutterBottom color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
                  Tiempo restante:
                </Typography>
                <Countdown
                  key={`${timerEndTime}-${questionCounter}`}
                  date={timerEndTime}
                  renderer={renderer}
                  autoStart={!paused}
                />
              </Paper>

              <Paper sx={{
                mt: 4, p: 3, borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.1)", boxShadow: 5, textAlign: "center"
              }}>
                {questionData?.answer && <LLMChat correctAnswer={questionData.answer} />}
              </Paper>
            </Grid>
          </Grid>
        </Container>

      </Box>

      {/* Waiting for opponent */}
      <Dialog open={waitingForOpponent}>
        <DialogTitle>Esperando oponente</DialogTitle>
        <DialogContent>
          <Typography>Esperando a {opponent} para terminar el duelo...</Typography>
        </DialogContent>
      </Dialog>

      {/* Duel result */}
      <Dialog open={resultDialogOpen}>
        <DialogTitle>Resultado del Duelo</DialogTitle>
        <DialogContent>
          {duelStats && (
            <>
              <Box component="table" sx={{ width: '100%', textAlign: 'center', mb: 2 }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th">Jugador</Box>
                    <Box component="th">✅ Aciertos</Box>
                    <Box component="th">⏱ Tiempo</Box>
                  </Box>
                </Box>
                <Box component="tbody">
                  <Box component="tr">
                    <Box component="td">{username}</Box>
                    <Box component="td">{duelStats.your.correct}</Box>
                    <Box component="td">{duelStats.your.time}</Box>
                  </Box>
                  <Box component="tr">
                    <Box component="td">{opponent}</Box>
                    <Box component="td">{duelStats.other.correct}</Box>
                    <Box component="td">{duelStats.other.time}</Box>
                  </Box>
                </Box>
              </Box>
              <Typography variant="h6" textAlign="center">
                {duelStats.winner === "Empate"
                  ? "¡Ha sido un empate!"
                  : `🏆 ¡${duelStats.winner} ha ganado el duelo!`}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/startmenu")}>Volver al menú</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Exit */}
      <Dialog open={openConfirmationModal} onClose={handleCloseConfirmationModal}
              sx={{ '& .MuiDialog-paper': { backgroundColor: '#0C2D48', color: '#fff', borderRadius: 2 } }}>
        <DialogTitle sx={{ fontFamily: "Orbitron, sans-serif", fontWeight: 'bold', fontSize: '1.5rem' }}>
          ¿Seguro que quieres salir?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff' }}>
            Si sales ahora, se terminará la partida actual. ¿Estás seguro de que deseas volver al menú principal?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-around', p: 2 }}>
          <Button onClick={handleCloseConfirmationModal} variant="outlined"
                  sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff', borderColor: '#fff' }}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmExit} variant="contained"
                  sx={{ fontFamily: "Orbitron, sans-serif", backgroundColor: '#f44336', color: '#fff' }}>
            Salir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary (individual) */}
      <Dialog open={showSummaryModal} onClose={() => setShowSummaryModal(false)}
              sx={{ '& .MuiDialog-paper': { backgroundColor: '#0C2D48', color: '#fff', borderRadius: 2 } }}>
        <DialogTitle sx={{ fontFamily: "Orbitron, sans-serif", fontWeight: 'bold', fontSize: '1.5rem' }}>
          ¡Resumen de la partida!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff' }}>
            Preguntas totales: {settings.questionAmount}<br/>
            Respondidas: {correctCount + wrongCount}<br/>
            ✅ Correctas: {correctCount}<br/>
            ❌ Incorrectas: {wrongCount}<br/>
            Porcentaje: {Math.round((correctCount / settings.questionAmount) * 100)}%
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-around', p: 2 }}>
          <Button onClick={handlePlayAgain} variant="outlined"
                  sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff', borderColor: '#fff' }}>
            Volver a jugar
          </Button>
          <Button onClick={handleConfirmExit} variant="contained"
                  sx={{ fontFamily: "Orbitron, sans-serif", backgroundColor: '#4caf50', color: '#fff' }}>
            Volver al menú
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Game;
