import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const LLMChat = ({ correctAnswer }) => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiEndpoint = "http://localhost:8003";
  const inputRef = useRef(null); // Referencia al cuadro de texto
  const chatBoxRef = useRef(null); // Referencia al contenedor del historial de chat

  useEffect(() => {
    // Enfocar el cuadro de texto al cargar el componente
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Desplazar el contenedor del historial hacia abajo cuando cambie el historial
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleAskLLM = async () => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await axios.post(`${apiEndpoint}/ask`, {
        question,
        model: "gemini", // Cambia según el modelo deseado
        apiKey: process.env.REACT_APP_LLM_API_KEY,
        correctAnswer: correctAnswer,
      });

      setChatHistory((prevHistory) => [
        ...prevHistory,
        { question, response: res.data.answer },
      ]);
    } catch (error) {
      console.error("Error al consultar el LLM:", error);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { question, response: "Error al obtener la respuesta." },
      ]);
    }
    setLoading(false);
    setQuestion("");
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleAskLLM();
    }
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
        onKeyPress={handleKeyPress} // Detectar la tecla "Enter"
        inputRef={inputRef} // Asignar la referencia al cuadro de texto
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
        ref={chatBoxRef} // Asignar la referencia al contenedor del historial
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