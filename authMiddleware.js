// authMiddleware.js
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    next();
  };
  
  const requireAdmin = (req, res, next) => {
    if (!req.session.userId || req.session.userRole !== 'admin') {
      return res.redirect('/login');
    }
    next();
  };
  
  module.exports = {
    requireAuth,
    requireAdmin,
  };
  