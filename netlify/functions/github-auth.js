const axios = require('axios');

exports.handler = async function(event, context) {
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
        
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${accessToken}`
            }
        });

        // Modify this URL to your main website domain
        const redirectUrl = `https://diabolical.services/login-success?user=${encodeURIComponent(JSON.stringify(userResponse.data))}`;
        
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
