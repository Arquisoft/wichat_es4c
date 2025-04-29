const express = require("express");
const cors = require("cors");
const { generateQuestion} = require('./question-gen');
const connectToDatabase = require('./connection');
const Question = require('./question-model');

const app = express();
const PORT = 8004;

// Conectar a la base de datos
connectToDatabase();

app.use(cors());
app.use(express.json());


const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Question generation took too long")), ms)
    );
    return Promise.race([promise, timeout]);
};

app.get('/question', async (req, res) => {
    try {
        const toBool = (val) => val === 'true';
        const allowedTypes = {
            capital:  toBool(req.query.capital),
            flag:     toBool(req.query.flag),
            monument: toBool(req.query.monument),
            food:     toBool(req.query.food),
        };
        
        // Verificar si hay algún tipo de pregunta habilitado
        const hasEnabledType = Object.values(allowedTypes).some(value => value === true);
        if (!hasEnabledType) {
            return res.status(400).json({ error: 'At least one question type must be enabled' });
        }
        
        // Contar preguntas en la base de datos
        const count = await Question.countDocuments();
        if (count === 0) {
            // Devolver una pregunta predefinida si la base de datos está vacía
            return res.json({
                type: "capital",
                question: "¿Cuál es la capital de España?",
                choices: ["Madrid", "Barcelona", "Sevilla", "Valencia"],
                answer: "Madrid",
                image: null,
            });
        }
        
        const question = await withTimeout(generateQuestion(allowedTypes), 5000);
        const formattedQuestion = {
            type: question.type,
            question: question.question,
            choices: question.choices,
            answer: question.answer,
            image: question.image || null,
        };
        res.json(formattedQuestion);
    } catch (error) {
        console.error("Error fetching question:", error.message);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});
