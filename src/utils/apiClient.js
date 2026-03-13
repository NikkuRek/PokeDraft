const BASE_URL = 'https://pokeapi.co/api/v2/pokemon/?offset=1&limit=2000';

const apiClient = {
  get: async (path) => {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
};

module.exports = apiClient;