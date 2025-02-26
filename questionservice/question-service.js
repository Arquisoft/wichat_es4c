const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8004;

app.use(cors());
app.use(express.json());

app.get("/question", (req, res) => {
  const sampleQuestion = {
    question: "¿Cuál es la capital de Francia?",
    options: ["Madrid", "Berlín", "París", "Roma"],
    correctAnswer: "París"
  };

  res.json(sampleQuestion);
});

app.listen(PORT, () => {
  console.log(`Question Service running on port ${PORT}`);
});
