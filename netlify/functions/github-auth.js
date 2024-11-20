const axios = require('axios');
const { v4: uuidv4 } = require('uuid'); // Import UUID library to generate unique session IDs

exports.handler = async function (event, context) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const code = event.queryStringParameters.code;

  console.log('Starting GitHub OAuth process...');
  console.log('CLIENT_ID:', CLIENT_ID ? 'Provided' : 'Not provided');
  console.log('CLIENT_SECRET:', CLIENT_SECRET ? 'Provided' : 'Not provided');
  console.log('Code:', code);

  if (!code) {
    console.error('Error: Missing "code" parameter in the request');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing "code" parameter in the request' }),
    };
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Error: Missing GitHub client credentials');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing GitHub client credentials' }),
    };
  }

  try {
    console.log('Fetching GitHub access token...');
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error('Access token not received from GitHub');
    }
    console.log('Access Token Retrieved:', accessToken);

    console.log('Fetching GitHub user information...');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const username = userResponse.data.login;
    console.log('GitHub Username:', username);

    console.log('Fetching authorized users...');
    const teamAssignmentsResponse = await axios.get(
      'https://hub.diabolical.studio/authorized_users.json'
    );
    const teamAssignments = teamAssignmentsResponse.data;

    let userTeam = null;
    console.log('Authorized Users:', teamAssignments);
    for (const [team, users] of Object.entries(teamAssignments)) {
      if (users.includes(username)) {
        userTeam = team;
        break;
      }
    }
    console.log('User Team:', userTeam || 'No team found');

    const sessionID = uuidv4();
    console.log('Generated Session ID:', sessionID);

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);
    console.log('Session Expiry Time:', expiryTime);

    const redirectUrl = userTeam
      ? `https://hub.diabolical.studio/upload?team=${userTeam}&username=${username}`
      : 'https://hub.diabolical.studio';
    console.log('Redirect URL:', redirectUrl);

    return {
      statusCode: 303,
      headers: {
        'Set-Cookie': `sessionID=${sessionID}; HttpOnly; Secure; SameSite=Strict; Expires=${expiryTime.toUTCString()}`,
        Location: redirectUrl,
      },
      body: '',
    };
  } catch (error) {
    console.error('Error occurred:', error.response ? error.response.data : error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ error: error.response ? error.response.data : error.message }),
    };
  }
};
