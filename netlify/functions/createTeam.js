const mysql = require('mysql2/promise');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const { team_name, user_id } = JSON.parse(event.body);

  if (!team_name || !user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid input' }),
    };
  }

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Check if team already exists
    const [existingTeam] = await connection.execute(
      `SELECT team_id FROM teams WHERE team_name = ?`,
      [team_name]
    );

    if (existingTeam.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Team name already taken' }),
      };
    }

    // Create team and assign the user as the owner
    const [result] = await connection.execute(
      `INSERT INTO teams (team_name, owner_id) VALUES (?, ?)`,
      [team_name, user_id]
    );

    const team_id = result.insertId;

    await connection.execute(
      `INSERT INTO team_membership (user_id, team_id, role) VALUES (?, ?, 'owner')`,
      [user_id, team_id]
    );

    await connection.end();

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Team created successfully', team_id }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
