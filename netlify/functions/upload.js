const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const data = JSON.parse(event.body);

    // Get the username and team from the request
    const username = data.username;
    console.log('Username from request:', username); // <-- Add this line to print the username
    const teamFromUrl = event.queryStringParameters.team;

    // Identify the team of the user
    const teamName = await getTeamForUsername(username);


    if (!teamName || teamName !== teamFromUrl) {
        return {
            statusCode: 403,  // Forbidden
            body: JSON.stringify({ error: 'User is not authorized to upload for this team.' }),
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
    return null; // Return null if the username doesn't belong to any team
}
