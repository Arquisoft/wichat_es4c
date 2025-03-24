const { fetchCapitalQuestion } = require('./wikidata-client');

async function generateQuestion() {
    const data = await fetchCapitalQuestion();

    if (data.length < 4) {
        throw new Error('Not enough data to generate question');
    }

    const correctIndex = Math.floor(Math.random() * data.length);
    const correctChoice = data[correctIndex];

    const incorrectChoices = data
        .filter((_, index) => index !== correctIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const choices = [...incorrectChoices.map(choice => choice.capitalLabel.value), correctChoice.capitalLabel.value]
        .sort(() => 0.5 - Math.random());

    // Obtain URL flag image (if available)
    const flagUrl = correctChoice.flag ? correctChoice.flag.value : null;

    return {
        question: `¿Cuál es la capital de ${correctChoice.countryLabel.value}?`,
        choices: choices,
        answer: correctChoice.capitalLabel.value,
        image: flagUrl 
    };
}

module.exports = { generateQuestion };


