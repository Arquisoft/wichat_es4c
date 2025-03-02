// src/components/Home.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Typography, Button, Radio, RadioGroup, FormControlLabel, Box } from "@mui/material";

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
    if (selectedAnswer === questionData.answer) {
      setFeedback("Correcto 🎉");
    } else {
      setFeedback("Incorrecto ❌");
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Typography variant="h4" align="center" sx={{ marginTop: 4 }}>
        Juego de Preguntas
      </Typography>

      {questionData ? (
        <div>
          {questionData.image && (
            <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
              <img 
                src={questionData.image} 
                alt={`Bandera de ${questionData.question}`} 
                style={{ width: "150px", height: "auto", borderRadius: "5px", boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" }} 
              />
            </Box>
          )}

          <Typography variant="h6" sx={{ marginTop: 3 }}>
            {questionData.question}
          </Typography>

          <RadioGroup value={selectedAnswer} onChange={(e) => setSelectedAnswer(e.target.value)}>
            {questionData.choices.map((option, index) => (
              <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
            ))}
          </RadioGroup>

          <Button variant="contained" color="primary" onClick={handleAnswerSubmit} sx={{ marginTop: 2 }}>
            Enviar Respuesta
          </Button>

          {feedback && (
            <Typography variant="h6" sx={{ marginTop: 2, color: feedback === "Correcto 🎉" ? "green" : "red" }}>
              {feedback}
            </Typography>
          )}

          <Button variant="outlined" color="secondary" onClick={fetchQuestion} sx={{ marginTop: 2 }}>
            Siguiente Pregunta
          </Button>
        </div>
      ) : (
        <Typography variant="h6" align="center" sx={{ marginTop: 3 }}>
          Cargando pregunta...
        </Typography>
      )}
    </Container>
  );
};

export default Game;