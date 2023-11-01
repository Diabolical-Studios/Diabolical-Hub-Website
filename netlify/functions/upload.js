// upload.js
const fs = require('fs');
const path = require('path');

exports.handler = async function (event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { teamName, gameIcon, gameBanner, gameName, gameDescription, buildFile } = JSON.parse(event.body);

    // TODO: Validate the data and save the uploaded file

    // Save card data to a JSON file (simplified database)
    const cardData = {
        teamName,
        gameIcon,
        gameBanner,
        gameName,
        gameDescription,
    };
    const dataFilePath = path.resolve(__dirname, 'data.json');
    const existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    existingData.cards.push(cardData);
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData));

    return {
        statusCode: 200,
        body: JSON.stringify({ success: true }),
    };
};
