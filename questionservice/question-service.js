const express = require("express");
const cors = require("cors");
const { generateQuestion} = require('./question-gen');
const connectToDatabase = require('./connection');

const app = express();
const PORT = 8004;

// Conectar a la base de datos
connectToDatabase();

app.use(cors());


const withTimeout = (promise, ms) => {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: Question generation took too long")), ms)
    );
    return Promise.race([promise, timeout]);
};

app.use((req, res, next) => {
    next();
});

app.get('/question', async (req, res) => {
    try {

        //console.log("Raw query parameters:", req.query);

        const toBool = (val) => val === 'true';

        const allowedTypes = {
            capital:  toBool(req.query.capital),
            flag:     toBool(req.query.flag),
            monument: toBool(req.query.monument),
            food:     toBool(req.query.food),
        };

        //console.log("allowedTypes", allowedTypes);

        const question = await withTimeout(generateQuestion(allowedTypes), 5000);

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
        console.error("Error fetching question: nikla putero", error.message);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});
