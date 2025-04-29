import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const LLMChat = ({ correctAnswer }) => {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
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
      const res = await axios.post(`${apiEndpoint}/askllm`, {
        question,
        model: "gemini",
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
        bgcolor: "#0C2D48",
        borderRadius: 3,
        boxShadow: 3,
        textAlign: "center",
        width: "100%",
      }}
    >
      <Typography variant="h6" gutterBottom color="#fff" fontFamily={"Orbitron, sans-serif"}>
        Pregunta a WIChat buddy:
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        label="Escribe tu pregunta"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyPress={handleKeyPress}
        inputRef={inputRef}
        sx={{
          mb: 2,
          fontFamily: "Orbitron, sans-serif",
          "& .MuiOutlinedInput-root": {
            color: "#fff", // texto
            "& fieldset": {
              borderColor: "#fff", // borde
            },
            "&:hover fieldset": {
              borderColor: "#fff", // borde al hacer hover
            },
            "&.Mui-focused fieldset": {
              borderColor: "#fff", // borde al estar enfocado
            },
          },
          "& .MuiInputLabel-root": {
            color: "#fff", // color del label
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#fff", // color del label al enfocar
          },
          backgroundColor: "#0C2D48", // fondo oscuro
          borderRadius: 1,
        }}
      />
      <Button
        variant="contained"
        onClick={handleAskLLM}
        disabled={loading}
        sx={{
          backgroundColor: "#FF6584",
          color: "#fff",
          fontFamily: "Orbitron, sans-serif",
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#e05070",
          },
        }}
      >
        {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Enviar"}
      </Button>

      <Box
        ref={chatBoxRef} // Asignar la referencia al contenedor del historial
        sx={{
          mt: 2,
          width: "100%",
          maxHeight: 300,
          overflowY: "auto",
          p: 2,
          borderRadius: 2,
        }}
      >
        {chatHistory.map((chat, index) => (
          <Box key={index} sx={{ mb: 2, textAlign: "left" }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#BB86FC", fontFamily: "Orbitron, sans-serif" }}>
              Pregunta:
            </Typography>
            <Typography variant="body1" color="#fff" sx={{ mb: 1 }}>{chat.question}</Typography>
            <Typography variant="body2" sx={{ fontWeight: "bold", color: "#03DAC6", fontFamily: "Orbitron, sans-serif" }}>
              Respuesta:
            </Typography>
            <Typography variant="body1" color="#fff">{chat.response}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default LLMChat;