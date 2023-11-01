const axios = require('axios');
const queryString = require('querystring');

exports.handler = async function (event, context) {
    const CLIENT_ID = '2ZQbOdViSPl7sGF3HTAY3g4f5WuuuErWN87Jre8evgDaKC6dSdCbBum835gS7H_-';
    const REDIRECT_URI = 'https://noctisgame.com/.netlify/functions/patreon-auth';

    // If it's the start of the auth
    if (event.httpMethod === "GET" && !event.queryStringParameters.code) {
        const patreonURL = `https://www.patreon.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
        return {
            statusCode: 302,
            headers: {
                Location: patreonURL
            }
        };
    }

    // If it's the callback
    if (event.httpMethod === "GET" && event.queryStringParameters.code) {
        const CLIENT_SECRET = 'buryt7Ox5xCiyaGzxEXL_XKBovayQd-ZvdeRPFfRrQP68TEm4Jnpx47LkmdRsVR1'; 
        const code = event.queryStringParameters.code;

        try {
            const response = await axios.post('https://www.patreon.com/api/oauth2/token', queryString.stringify({
                code: code,
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: REDIRECT_URI
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            const accessToken = response.data.access_token;
            const userResponse = await axios.get('https://www.patreon.com/api/oauth2/v2/identity?include=memberships.currently_entitled_tiers', {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            
            const userData = userResponse.data;
            const isPatron = (userData && userData.included && userData.included.length > 0);
            const cookieValue = `isPatron=${isPatron}; path=/; Secure;`;

            return {
                statusCode: 302,
                headers: {
                    Location: 'https://noctisgame.com',
                    'Set-Cookie': cookieValue
                }
            };
        } catch (error) {
            console.error("Error:", error.response ? error.response.data : error.message);
            return {
                statusCode: 500,
                body: 'Error authenticating with Patreon.'
            };
        }
    }
};
