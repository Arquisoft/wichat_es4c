const axios = require('axios');

async function fetchCapitalQuestion() {
    const query = `
    SELECT ?countryLabel ?capitalLabel ?image
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Filtra solo países
                 wdt:P36 ?capital.  # Obtiene la capital

        OPTIONAL { ?country wdt:P18 ?image } # Obtiene una imagen representativa del país si está disponible

        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 20
    `;
    return await fetchFromWikidata(query);
}

async function fetchFlagQuestion() {
    const query = `
    SELECT ?countryLabel ?flag
    WHERE {
        ?country wdt:P31 wd:Q6256;  # Filtra solo países
                 wdt:P41 ?flag.     # Obtiene la bandera del país

        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 20
    `;
    return await fetchFromWikidata(query);
}

async function fetchMonumentQuestion() {
    const query = `
    SELECT ?countryLabel ?monumentLabel ?image
    WHERE {
        ?monument wdt:P31 wd:Q4989906;  # Filtra monumentos
                 wdt:P17 ?country;      # Relaciona el monumento con un país
                 wdt:P18 ?image.        # Obtiene la imagen del monumento

        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 20
    `;
    return await fetchFromWikidata(query);
}

async function fetchFoodQuestion() {
    const query = `
    SELECT ?countryLabel ?foodLabel ?image
    WHERE {
        ?food wdt:P31 wd:Q2095;       # Filtra alimentos
              wdt:P17 ?country;       # Relaciona el alimento con un país
              wdt:P18 ?image.         # Obtiene la imagen del alimento

        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 20
    `;
    return await fetchFromWikidata(query);
}

async function fetchFromWikidata(query) {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'MyQuizApp/1.0' }, 
            timeout: 5000
        });

        const results = response.data.results.bindings;

        const seen = new Set();
        return results.filter(entry => {
            const key = JSON.stringify(entry);
            if (seen.has(key) || Object.values(entry).some(v => v === "")) {
                return false;
            }
            seen.add(key);
            return true;
        });

    } catch (error) {
        console.error("Error fetching data from Wikidata:", error.message);
        return [];
    }
}

module.exports = { 
    fetchCapitalQuestion, 
    fetchFlagQuestion, 
    fetchMonumentQuestion, 
    fetchFoodQuestion 
};
