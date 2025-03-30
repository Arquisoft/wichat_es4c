const { 
    fetchCapitalQuestion, 
    fetchFlagQuestion, 
    fetchMonumentQuestion, 
    fetchFoodQuestion 
} = require('./wikidata-client');

const questionTypes = {
    capital: { fetchData: fetchCapitalQuestion, generate: generateCapitalQuestion },
    flag: { fetchData: fetchFlagQuestion, generate: generateFlagQuestion },
    monument: { fetchData: fetchMonumentQuestion, generate: generateMonumentQuestion },
    food: { fetchData: fetchFoodQuestion, generate: generateFoodQuestion }
};

const usedImages = new Set();

async function generateQuestion() {
    const keys = Object.keys(questionTypes);
    let attempts = 0;

    while (attempts < 3) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const question = await questionTypes[randomKey].generate();

        // Verificar si la imagen ya fue utilizada
        if (question.image && usedImages.has(question.image)) {
            attempts++;
            continue; // Intentar generar otra pregunta
        }

        if (question.image) {
            usedImages.add(question.image);
        }

        return question;
    }

    throw new Error("No se pudo generar una pregunta única después de varios intentos");
}

async function generateGeneralQuestion(type, dataKey, questionTemplate, imageKey = null) {
    const fetchData = questionTypes[type].fetchData;
    let data = await fetchData();

    // Filtrar datos válidos
    data = data.filter(item => 
        item[dataKey] && 
        item[dataKey].value && 
        !/^[Q]\d+$/.test(item[dataKey].value) && // Eliminar códigos de Wikidata como Q123456
        (!imageKey || (item[imageKey] && item[imageKey].value)) // Verificar que tenga imagen si es necesario
    );

    // Eliminar duplicados
    const uniqueData = Array.from(new Map(data.map(item => [item[dataKey].value, item])).values());

    if (uniqueData.length < 4) {
        throw new Error(`No hay suficientes datos únicos para generar una pregunta de ${type}`);
    }

    const correctIndex = Math.floor(Math.random() * uniqueData.length);
    const correctChoice = uniqueData[correctIndex];

    let incorrectChoices = uniqueData
        .filter((_, index) => index !== correctIndex)
        .map(choice => choice[dataKey].value);

    incorrectChoices = [...new Set(incorrectChoices)]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    if (incorrectChoices.length < 3) {
        throw new Error(`No se encontraron suficientes respuestas incorrectas únicas para la pregunta de ${type}`);
    }

    const choices = [...incorrectChoices, correctChoice[dataKey].value]
        .sort(() => 0.5 - Math.random());

    return {
        type,
        question: questionTemplate(correctChoice),
        choices,
        answer: correctChoice[dataKey].value,
        image: imageKey ? (correctChoice[imageKey] ? correctChoice[imageKey].value : null) : null
    };
}

async function generateCapitalQuestion() {
    return await generateGeneralQuestion(
        'capital', 
        'capitalLabel', 
        (choice) => `¿Cuál es la capital de ${choice.countryLabel.value}?`,
        'image'
    );
}

async function generateFlagQuestion() {
    return await generateGeneralQuestion(
        'flag', 
        'countryLabel', 
        () => `¿A qué país pertenece esta bandera?`,
        'flag'
    );
}

async function generateMonumentQuestion() {
    return await generateGeneralQuestion(
        'monument', 
        'countryLabel', 
        () => `¿A qué país pertenece este monumento?`,
        'image'
    );
}

async function generateFoodQuestion() {
    return await generateGeneralQuestion(
        'food', 
        'countryLabel', 
        () => `¿A qué país pertenece esta comida?`,
        'image'
    );
}

module.exports = { generateQuestion };
