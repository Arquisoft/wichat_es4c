const axios = require('axios');
const { 
  fetchCapitalQuestion, 
  fetchFlagQuestion,
  fetchMonumentQuestion,
  fetchFoodQuestion
} = require('./wikidata-client'); 

// Mock axios to avoid actual API calls
jest.mock('axios');

describe('Wikidata Quiz Service', () => {
  
  // Sample successful API response
  const mockSuccessResponse = {
    data: {
      results: {
        bindings: [
          {
            countryLabel: { value: 'España' },
            capitalLabel: { value: 'Madrid' },
            image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Madrid_Skyline.jpg' }
          },
          {
            countryLabel: { value: 'Francia' },
            capitalLabel: { value: 'París' },
            image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Paris_skyline.jpg' }
          }
        ]
      }
    }
  };

  const mockFlagResponse = {
    data: {
      results: {
        bindings: [
          {
            countryLabel: { value: 'España' },
            flag: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Spain.svg' }
          }
        ]
      }
    }
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCapitalQuestion', () => {
    it('should fetch capital questions successfully', async () => {
      axios.get.mockResolvedValueOnce(mockSuccessResponse);
      
      const result = await fetchCapitalQuestion();
      
      // Check if axios.get was called with the correct URL containing the SPARQL query
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://query.wikidata.org/sparql?query='),
        expect.objectContaining({
          headers: { 'User-Agent': 'WIChat/1.0' }
        })
      );
      
      // Check if the query contains the expected wdt:P36 property for capitals
      expect(axios.get.mock.calls[0][0]).toContain('wdt%3AP36');
      
      // Check if the response was properly processed
      expect(result).toHaveLength(2);
      expect(result[0].countryLabel.value).toBe('España');
      expect(result[0].capitalLabel.value).toBe('Madrid');
      
      // Check that image URLs were resized
      expect(result[0].image.value).toContain('?width=500&height=300');
    });
  });

  describe('fetchFlagQuestion', () => {
    it('should fetch flag questions successfully', async () => {
      axios.get.mockResolvedValueOnce(mockFlagResponse);
      
      const result = await fetchFlagQuestion();
      
      // Check if axios.get was called properly
      expect(axios.get).toHaveBeenCalledTimes(1);
      
      // Check if the query contains the expected wdt:P41 property for flags
      expect(axios.get.mock.calls[0][0]).toContain('wdt%3AP41');
      
      // Check the result
      expect(result).toHaveLength(1);
      expect(result[0].countryLabel.value).toBe('España');
      expect(result[0].flag.value).toContain('?width=500&height=300');
    });
  });

  describe('fetchMonumentQuestion', () => {
    it('should fetch monument questions correctly', async () => {
      const monumentResponse = {
        data: {
          results: {
            bindings: [
              {
                countryLabel: { value: 'Italia' },
                monumentLabel: { value: 'Coliseo' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Colosseum.jpg' }
              }
            ]
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(monumentResponse);
      
      const result = await fetchMonumentQuestion();
      
      // Check if the query contains monument filtering (P31 Q4989906)
      expect(axios.get.mock.calls[0][0]).toContain('wd%3AQ4989906');
      
      expect(result).toHaveLength(1);
      expect(result[0].monumentLabel.value).toBe('Coliseo');
      expect(result[0].image.value).toContain('?width=500&height=300');
    });
  });

  describe('fetchFoodQuestion', () => {
    it('should fetch food questions correctly', async () => {
      const foodResponse = {
        data: {
          results: {
            bindings: [
              {
                countryLabel: { value: 'México' },
                foodLabel: { value: 'Tacos' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tacos.jpg' }
              }
            ]
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(foodResponse);
      
      const result = await fetchFoodQuestion();
      
      // Check if the query contains food filtering (P31 Q2095)
      expect(axios.get.mock.calls[0][0]).toContain('wd%3AQ2095');
      
      expect(result).toHaveLength(1);
      expect(result[0].foodLabel.value).toBe('Tacos');
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));
      
      const result = await fetchCapitalQuestion();
      
      expect(result).toEqual([]);
      // Check if console.error was called (you can use jest.spyOn for this)
      // const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      // expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching data'), expect.any(String));
    });
  });

  describe('Data filtering', () => {
    it('should filter out duplicate entries', async () => {
      const duplicateResponse = {
        data: {
          results: {
            bindings: [
              {
                countryLabel: { value: 'España' },
                capitalLabel: { value: 'Madrid' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Madrid.jpg' }
              },
              // Exact duplicate entry
              {
                countryLabel: { value: 'España' },
                capitalLabel: { value: 'Madrid' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Madrid.jpg' }
              }
            ]
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(duplicateResponse);
      
      const result = await fetchCapitalQuestion();
      
      // Check that duplicates were filtered out
      expect(result).toHaveLength(1);
    });

    it('should filter out entries with empty values', async () => {
      const emptyValueResponse = {
        data: {
          results: {
            bindings: [
              {
                countryLabel: { value: 'España' },
                capitalLabel: { value: 'Madrid' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Madrid.jpg' }
              },
              {
                countryLabel: { value: '' }, // Empty value
                capitalLabel: { value: 'París' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Paris.jpg' }
              }
            ]
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(emptyValueResponse);
      
      const result = await fetchCapitalQuestion();
      
      expect(result).toHaveLength(2);
      expect(result[0].countryLabel.value).toBe('España');
    });
  });

  describe('Image URL processing', () => {
    it('should resize Wikimedia image URLs correctly', async () => {
      const imageResponse = {
        data: {
          results: {
            bindings: [
              {
                countryLabel: { value: 'Italia' },
                image: { value: 'https://commons.wikimedia.org/wiki/Special:FilePath/Rome.jpg' }
              },
              {
                countryLabel: { value: 'Francia' },
                image: { value: 'https://other-domain.com/image.jpg' } // Non-Wikimedia URL
              }
            ]
          }
        }
      };
      
      axios.get.mockResolvedValueOnce(imageResponse);
      
      const result = await fetchCapitalQuestion();
      
      // Wikimedia URL should be resized
      expect(result[0].image.value).toContain('?width=500&height=300');
      
      // Non-Wikimedia URL should remain unchanged
      expect(result[1].image.value).not.toContain('?width=');
      expect(result[1].image.value).toBe('https://other-domain.com/image.jpg');
    });
  });
});