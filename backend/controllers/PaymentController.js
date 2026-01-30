const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

class PaymentController {
  static async createPaymentIntent(req, res) {
    try {
      const { userId, planType, paymentMethod } = req.body;
      
      if (!userId || !planType) return res.status(400).json({ error: 'Dados incompletos' });

      const amount = planType === 'PRO' ? 2990 : 0;
      if (amount === 0) return res.status(400).json({ error: 'Plano FREE não requer pagamento' });

      // Criar pagamento no banco (sem Stripe se chave inválida)
      const payment = await Payment.create(userId, null, amount, null, 'pendente');

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey === 'sk_test_xxx' || stripeKey.includes('USE_YOUR')) {
        // Simular aprovação automática
        const updatedPayment = await Payment.updateStatus(payment.id, 'pago');
        
        const subscription = await Subscription.updatePlan(userId, 'PRO');
        
        return res.json({ 
          success: true,
          message: 'Pagamento processado com sucesso (simulado)',
          clientSecret: 'sim_' + payment.id,
          paymentId: payment.id,
          payment: updatedPayment,
          subscription: subscription
        });
      }

      // Usar Stripe se chave válida
      const stripe = require('stripe')(stripeKey);
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: 'brl',
        payment_method_types: ['card', 'boleto', 'pix'],
        metadata: { userId, paymentId: payment.id }
      });

      res.json({ 
        success: true, 
        message: 'Intent de pagamento criado',
        clientSecret: intent.client_secret, 
        paymentId: payment.id 
      });
    } catch (error) {
      console.error('❌ Erro payment intent:', error.message);
      res.status(500).json({ error: 'Erro ao criar pagamento: ' + error.message });
    }
  }

  static async webhook(req, res) {
    try {
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey || stripeKey === 'sk_test_xxx') {
        return res.json({ received: true, warning: 'Stripe não configurado' });
      }

      const stripe = require('stripe')(stripeKey);
      const event = req.body;
      
      if (event.type === 'payment_intent.succeeded') {
        const { metadata, id: stripeId } = event.data.object;
        const payment = await Payment.findById(metadata.paymentId);
        
        if (payment) {
          await Payment.updateStatus(payment.id, 'pago');
          await Subscription.updatePlan(metadata.userId, 'PRO');
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error('Erro webhook:', error.message);
      res.status(500).json({ error: 'Webhook error' });
    }
  }
}

module.exports = PaymentController;
