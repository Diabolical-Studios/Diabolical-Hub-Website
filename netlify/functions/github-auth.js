const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');  // <-- Import UUID library to generate unique session IDs

const prisma = new PrismaClient();

exports.handler = async function (event, context) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const code = event.queryStringParameters.code;

  try {
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
    }, {
      headers: {
        accept: 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token: ', accessToken);  // Log the access token to see if it's retrieved correctly

    // Fetch the user's GitHub username
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`
      }
    });

    const username = userResponse.data.login;
    console.log('Fetched GitHub Username:', username);  // <-- Log the GitHub username


    // Load the list of authorized usernames
    const teamAssignmentsResponse = await axios.get('https://hub.diabolical.studio/authorized_users.json');
    const teamAssignments = teamAssignmentsResponse.data;

    let userTeam = null;
    for (const [team, users] of Object.entries(teamAssignments)) {
      if (users.includes(username)) {
        userTeam = team;
        break;
      }
    } let sessionID = uuidv4();  // <-- Generate a unique session ID
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);  // <-- Set session expiry to 24 hours from now

    // Store session in the database
    await prisma.session.create({
      data: {
        sessionId: sessionID,  // Use sessionID for sessionId field
        username: username,
        teamName: userTeam,
        expiryTime: expiryTime  // Changed from 'expiry' to 'expiryTime' based on your model
      }
    });


    let redirectUrl;
    if (userTeam) {
      redirectUrl = `https://hub.diabolical.studio/upload?team=${userTeam}&username=${username}`;
    } else {
      redirectUrl = 'https://hub.diabolical.studio';
    }

    return {
      statusCode: 303,
      headers: {
        'Set-Cookie': `sessionID=${sessionID}; HttpOnly; Secure; SameSite=Strict; Expires=${expiryTime.toUTCString()}`,  // <-- Set session ID in a secure, httpOnly cookie
        Location: redirectUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('Error: ', error.response ? error.response.data : error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ error: error.response ? error.response.data : error.message }),
    };
  }
};