const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    console.log('Received Event:', event);

    const sessionCookie = event.headers.cookie && event.headers.cookie.match(/sessionID=([^;]+);?/);
    const sessionID = sessionCookie && sessionCookie[1];

    if (!sessionID) {
        return { statusCode: 401, body: 'No session ID provided.' };
    }

    const session = await prisma.session.findUnique({
        where: { sessionId: sessionID }
    });

    if (!session || new Date() > session.expiryTime) {
        return { statusCode: 401, body: 'Invalid or expired session.' };
    }

    const data = JSON.parse(event.body);

    const username = session.username;
    console.log('Fetched GitHub Username:', username);

    const teamNameInSession = session.teamName; // Directly fetch team from session
    console.log('Fetched GitHub Team from session:', teamNameInSession);

    const authorizedTeamName = await getTeamForUsername(username);

    if (!authorizedTeamName || authorizedTeamName !== teamNameInSession) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'User is not authorized to upload for this team.' }),
        };
    }

    try {
        const existingCard = await prisma.card.findFirst({
            where: { teamName: teamNameInSession }
        });

        let result;
        if (existingCard) {
            result = await prisma.card.update({
                where: { id: existingCard.id }, // Use the `id` of the existing card for the update
                data: data
            });
        } else {
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

        console.log('Team Assignments:', teamAssignments); // Additional logging

        for (const [team, users] of Object.entries(teamAssignments)) {
            console.log(`Checking team: ${team} for user: ${username}`); // Additional logging
            if (users.includes(username)) {
                console.log(`Authorized team for user: ${username} is ${team}`); // Additional logging
                return team;
            }
        }
    } catch (error) {
        console.error('Error fetching team assignments:', error);
        throw error;
    }
    console.log(`No authorized team found for user: ${username}`); // Additional logging
    return null; // Return null if the username doesn't belong to any team
}
