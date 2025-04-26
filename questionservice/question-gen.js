const { 
    fetchCapitalQuestion, 
    fetchFlagQuestion, 
    fetchMonumentQuestion, 
    fetchFoodQuestion 
} = require('./wikidata-client');

const Question = require('./question-model');
const connectToDatabase = require('./connection');

connectToDatabase();

const questionTypes = {
    capital: { fetchData: fetchCapitalQuestion, generate: generateCapitalQuestion },
    flag: { fetchData: fetchFlagQuestion, generate: generateFlagQuestion },
    monument: { fetchData: fetchMonumentQuestion, generate: generateMonumentQuestion },
    food: { fetchData: fetchFoodQuestion, generate: generateFoodQuestion }
};


async function getQuestionFromDatabase(allowedTypes) {
  const count = await Question.countDocuments();
  if (count === 0) {
    throw new Error('No hay preguntas disponibles en la base de datos');
  }

  let question;
  do {
    const randomIndex = Math.floor(Math.random() * count);
    question = await Question.findOne().skip(randomIndex);
  } while (! allowedTypes[question.type]);

  return question;
}

async function generateQuestion(allowedTypes) {
  try {
    const question = await getQuestionFromDatabase(allowedTypes);
    return question;
  } catch (error) {
    console.error('Error al obtener la pregunta:', error);
    throw new Error('No se pudo obtener una pregunta de la base de datos');
  }
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

async function populateDatabase() {
  try {
    console.log('Conectando a la base de datos...');
    await connectToDatabase();

    console.log('Eliminando preguntas existentes...');
    await Question.deleteMany();

    const questionGenerators = [
      generateCapitalQuestion,
      generateFlagQuestion,
      generateMonumentQuestion,
      generateFoodQuestion,
    ];

    const uniqueQuestions = new Set();

    for (const generateQuestion of questionGenerators) {
      let uniqueCount = 0;

      while (uniqueCount < 30) { 
        try {
          const question = await generateQuestion();

          const questionKey = `${question.type}-${question.question}-${question.answer}`;

          if (!uniqueQuestions.has(questionKey)) {
            uniqueQuestions.add(questionKey); 
            await Question.create(question); 
            uniqueCount++; 
            console.log(`Pregunta guardada: ${question.question}`);
          } else {
            console.log(`Pregunta duplicada ignorada: ${question.question}`);
          }
        } catch (error) {
          console.error('Error al generar o guardar la pregunta:', error.message);
        }
      }
    }

    console.log('Base de datos rellenada con 30 preguntas únicas por tipo.');
  } catch (error) {
    console.error('Error al poblar la base de datos:', error.message);
  }
}

populateDatabase();

module.exports = { generateQuestion };
