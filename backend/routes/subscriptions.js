const express = require('express');
const SubscriptionController = require('../controllers/SubscriptionController');

const router = express.Router();

// Obter assinatura do usuário
router.get('/:userId', SubscriptionController.getSubscription);

// Fazer upgrade para PRO
router.post('/:userId/upgrade', SubscriptionController.upgradePlan);

// Downgrade para FREE
router.post('/:userId/downgrade', SubscriptionController.downgradePlan);

// Verificar assinaturas expiradas
router.post('/check-expired', SubscriptionController.checkExpiredSubscriptions);

module.exports = router;
