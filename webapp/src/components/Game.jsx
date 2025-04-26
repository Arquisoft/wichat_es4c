import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const startTime = useRef(Date.now());
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || "http://localhost:8000";
  const username = localStorage.getItem("username");
  const hasFetched = useRef(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);

  const correctSound = new Howl({ src: [correctSoundFile], volume: 0.2 });
  const wrongSound = new Howl({ src: [wrongSoundFile], volume: 0.2 });

  // Efecto para controlar la pausa durante el resumen
  useEffect(() => {
    if (showSummaryModal) {
      setPaused(true);
    } else {
      setPaused(false);
    }
  }, [showSummaryModal]);

  const toggleSound = () => setSoundEnabled((prev) => !prev);
  const playSound = (sound) => { if (soundEnabled) sound.play(); };

  useEffect(() => { soundEnabled ? backgroundMusic.play() : backgroundMusic.pause(); }, [soundEnabled]);
  useEffect(() => { if (soundEnabled) backgroundMusic.play(); return () => backgroundMusic.stop(); }, [soundEnabled]);

  const handleOpenConfirmationModal = () => setOpenConfirmationModal(true);
  const handleCloseConfirmationModal = () => setOpenConfirmationModal(false);

// Antes:
// const handleConfirmExit = () => {
//   backgroundMusic.stop();
//   setPaused(true);
//   navigate("/startmenu");
// };

