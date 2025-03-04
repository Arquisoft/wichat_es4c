const express = require("express");
const cors = require("cors");
const { generateQuestion } = require('./question-gen');

const app = express();
const PORT = 8004;

app.use(cors());
app.use(express.json());

app.get('/question', async (req, res) => {
    try {
        const question = await generateQuestion();
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate question' });
    }
});

app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});
