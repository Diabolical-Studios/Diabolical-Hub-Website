const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { team_name, user_id } = JSON.parse(event.body);
  const API_BASE_URL = process.env.API_BASE_URL;
  const API_KEY = process.env.API_KEY;

  if (!team_name || !user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid input' }),
    };
  }

  try {
    // Create team using REST API
    const response = await axios.post(
      `${API_BASE_URL}/teams`,
      { team_name, user_id },
      {
        headers: { 'x-api-key': API_KEY },
      }
    );

    return {
      statusCode: 201,
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
};
