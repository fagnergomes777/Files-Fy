const pool = require('../config/database');

class Subscription {
  static async create(userId, planType = 'FREE') {
    const query = `
      INSERT INTO subscriptions (user_id, plan_type, is_active)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (user_id) DO UPDATE 
      SET plan_type = EXCLUDED.plan_type, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, planType]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1;';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async upgradeToPro(userId, expiresAt) {
    const query = `
      UPDATE subscriptions 
      SET plan_type = 'PRO', expires_at = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, expiresAt]);
    return result.rows[0];
  }

  static async downgradeToFree(userId) {
    const query = `
      UPDATE subscriptions 
      SET plan_type = 'FREE', expires_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = Subscription;
