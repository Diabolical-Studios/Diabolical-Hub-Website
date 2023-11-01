// github-auth.js
const axios = require('axios');
const CLIENT_ID = "f64b9bcd2b2d41051d93";
const CLIENT_SECRET = "61922d8a7284c5e4c73b0a1637e93cb150ec08a3";

exports.handler = async function(event, context) {
    const code = event.queryStringParameters.code;
    
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
    
    // Now use the access token to fetch the user's GitHub profile
    const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
            Authorization: `token ${accessToken}`
        }
    });
    
    return {
        statusCode: 200,
        body: JSON.stringify(userResponse.data),
    };
};