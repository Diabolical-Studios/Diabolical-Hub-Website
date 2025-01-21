const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

exports.handler = async function (event) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const API_BASE_URL = process.env.API_BASE_URL; // REST API base URL

  const code = event.queryStringParameters.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing "code" parameter' }),
    };
  }

  try {
    // Exchange code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      {
        headers: { accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    const { id: github_id, login: username, email } = userResponse.data;

    // Create or update the user using the REST API
    await axios.post(`${API_BASE_URL}/users`, {
      github_id,
      username,
      email,
    });

    // Generate session ID and set it in cookies
    const sessionID = uuidv4();
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);

    const redirectUrl = `https://hub.diabolical.studio/dashboard?username=${username}`;
    return {
      statusCode: 303,
      headers: {
        'Set-Cookie': `sessionID=${sessionID}; HttpOnly; Secure; SameSite=Strict; Expires=${expiryTime.toUTCString()}`,
        Location: redirectUrl,
      },
      body: '',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.response?.data || error.message }),
    };
  }
};
