const express = require('express');
const PaymentController = require('../controllers/PaymentController');

const router = express.Router();

// Criar intenção de pagamento
router.post('/intent', PaymentController.createPaymentIntent);

// Webhook do Stripe
router.post('/webhook', express.raw({type: 'application/json'}), PaymentController.handlePaymentWebhook);

// Criar transação
router.post('/transaction', PaymentController.createTransaction);

// Histórico de transações
router.get('/history/:userId', PaymentController.getTransactionHistory);

module.exports = router;
