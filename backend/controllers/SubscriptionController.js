const Subscription = require('../models/Subscription');
const User = require('../models/User');

class SubscriptionController {
  static async getSubscription(req, res) {
    try {
      const { userId } = req.params;

      const subscription = await Subscription.findByUserId(parseInt(userId));
      const user = await User.findById(parseInt(userId));

      if (!subscription || !user) {
        return res.status(404).json({ error: 'Assinatura ou usuário não encontrado' });
      }

      res.json({
        success: true,
        subscription: {
          id: subscription.id,
          userId: subscription.user_id,
          planType: subscription.plan_type,
          isActive: subscription.is_active,
          startsAt: subscription.started_at,
          expiresAt: subscription.expires_at,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      res.status(500).json({ error: 'Erro ao buscar assinatura' });
    }
  }

  static async upgradePlan(req, res) {
    try {
      const { userId } = req.params;

      const subscription = await Subscription.upgradeToPro(
        parseInt(userId),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      );

      res.json({
        success: true,
        message: 'Plano atualizado para PRO com sucesso',
        subscription,
      });
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error);
      res.status(500).json({ error: 'Erro ao fazer upgrade do plano' });
    }
  }

  static async downgradePlan(req, res) {
    try {
      const { userId } = req.params;

      const subscription = await Subscription.downgradeToFree(parseInt(userId));

      res.json({
        success: true,
        message: 'Plano revertido para FREE',
        subscription,
      });
    } catch (error) {
      console.error('Erro ao fazer downgrade:', error);
      res.status(500).json({ error: 'Erro ao fazer downgrade do plano' });
    }
  }

  static async checkExpiredSubscriptions(req, res) {
    try {
      const pool = require('../config/database');
      
      // Downgrade automático de planos expirados
      await pool.query(`
        UPDATE subscriptions 
        SET plan_type = 'FREE', is_active = FALSE
        WHERE plan_type = 'PRO' AND expires_at < CURRENT_TIMESTAMP
      `);

      res.json({ success: true, message: 'Verificação concluída' });
    } catch (error) {
      console.error('Erro ao verificar assinaturas expiradas:', error);
      res.status(500).json({ error: 'Erro na verificação' });
    }
  }
}

module.exports = SubscriptionController;
