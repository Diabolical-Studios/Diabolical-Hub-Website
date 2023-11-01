const { PrismaClient } = require('@prisma/client');

exports.handler = async () => {
  const prisma = new PrismaClient();

  try {
    const cards = await prisma.card.findMany();
    return {
      statusCode: 200,
      body: JSON.stringify(cards),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch cards data' }),
    };
  }
};
