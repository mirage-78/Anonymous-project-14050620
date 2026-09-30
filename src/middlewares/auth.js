exports.isAuthenticated = (req, res, next) => {
  if (req.session?.user?.id) {
    return next();
  }
  res.status(401).json({ success: false, message: 'ابتدا وارد شوید' });
};

exports.isAdmin = (req, res, next) => {
  if (req.session?.user?.role === 'ADMIN') {
    return next();
  }
  res.status(403).json({ success: false, message: 'دسترسی فقط برای مدیران' });
};