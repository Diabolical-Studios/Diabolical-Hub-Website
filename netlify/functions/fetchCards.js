const axios = require('axios');

exports.handler = async () => {
  const API_BASE_URL = process.env.API_BASE_URL; // Use environment variable for the base URL
  const GAMES_URL = `${API_BASE_URL}/rest-api/games`; // Construct the endpoint URL dynamically

  try {
    const response = await axios.get(GAMES_URL);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch games data. Status: ${response.status}`);
    }

    const games = response.data;

    // Transform the data if needed (e.g., filter, map fields), or return it as is
    return {
      statusCode: 200,
      body: JSON.stringify(games),
    };
  } catch (error) {
    console.error("Error fetching games:", error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch games data' }),
    };
  }
};
