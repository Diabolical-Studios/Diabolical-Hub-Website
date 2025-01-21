const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { game_name, description, team_name, team_icon_url, background_image_url, version } = JSON.parse(event.body);

  if (!game_name || !team_name || !version) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    };
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Validate team existence
    const [team] = await connection.execute(
      `SELECT team_id FROM teams WHERE team_name = ?`,
      [team_name]
    );

    if (team.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Team not found' }),
      };
    }

    const team_id = team[0].team_id;

    // Insert the game into the database
    await connection.execute(
      `INSERT INTO games (game_name, description, team_icon_url, background_image_url, team_name, version)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [game_name, description, team_icon_url, background_image_url, team_name, version]
    );

    await connection.end();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Game uploaded successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
