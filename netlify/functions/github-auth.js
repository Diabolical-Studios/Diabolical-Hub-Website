const axios = require('axios');
const mysql = require('mysql2/promise'); // MySQL integration
const { v4: uuidv4 } = require('uuid');

exports.handler = async function (event) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const DB_HOST = process.env.DB_HOST;
  const DB_USER = process.env.DB_USER;
  const DB_PASSWORD = process.env.DB_PASSWORD;
  const DB_NAME = process.env.DB_NAME;

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

    // Connect to database and store or update the user
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    await connection.execute(
      `INSERT INTO users (github_id, username, email) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE username=VALUES(username), email=VALUES(email)`,
      [github_id, username, email]
    );

    await connection.end();

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
      body: JSON.stringify({ error: error.message }),
    };
  }
};
