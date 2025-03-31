const express = require("express");
const cors = require("cors");
const { generateQuestion } = require('./question-gen');

const app = express();
const PORT = 8004;

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
        res.json(question);
    } catch (error) {
        console.error("Error generating question:", error.message);

        if (error.message.includes("Timeout")) {
            try {
                const fallbackQuestion = await withTimeout(generateQuestion(), 5000);
                res.json(fallbackQuestion);
            } catch (fallbackError) {
                console.error("Error generating fallback question:", fallbackError.message);
                res.status(500).json({ error: 'Failed to generate question after timeout' });
            }
        } else {
            res.status(500).json({ error: 'Failed to generate question' });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Question Service running on port ${PORT}`);
});