// Después (envuelto en useCallback):
const handleConfirmExit = useCallback(() => {
  backgroundMusic.stop();

  setPaused(true);

  navigate("/startmenu");
}, [navigate]); 

  const newGame = useCallback(async () => {
    try { if (username) await axios.post(`${apiEndpoint}/incrementGamesPlayed`, { username }); }
    catch (error) { console.error("Error incrementing game:", error); }
  }, [username, apiEndpoint]);

  const fetchQuestion = useCallback(async () => {
    if (loadingQuestion) return;
    setLoadingQuestion(true);
    try {
      setQuestionData(null);
      setSelectedAnswer("");
      setFeedback({});
      setAnswered(false);
      setPaused(false);
      startTime.current = Date.now();
      
      setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
      
      const response = await axios.get(`${apiEndpoint}/question`, {
        params: {
          capital: settings.capitalQuestions.toString(),
          flag: settings.flagQuestions.toString(),
          monument: settings.monumentQuestions.toString(),
          food: settings.foodQuestions.toString(),
        },
      });
      setQuestionData(response.data);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setLoadingQuestion(false);
    }
  }, [loadingQuestion, apiEndpoint, settings.answerTime, settings.capitalQuestions, settings.flagQuestions, settings.monumentQuestions, settings.foodQuestions]);
  
  useEffect(() => { if (!hasFetched.current && settings.answerTime) { newGame(); fetchQuestion(); hasFetched.current = true; } }, [newGame, fetchQuestion, settings.answerTime]);

  useEffect(() => {
    if (!username) {
      handleConfirmExit();
      return;
    }
    const fetchUserSettings = async () => {
      try {
        const response = await fetch(`http://localhost:8001/getSettings/${username}`);
        if (!response.ok) throw new Error("No se pudo obtener la información del perfil");
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.log(error.message);
      }
    };
    fetchUserSettings();
  }, [username, navigate, handleConfirmExit]);

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

  const handleAnswer = async (answer) => {
    if (!answer || loadingQuestion || answered) return;
    const isCorrect = answer === questionData.answer;
    const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
  
    setFeedback({ ...feedback, [answer]: isCorrect ? "✅" : "❌" });
    setAnswered(true);
    setPaused(true);
    
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      playSound(correctSound);
    } else {
      setWrongCount((prev) => prev + 1);
      playSound(wrongSound);
    }
  
    if (username) {
      try {
        await axios.post(`${apiEndpoint}/updateStats`, { username, isCorrect, timeTaken });
      } catch (error) {
        console.error("Error al actualizar estadísticas:", error);
      }
    }
  
    setTimeout(() => {
      const next = questionCounter + 1;
      if (next >= settings.questionAmount) {
        setShowSummaryModal(true);
      } else {
        setQuestionCounter(next);
        setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
        fetchQuestion();
      }
      setAnswered(false);
      setPaused(false);
    }, 2500);
  };

  const renderer = ({ seconds, completed }) => {
    if (paused || showSummaryModal) return <Typography variant="h4" color="textSecondary">Pausado...</Typography>;
    if (completed) {
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

  const handlePlayAgain = () => {
    setCorrectCount(0);
    setWrongCount(0);
    setQuestionCounter(0);
    setShowSummaryModal(false);
    setAnswered(false);
    setPaused(false);
    setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
    fetchQuestion();
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
                            disabled={answered || showSummaryModal}
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
                  key={`${timerEndTime}-${questionCounter}`}
                  date={timerEndTime}
                  renderer={renderer}
                  autoStart={!paused && !showSummaryModal}
                  onComplete={() => {
                    if (!answered && !showSummaryModal) {
                      setAnswered(true);
                      setPaused(true);
                      setWrongCount(prev => prev + 1);
                      playSound(wrongSound);
                      
                      setTimeout(() => {
                        const next = questionCounter + 1;
                        if (next >= settings.questionAmount) {
                          setShowSummaryModal(true);
                        } else {
                          setQuestionCounter(next);
                          setTimerEndTime(Date.now() + (settings.answerTime || 10) * 1000);
                          fetchQuestion();
                        }
                        setAnswered(false);
                        setPaused(false);
                      }, 1000);
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
            variant="contained2"
            onClick={handleOpenConfirmationModal}
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              fontFamily: "Orbitron, sans-serif",
              backgroundColor: "#f44336",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#d32f2f",
              },
            }}
          >
            Salir al menú principal
          </Button>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
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
      <Dialog
        open={openConfirmationModal}
        onClose={handleCloseConfirmationModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#0C2D48', color: '#fff', borderRadius: 2 } }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontFamily: "Orbitron, sans-serif", fontWeight: 'bold', fontSize: '1.5rem' }}>
          {"¿Seguro que quieres salir?"}
        </DialogTitle>
        <DialogContent sx={{ fontFamily: "Orbitron, sans-serif", }}>
          <DialogContentText id="alert-dialog-description" sx={{ color: '#fff', fontFamily: "Orbitron, sans-serif", fontSize: '1rem' }}>
            Si sales ahora, se terminará la partida actual. ¿Estás seguro de que deseas volver al menú principal?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-around', padding: '16px' }}>
          <Button onClick={handleCloseConfirmationModal} sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#fff' } }} variant="outlined">Cancelar</Button>
          <Button onClick={handleConfirmExit} autoFocus sx={{ fontFamily: "Orbitron, sans-serif", backgroundColor: '#f44336', color: '#fff', '&:hover': { backgroundColor: '#d32f2f' } }} variant="contained">
            Salir
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#0C2D48', color: '#fff', borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontFamily: "Orbitron, sans-serif", fontWeight: 'bold', fontSize: '1.5rem' }}>
          ¡Resumen de la partida!
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff', fontSize: '1rem' }}>
            <br />Preguntas totales: {settings.questionAmount}
            <br />Preguntas respondidas: {correctCount + wrongCount}
            <br />✅ Correctas: {correctCount}
            <br />❌ Incorrectas: {wrongCount}
            <br />Porcentaje de aciertos: {Math.round((correctCount / settings.questionAmount) * 100)}%
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-around', padding: '16px' }}>
          <Button onClick={handlePlayAgain} sx={{ fontFamily: "Orbitron, sans-serif", color: '#fff', borderColor: '#fff' }} variant="outlined">Volver a jugar</Button>
          <Button onClick={handleConfirmExit} sx={{ fontFamily: "Orbitron, sans-serif", backgroundColor: 'primary', color: '#fff' }} variant="contained">Volver al menú</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Game;