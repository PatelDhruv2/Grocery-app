  import jwt from 'jsonwebtoken';

  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

  // Middleware to protect routes and verify the JWT token
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    console.log("indside the middleware",token);
    if (!token) {
      return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Decoded JWT:', decoded);
      // Manually set expected fields from decoded token
      req.user = {
        id: decoded.userId || null,
        email: decoded.email || null,
        username: decoded.username || null,
      };

      // Optionally set individual fields directly on req for convenience
      req.userId = req.user.id;
      req.userEmail = req.user.email;
    
      req.username = req.user.username;
      console.log("User ID from token:", req.userId);
      next(); // Proceed to the next middleware or route handler
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
  };

  export default authenticate;
