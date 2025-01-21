const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { game_id, team_name, game_name, version, description, background_image_url, team_icon_url } = JSON.parse(event.body);
  const API_BASE_URL = process.env.API_BASE_URL;
  const API_KEY = process.env.API_KEY;

  if (!game_name || !team_name || !version) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  try {
    // Validate team existence via REST API
    const teamResponse = await axios.get(`${API_BASE_URL}/teams?name=${team_name}`, {
      headers: { 'x-api-key': API_KEY },
    });

    if (!teamResponse.data || !teamResponse.data.team_id) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Team not found' }),
      };
    }

    const team_id = teamResponse.data.team_id;

    // Add game via REST API
    await axios.post(
      `${API_BASE_URL}/games`,
      { game_id, team_name, game_name, version, description, background_image_url, team_icon_url },
      {
        headers: { 'x-api-key': API_KEY },
      }
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Game uploaded successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
};
