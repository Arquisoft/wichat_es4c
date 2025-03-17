const { fetchCapitalQuestion, fetchMonumentQuestion } = require('./wikidata-client');

async function generateQuestion() {
    const questionType = Math.random() < 0.5 ? 'capital' : 'monument'; // 50% de cada tipo

    if (questionType === 'capital') {
        return generateCapitalQuestion();
    } else {
        return generateMonumentQuestion();
    }
}

async function generateCapitalQuestion() {
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

    const flagUrl = correctChoice.flag ? correctChoice.flag.value : null;

    return {
        type: 'capital',
        question: `¿Cuál es la capital de ${correctChoice.countryLabel.value}?`,
        choices,
        answer: correctChoice.capitalLabel.value,
        image: flagUrl
    };
}

async function generateMonumentQuestion() {
    const data = await fetchMonumentQuestion();

    if (data.length < 4) {
        throw new Error('Not enough data to generate question');
    }

    const correctIndex = Math.floor(Math.random() * data.length);
    const correctChoice = data[correctIndex];

    const incorrectChoices = data
        .filter((_, index) => index !== correctIndex)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const choices = [...incorrectChoices.map(choice => choice.cityLabel.value), correctChoice.cityLabel.value]
        .sort(() => 0.5 - Math.random());

    const monumentImage = correctChoice.image ? correctChoice.image.value : null;

    return {
        type: 'monument',
        question: `¿Dónde se encuentra el monumento "${correctChoice.monumentLabel.value}"?`,
        choices,
        answer: correctChoice.cityLabel.value,
        image: monumentImage
    };
}

module.exports = { generateQuestion };
