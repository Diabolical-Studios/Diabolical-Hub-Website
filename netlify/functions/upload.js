const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

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
    
    // Fetch the list of teams the user is authorized to upload for
    const authorizedTeams = await getTeamsForUsername(username);
    
    // Check if the teamName from the request is in the list of authorized teams for the user
    if (!authorizedTeams.includes(data.teamName)) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: 'User is not authorized to upload for this team.' }),
        };
    }

    // Check if the teamName from the request is in the list of authorized teams for the user
    if (!authorizedTeams.includes(data.teamName)) {
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
                where: { id: existingCard.id },
                data: data
            });
        } else {
            result = await prisma.card.create({
                data: data
            });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Data uploaded successfully', result: result }),
        };

    } catch (error) {
        console.error('Error in processing:', error);
        // Include more descriptive error messages depending on the error type
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
        };
    }
};

async function getTeamsForUsername(username) {
    try {
        const response = await axios.get('https://diabolical.services/authorized_users.json');
        const teamAssignments = response.data;

        console.log('Team Assignments:', teamAssignments);

        // This will hold all the teams the user belongs to
        let userTeams = [];

        // Iterate through the teams and add to userTeams if the user is in the team
        for (const [team, users] of Object.entries(teamAssignments)) {
            if (users.includes(username)) {
                userTeams.push(team);
            }
        }

        return userTeams; // Return the list of teams

    } catch (error) {
        console.error('Error in getTeamsForUsername:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}
