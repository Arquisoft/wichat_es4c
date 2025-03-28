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
            headers: { 'User-Agent': 'WIChat/1.0' }
        });

        const results = response.data.results.bindings;

        const seen = new Set();
        return results
            .filter(entry => {
                const key = JSON.stringify(entry);
                if (seen.has(key) || Object.values(entry).some(v => v === "")) {
                    return false;
                }
                seen.add(key);
                return true;
            })
            .map(entry => {
                // Redimensionar la imagen si existe
                if (entry.image && entry.image.value) {
                    entry.image.value = getResizedImageUrl(entry.image.value, 500, 300); // Ancho: 500px, Altura: 300px
                }
                if (entry.flag && entry.flag.value) {
                    entry.flag.value = getResizedImageUrl(entry.flag.value, 500, 300); // Ancho: 500px, Altura: 300px
                }
                return entry;
            });

    } catch (error) {
        console.error("Error fetching data from Wikidata:", error.message);
        return [];
    }
}

function getResizedImageUrl(imageUrl, width = 500, height = 300) {
    if (!imageUrl.includes("commons.wikimedia.org")) {
        return imageUrl; // Si no es una imagen de Wikimedia, devuelve la URL original
    }
    return `${imageUrl}?width=${width}&height=${height}`;
}

module.exports = { 
    fetchCapitalQuestion, 
    fetchFlagQuestion, 
    fetchMonumentQuestion, 
    fetchFoodQuestion 
};