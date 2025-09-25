const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = auth;
