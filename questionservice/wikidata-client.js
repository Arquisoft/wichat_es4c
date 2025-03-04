const axios = require('axios');


async function fetchCapitalQuestion() {
    const query = `
    SELECT ?countryLabel ?capitalLabel ?flag
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Filtra solo países
                 wdt:P36 ?capital.  # Obtiene la capital
        
        OPTIONAL { ?country wdt:P41 ?flag } # Obtiene la bandera del país si está disponible

        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 50
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url);
        return response.data.results.bindings;
    } catch (error) {
        console.error("Error fetching data from Wikidata:", error);
        return [];
    }
}

module.exports = { fetchCapitalQuestion };
