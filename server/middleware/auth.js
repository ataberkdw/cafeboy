const requireAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
  }
};

const optionalAuth = (req, res, next) => {
  if (req.session && req.session.adminId) {
    req.isAuthenticated = true;
  } else {
    req.isAuthenticated = false;
  }
  next();
};

module.exports = { requireAuth, optionalAuth }; 