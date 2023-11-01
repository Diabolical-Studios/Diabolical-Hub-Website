const axios = require('axios');
const CLIENT_ID = "f64b9bcd2b2d41051d93";
const CLIENT_SECRET = "1fa363a874c7ba1fab001b12d31dde97ee76cf2c";

exports.handler = async function(event, context) {
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
