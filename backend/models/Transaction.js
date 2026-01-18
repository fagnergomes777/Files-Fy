const pool = require('../config/database');

class Transaction {
  static async create(userId, subscriptionId, amount, paymentMethod, description) {
    const query = `
      INSERT INTO transactions (user_id, subscription_id, amount, payment_method, description, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *;
    `;
    const result = await pool.query(query, [userId, subscriptionId, amount, paymentMethod, description]);
    return result.rows[0];
  }

  static async updateStatus(transactionId, status, stripePaymentId = null, mercadoPagoId = null) {
    const query = `
      UPDATE transactions 
      SET status = $2, stripe_payment_id = COALESCE($3, stripe_payment_id), 
          mercado_pago_id = COALESCE($4, mercado_pago_id), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const result = await pool.query(query, [transactionId, status, stripePaymentId, mercadoPagoId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM transactions WHERE id = $1;';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC;';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Transaction;
