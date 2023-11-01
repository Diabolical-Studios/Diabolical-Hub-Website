const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

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
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
                Authorization: `token ${accessToken}`
            }
        });

        const username = userResponse.data.login;

        // Check for the user's authorization against the team list
        const teamName = await getTeamForUsername(username);

        if (!teamName) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'User is not authorized to upload for any team.' }),
            };
        }

        try {
            // Check if a card for that team already exists
            const existingCard = await prisma.card.findUnique({
                where: { teamName: teamName }
            });

            let result;
            if (existingCard) {
                // Update the existing card
                result = await prisma.card.update({
                    where: { teamName: teamName },
                    data: data
                });
            } else {
                // Create a new card
                result = await prisma.card.create({ data: data });
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Data uploaded successfully', result: result }),
            };

        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message }),
            };
        }
    };

    async function getTeamForUsername(username) {
        try {
            const response = await axios.get('https://diabolical.services/authorized_users.json');
            const teamAssignments = response.data;

            for (const [team, users] of Object.entries(teamAssignments)) {
                if (users.includes(username)) {
                    return team;
                }
            }
        } catch (error) {
            console.error('Error fetching team assignments:', error);
            throw error;
        }
        return null;
    }