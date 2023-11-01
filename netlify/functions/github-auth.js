const axios = require('axios');

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

    // Load the list of authorized usernames
    const teamAssignmentsResponse = await axios.get('https://diabolical.services/authorized_users.json');
    const teamAssignments = JSON.parse(teamAssignmentsResponse.data);

    let userTeam = null;
    for (const [team, users] of Object.entries(teamAssignments)) {
      if (users.includes(username)) {
        userTeam = team;
        break;
      }
    }


    let redirectUrl;
    if (userTeam) {
      // If the user is part of a team, redirect to their team's upload page
      redirectUrl = `https://diabolical.services/upload.html?team=${userTeam}`;
    } else {
      // Otherwise, redirect to the homepage
      redirectUrl = 'https://diabolical.services';
    }


    return {
      statusCode: 303,  // HTTP status code for "See Other"
      headers: {
        Location: redirectUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('Error: ', error.response ? error.response.data : error.message);  // Log the full error response
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ error: error.response ? error.response.data : error.message }),
    };
  }
};
