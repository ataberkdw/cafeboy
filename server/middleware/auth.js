const { getDb } = require('../database/init');

// Kafe bazlı authentication middleware
const requireKafeAuth = (req, res, next) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  if (!req.session.kafe_id) {
    return res.status(401).json({ error: 'Kafe seçimi gerekli' });
  }

  // Kafe_id'yi request'e ekle
  req.kafe_id = req.session.kafe_id;
  req.user_id = req.session.user_id;
  req.username = req.session.username;

  next();
};

// Kafe bazlı authentication (opsiyonel - public route'lar için)
const optionalKafeAuth = (req, res, next) => {
  if (req.session && req.session.isAuthenticated && req.session.kafe_id) {
    req.kafe_id = req.session.kafe_id;
    req.user_id = req.session.user_id;
    req.username = req.session.username;
  }
  next();
};

// Admin yetkisi kontrolü
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }

  if (!req.session.kafe_id) {
    return res.status(401).json({ error: 'Kafe seçimi gerekli' });
  }

  // Admin yetkisi kontrolü (isteğe bağlı - şimdilik sadece giriş yapmış kullanıcılar admin)
  req.kafe_id = req.session.kafe_id;
  req.user_id = req.session.user_id;
  req.username = req.session.username;

  next();
};

module.exports = {
  requireKafeAuth,
  optionalKafeAuth,
  requireAdmin
}; 