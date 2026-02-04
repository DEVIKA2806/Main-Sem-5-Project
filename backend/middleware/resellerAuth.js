module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No reseller token" });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  if (decoded.role !== 'reseller')
    return res.status(403).json({ message: "Reseller only" });

  req.reseller = decoded;
  next();
};
