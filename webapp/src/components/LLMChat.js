import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const LLMChat = () => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiEndpoint = "http://localhost:8003";

  const handleAskLLM = async () => {
    if (!question.trim()) return;
    setLoading(true);
    
    try {
      const res = await axios.post(`${apiEndpoint}/ask`, {
        question,
        model: "gemini", // Cambia según el modelo deseado
        apiKey: process.env.REACT_APP_LLM_API_KEY,
      });
      
      setChatHistory(prevHistory => [
        ...prevHistory,
        { question, response: res.data.answer }
      ]);
      
    } catch (error) {
      console.error("Error al consultar el LLM:", error);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { question, response: "Error al obtener la respuesta." }
      ]);
    }
    setLoading(false);
    setQuestion("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 3,
        boxShadow: 3,
        textAlign: "center",
        width: "100%",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Pregunta al LLM
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        label="Escribe tu pregunta"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleAskLLM}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Enviar"}
      </Button>
      
      <Box
        sx={{
          mt: 2,
          width: "100%",
          maxHeight: 300,
          overflowY: "auto",
          bgcolor: "#1E1E1E",
          p: 2,
          borderRadius: 2,
        }}
      >
        {chatHistory.map((chat, index) => (
          <Box key={index} sx={{ mb: 2, textAlign: "left" }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#BB86FC" }}>
              Pregunta:
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>{chat.question}</Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#03DAC6" }}>
              Respuesta:
            </Typography>
            <Typography variant="body1">{chat.response}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default LLMChat;
