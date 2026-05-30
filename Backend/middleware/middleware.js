import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      id: decoded.userId || null,
      email: decoded.email || null,
      username: decoded.username || null,
    };

    req.userId = req.user.id;
    req.userEmail = req.user.email;
    req.username = req.user.username;

    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    return res.status(400).json({ error: "Invalid or expired token" });
  }
};

export default authenticate;
