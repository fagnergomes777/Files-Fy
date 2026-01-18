const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class PaymentController {
  static async createPaymentIntent(req, res) {
    try {
      const { userId, planType, paymentMethod } = req.body;

      if (!userId || !planType || !paymentMethod) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      // Definir valor baseado no plano (mensalidade PRO)
      const amount = planType === 'PRO' ? 2990 : 0; // R$ 29,90 em centavos

      if (amount === 0) {
        return res.status(400).json({ error: 'Plano inválido para pagamento' });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      let paymentIntentData = {
        amount,
        currency: 'brl',
        metadata: { userId, planType },
      };

      if (paymentMethod === 'pix') {
        // Para PIX via Stripe
        paymentIntentData.payment_method_types = ['klarna'];
        paymentIntentData.description = `Upgrade para PRO - ${user.email}`;
      } else if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
        paymentIntentData.payment_method_types = ['card'];
        paymentIntentData.description = `Upgrade para PRO (${paymentMethod}) - ${user.email}`;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error('Erro ao criar payment intent:', error);
      res.status(500).json({ error: 'Erro ao processar pagamento' });
    }
  }

  static async handlePaymentWebhook(req, res) {
    try {
      const event = req.body;

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object;
          const { userId, planType } = paymentIntent.metadata;

          // Atualizar assinatura
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias
          await Subscription.upgradeToPro(parseInt(userId), expiresAt);

          // Registrar transação
          const subscription = await Subscription.findByUserId(parseInt(userId));
          await Transaction.updateStatus(
            paymentIntent.id,
            'completed',
            paymentIntent.id
          );

          console.log(`✓ Usuário ${userId} fez upgrade para PRO`);
          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object;
          console.log(`✗ Pagamento falhou para: ${paymentIntent.id}`);
          break;
        }

        default:
          console.log(`Evento não tratado: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(400).json({ error: 'Webhook error' });
    }
  }

  static async createTransaction(req, res) {
    try {
      const { userId, planType, paymentMethod } = req.body;

      const amount = planType === 'PRO' ? 29.90 : 0;

      const subscription = await Subscription.findByUserId(userId);
      const transaction = await Transaction.create(
        userId,
        subscription?.id,
        amount,
        paymentMethod,
        `Upgrade para ${planType}`
      );

      res.json({
        success: true,
        transaction: transaction,
      });
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      res.status(500).json({ error: 'Erro ao registrar transação' });
    }
  }

  static async getTransactionHistory(req, res) {
    try {
      const { userId } = req.params;

      const transactions = await Transaction.findByUserId(parseInt(userId));

      res.json({
        success: true,
        transactions,
      });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro ao buscar transações' });
    }
  }
}

module.exports = PaymentController;
