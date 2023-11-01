// upload.js
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

exports.handler = async function (event, context) {
    // Check for POST method
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const contentType = event.headers['content-type'];
    if (!contentType) {
        return { statusCode: 400, body: 'Invalid content type' };
    }

    return new Promise((resolve, reject) => {
        const busboy = new Busboy({ headers: { 'content-type': contentType } });

        let fields = {};
        let files = {};

        busboy.on('field', (fieldname, value) => {
            fields[fieldname] = value;
        });

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const uploadPath = path.join(__dirname, 'uploads', filename);
            file.pipe(fs.createWriteStream(uploadPath));
            files[fieldname] = { filename, encoding, mimetype };
        });

        busboy.on('finish', () => {
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

        busboy.on('error', error => reject({ statusCode: 500, body: JSON.stringify(error) }));

        busboy.write(event.body, 'binary');
        busboy.end();
    });
};
