const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Session = require('../models/Session');

// Inicializar client apenas se tiver credenciais
const client = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

class AuthController {
  static async loginWithGoogle(req, res) {
    try {
      const { token, refreshToken } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token não fornecido' });
      }

      // Verificar se Google está configurado
      if (!client || !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('USE_YOUR')) {
        return res.status(400).json({ 
          error: 'Google OAuth não está configurado. Veja CONFIGURACAO_GOOGLE_OAUTH.md para instruções.' 
        });
      }

      // Verificar token do Google
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name;
      const picture = payload.picture;

      // Buscar ou criar usuário
      let user = await User.findByGoogleId(googleId);
      
      if (!user) {
        user = await User.create(googleId, email, name, picture);
        // Criar assinatura FREE padrão
        await Subscription.create(user.id, 'FREE');
      }

      // Gerar JWT
      const jwtToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );

      // Salvar sessão
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
      await Session.create(user.id, jwtToken, refreshToken, expiresAt);

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
      console.error('Erro ao fazer login com Google:', error);
      res.status(401).json({ error: 'Erro ao autenticar com Google: ' + error.message });
    }
  }

  static async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      const session = await Session.findByToken(token);

      if (!session) {
        return res.status(401).json({ error: 'Sessão inválida ou expirada' });
      }

      const user = await User.findById(session.user_id);
      const subscription = await Subscription.findByUserId(user.id);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar_url,
          plan: subscription.plan_type,
        },
      });
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      res.status(500).json({ error: 'Erro ao verificar token' });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        await Session.deleteByToken(token);
      }

      res.json({ success: true, message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      res.status(500).json({ error: 'Erro ao fazer logout' });
    }
  }
}

module.exports = AuthController;
