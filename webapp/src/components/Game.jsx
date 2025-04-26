import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Container, Typography, Box, Button, Grid,
  RadioGroup, Paper, CircularProgress, Snackbar, Alert,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import Countdown from 'react-countdown';
import LLMChat from "./LLMChat";
import { Howl } from 'howler';
import correctSoundFile from '../assets/sounds/correct.mp3';
import wrongSoundFile from '../assets/sounds/wrong.mp3';
import backgroundMusicFile from '../assets/sounds/backgroundMusic.mp3';
import mapBg from '../assets/images/world-bg.png';

// Background music setup
const backgroundMusic = new Howl({
  src: [backgroundMusicFile],
  loop: true,
  volume: 0.1,
});

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const isDuel = params.get("duel") === "true";
  const player1 = params.get("player1");
  const player2 = params.get("player2");

  // Core state
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState({});
  const [timerEndTime, setTimerEndTime] = useState(Date.now() + 10000);
  const [answered, setAnswered] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [paused, setPaused] = useState(false);
  const [questionCounter, setQuestionCounter] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  // Modals and notifications
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [winner, setWinner] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // User and settings
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const username = localStorage.getItem("username");
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timing
  const startTime = useRef(Date.now());
  const hasFetched = useRef(false);

  // Sounds
  const [soundEnabled, setSoundEnabled] = useState(true);
  const correctSound = new Howl({ src: [correctSoundFile], volume: 0.2 });
  const wrongSound = new Howl({ src: [wrongSoundFile], volume: 0.2 });

  // Effects for background music
  useEffect(() => {
    soundEnabled ? backgroundMusic.play() : backgroundMusic.pause();
  }, [soundEnabled]);
  useEffect(() => { if (soundEnabled) backgroundMusic.play(); return () => backgroundMusic.stop(); }, []);

  // Pause when summary shown
  useEffect(() => { setPaused(showSummaryModal); }, [showSummaryModal]);

  const toggleSound = () => setSoundEnabled(prev => !prev);
  const playSound = (sound) => { if (soundEnabled) sound.play(); };
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Game initialization
  const newGame = useCallback(async () => {
    try { if (username) await axios.post(`${apiEndpoint}/incrementGamesPlayed`, { username }); }
    catch (err) { console.error("Error incrementing game:", err); }
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
      setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
      const res = await axios.get(`${apiEndpoint}/question`);
      setQuestionData(res.data);
    } catch (err) {
      console.error("Error fetching question:", err);
    } finally {
      setLoadingQuestion(false);
    }
  }, [loadingQuestion, apiEndpoint, settings.answerTime]);

  // Initial fetch
  useEffect(() => {
    if (!hasFetched.current && settings.answerTime) {
      newGame(); fetchQuestion(); hasFetched.current = true;
    }
  }, [newGame, fetchQuestion, settings.answerTime]);

  // Load user settings
  useEffect(() => {
    if (!username) { setOpenConfirmationModal(false); navigate("/startmenu"); return; }
    const loadSettings = async () => {
      try {
        const resp = await fetch(`http://localhost:8001/getSettings/${username}`);
        if (!resp.ok) throw new Error("No se pudo obtener la información del perfil");
        const data = await resp.json();
        setUser(data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    loadSettings();
  }, [username, navigate]);

  // Apply settings
  useEffect(() => {
    if (user) {
      setSettings({
        answerTime: user.answerTime || 10,
        questionAmount: user.questionAmount || 10,
        capitalQuestions: user.capitalQuestions ?? true,
        flagQuestions: user.flagQuestions ?? true,
        monumentQuestions: user.monumentQuestions ?? true,
        foodQuestions: user.foodQuestions ?? true,
      });
    }
  }, [user]);

  // Timer end update
  useEffect(() => { if (settings.answerTime) setTimerEndTime(Date.now() + settings.answerTime * 1000); }, [settings.answerTime]);
  useEffect(() => setPaused(loadingQuestion), [loadingQuestion]);

  // Exit confirmation
  const handleOpenConfirmationModal = () => setOpenConfirmationModal(true);
  const handleCloseConfirmationModal = () => setOpenConfirmationModal(false);
  const handleConfirmExit = () => { backgroundMusic.stop(); setPaused(true); navigate("/startmenu"); };

  // Handle answers
  const handleAnswer = (answer) => {
    if (!answer || loadingQuestion || answered) return;
    const isCorrect = answer === questionData.answer;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
    setFeedback(prev => ({ ...prev, [answer]: isCorrect ? "✅" : "❌" }));
    setAnswered(true);
    setPaused(true);
    if (isCorrect) setCorrectCount(c => c + 1); else setWrongCount(w => w + 1);
    setTotalTime(t => t + timeTaken);
    playSound(isCorrect ? correctSound : wrongSound);

    setTimeout(async () => {
      const next = questionCounter + 1;
      setQuestionCounter(next);
      if (next >= settings.questionAmount) {
        if (isDuel) {
          await axios.post(`${apiEndpoint}/submitDuelResult`, {
            username,
            opponent: username === player1 ? player2 : player1,
            correct: correctCount + (isCorrect ? 1 : 0),
            time: totalTime + timeTaken
          });
          const interval = setInterval(async () => {
            try {
              const res = await axios.post(`${apiEndpoint}/checkDuelResult`, { username, opponent: username === player1 ? player2 : player1 });
              if (res.data.status === "done") {
                clearInterval(interval);
                setWinner(res.data.winner);
                setResultDialogOpen(true);
              }
            } catch (e) { console.error(e); }
          }, 2000);
        } else {
          setShowSummaryModal(true);
        }
      } else {
        setAnswered(false);
        setPaused(false);
        fetchQuestion();
      }
    }, 2500);
  };

  // Renderer for countdown
  const renderer = ({ seconds, completed }) => {
    if (paused) return <Typography variant="h4" color="textSecondary">Pausado...</Typography>;
    if (completed) {
      setTimeout(() => setSnackbarOpen(true), 0);
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
        <Box position="absolute" top={0} left={0} bottom={0} right={0} display="flex" alignItems="center" justifyContent="center">
          <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>{seconds}s</Typography>
        </Box>
      </Box>
    );
  };

  // Play again for summary
  const handlePlayAgain = () => {
    setCorrectCount(0); setWrongCount(0); setTotalTime(0);
    setQuestionCounter(0); setShowSummaryModal(false);
    setAnswered(false); setPaused(false);
    setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
    fetchQuestion();
  };

  return (
    <>
      <Box sx={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                 background: `url(${mapBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>

        <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
          {isDuel ? (
            <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
              ⚔️ {player1} vs {player2}
            </Typography>
          ) : (
            <Typography variant="h6" color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
              👤 {username}
            </Typography>
          )}
        </Box>

        <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
          <Button variant="contained2" onClick={handleOpenConfirmationModal} sx={{ textTransform: "none", fontWeight: "bold", fontFamily: "Orbitron, sans-serif",
            backgroundColor: "#f44336", color: "#fff", '&:hover': { backgroundColor: "#d32f2f" } }}>
            Salir al menú principal
          </Button>
          <Button variant="contained" color={soundEnabled ? "success" : "error"} onClick={toggleSound}
            sx={{ ml: 2, textTransform: "none", fontWeight: "bold", fontFamily: "Orbitron, sans-serif",
              backgroundColor: soundEnabled ? "#4caf50" : "#f44336", color: "#fff", '&:hover': { backgroundColor: soundEnabled ? "#388e3c" : "#d32f2f" } }}>
            {soundEnabled ? "🔊 Sonido Activado" : "🔇 Sonido Desactivado"}
          </Button>
        </Box>

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={4} alignItems="stretch">
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "#0C2D48", backdropFilter: "blur(10px)", boxShadow: 5, color: "#fff" }}>
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
                          style={{ width: "100%", maxWidth: "450px", maxHeight: "300px", borderRadius: "8px" }}
                        />
                      </Box>
                    )}
                    <Typography variant="h6" gutterBottom sx={{ fontFamily: "Orbitron, sans-serif" }}>
                      {questionData.question}
                    </Typography>
                    <RadioGroup value={selectedAnswer} onChange={e => setSelectedAnswer(e.target.value)}>
                      {questionData.choices.map((option, index) => (
                        <Box key={index} display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <	Button
                            variant="contained"
                            color={answered ? (option === questionData.answer ? "success" : "error") : "primary"}
                            fullWidth
                            onClick={() => handleAnswer(option)}
                            disabled={answered || showSummaryModal}
                            sx={{ textTransform: "none", fontWeight: "bold", backgroundColor: "#FF6584", color: "#fff", fontFamily: "Orbitron, sans-serif", '&:hover': { backgroundColor: "#e91e63" } }}
                          >
                            {option}
                          </Button>
                          {feedback[option] && (
                            <Typography variant="h6" sx={{ ml: 2, color: feedback[option] === "✅" ? "green" : "red" }}>
                              {feedback[option]}
                            </Typography>
                          )}
                        </Box>
                      ))}
                      {answered && selectedAnswer !== questionData.answer && (
                        <Typography variant="h6" sx={{ mt: 2, color: "#fff", textAlign: "center", fontFamily: "Orbitron, sans-serif" }}>
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
            {/* Timer and Chat Panel */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: "#0C2D48", textAlign: "center" }}>
                <Typography variant="h5" gutterBottom color="#fff" sx={{ fontFamily: "Orbitron, sans-serif" }}>
                  Tiempo restante:
                </Typography>
                <Countdown key={`${timerEndTime}-${questionCounter}`} date={timerEndTime} renderer={renderer} autoStart={!paused && !showSummaryModal} onComplete={() => {
                  if (!answered && !showSummaryModal) {
                    setAnswered(true);
                    setPaused(true);
                    setWrongCount(w => w + 1);
                    playSound(wrongSound);
                    setTimeout(() => {
                      const next = questionCounter + 1;
                      if (next >= settings.questionAmount && !isDuel) setShowSummaryModal(true);
                      else if (next < settings.questionAmount) { setQuestionCounter(next); setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000); fetchQuestion(); }
                      setAnswered(false);
                      setPaused(false);
                    }, 1000);
                  }
                }} />
              </Paper>
              <Paper sx={{ mt: 4, p: 3, borderRadius: 3, backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(10px)", boxShadow: 5 }}>
                {questionData?.answer && <LLMChat correctAnswer={questionData.answer} />}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Dialogs, Snackbar, etc. omitted for brevity */}
    </>
  );
};

export default Game;
