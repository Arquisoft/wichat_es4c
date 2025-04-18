const express = require("express");
const cors = require("cors");
const { generateQuestion} = require('./question-gen');
const connectToDatabase = require('./connection');

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
        const question = await withTimeout(generateQuestion(), 5000);

        // Transformar la estructura si es necesario
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
