const { PrismaClient } = require('@prisma/client');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);

  const prisma = new PrismaClient();

  try {
    const result = await prisma.card.create({ data: data });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Data uploaded successfully', result: result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save data' }),
    };
  }
};
