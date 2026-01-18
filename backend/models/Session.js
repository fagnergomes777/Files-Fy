const pool = require('../config/database');

class Session {
  static async create(userId, token, googleRefreshToken, expiresAt) {
    const query = `
      INSERT INTO sessions (user_id, token, google_refresh_token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, token, googleRefreshToken, expiresAt]);
    return result.rows[0];
  }

  static async findByToken(token) {
    const query = 'SELECT * FROM sessions WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP;';
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async deleteByUserId(userId) {
    const query = 'DELETE FROM sessions WHERE user_id = $1;';
    await pool.query(query, [userId]);
  }

  static async deleteByToken(token) {
    const query = 'DELETE FROM sessions WHERE token = $1;';
    await pool.query(query, [token]);
  }
}

module.exports = Session;
