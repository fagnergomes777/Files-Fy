const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Login com Google
router.post('/login-google', AuthController.loginWithGoogle);

// Verificar token
router.post('/verify', AuthController.verifyToken);

// Logout
router.post('/logout', AuthController.logout);

// Login de Teste (para desenvolvimento sem credenciais Google)
router.post('/test-login', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    const Subscription = require('../models/Subscription');
    const Session = require('../models/Session');

    const { email, name } = req.body;
    
    if (!email || !name) {
      return res.status(400).json({ error: 'Email e nome são obrigatórios' });
    }

    // Buscar ou criar usuário de teste
    let user = await User.findByEmail(email);
    
    if (!user) {
      user = await User.create(`test_${Date.now()}`, email, name, 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name));
      await Subscription.create(user.id, 'FREE');
    }

    // Gerar JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    // Salvar sessão
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await Session.create(user.id, jwtToken, null, expiresAt);

    // Buscar assinatura
    const subscription = await Subscription.findByUserId(user.id);

    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar_url,
        plan: subscription.plan_type,
      },
    });
  } catch (error) {
    console.error('Erro ao fazer login de teste:', error);
    res.status(500).json({ error: 'Erro ao fazer login: ' + error.message });
  }
});

module.exports = router;
