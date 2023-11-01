// netlify/functions/upload.js

const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  
  // Path to your data.json
  const dataFilePath = path.join(__dirname, '../netlify/public/data.json');

  // Load existing data
  const rawData = await fs.readFile(dataFilePath, 'utf-8');
  const jsonData = JSON.parse(rawData);
  
  // Push new card data
  jsonData.cards.push(data);

  // Save back the data
  await fs.writeFile(dataFilePath, JSON.stringify(jsonData));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Data added successfully!" }),
  };
}
