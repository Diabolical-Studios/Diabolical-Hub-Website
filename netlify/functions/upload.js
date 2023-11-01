// upload.js
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

exports.handler = async function (event, context) {

    console.log(JSON.stringify(event, null, 2));

    // Check for POST method
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const form = new formidable.IncomingForm();

    return new Promise((resolve, reject) => {
        form.parse(event.body, (err, fields, files) => {
            // Handle form parsing error
            if (err) reject({ statusCode: 500, body: JSON.stringify(err) });

            // Destructure form fields
            const { teamName, gameIcon, gameBanner, gameName, gameDescription } = fields;

            // Construct card data object
            const cardData = { teamName, gameIcon, gameBanner, gameName, gameDescription };

            // Resolve file path to data.json
            const dataFilePath = path.resolve(__dirname, '../data.json');

            // Read existing data from data.json
            const existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));

            // Add new card data to existing data
            existingData.cards.push(cardData);

            // Write updated data back to data.json
            fs.writeFileSync(dataFilePath, JSON.stringify(existingData));

            // Resolve promise with success response
            resolve({
                statusCode: 200,
                body: JSON.stringify({ success: true }),
            });
        });
    });
};
