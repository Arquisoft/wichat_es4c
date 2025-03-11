import React, { useState } from "react";
import axios from "axios";
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";

const LLMChat = () => {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const apiEndpoint = "http://localhost:8003";

  const handleAskLLM = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const res = await axios.post(`${apiEndpoint}/ask`, {
        question,
        model: "gemini", // Cambia según el modelo deseado
        apiKey: process.env.REACT_APP_LLM_API_KEY,
      });
      setResponse(res.data.answer);
    } catch (error) {
      console.error("Error al consultar el LLM:", error);
      setResponse("Error al obtener la respuesta.");
    }
    setLoading(false);
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
      {response && (
        <Typography variant="body1" sx={{ mt: 2, bgcolor: "#1E1E1E", p: 2, borderRadius: 2 }}>
          {response}
        </Typography>
      )}
    </Box>
  );
};

export default LLMChat;
