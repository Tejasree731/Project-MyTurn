const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Google OAuth Routes
const isConfigured = () => {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  const isCidPlaceholder = cid && cid.includes('your_google_client_id');
  const isSecretPlaceholder = secret && secret.includes('your_google_client_secret');
  return cid && secret && !isCidPlaceholder && !isSecretPlaceholder;
};

const googleAuth = (req, res, next) => {
  if (!isConfigured()) {
    return res.status(501).json({ 
      message: "Google Login is not configured. Please replace the placeholders in your .env file with actual Google Client credentials." 
    });
  }
  const role = req.query.role === 'admin' ? 'admin' : 'user';
  passport.authenticate("google", { scope: ["profile", "email"], session: false, state: role })(req, res, next);
};

const googleCallback = (req, res, next) => {
  if (!isConfigured()) {
    return res.status(501).json({ message: "Google Login is not configured." });
  }
  passport.authenticate("google", { session: false, failureRedirect: "/login" })(req, res, next);
};

router.get("/google", googleAuth);

router.get(
  "/google/callback",
  googleCallback,
  (req, res) => {
    // Generate JWT for the authenticated user
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    };

    // Redirect to frontend with token and user data
    const userData = encodeURIComponent(JSON.stringify(user));
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      
    res.redirect(`${frontendUrl}/auth?token=${token}&user=${userData}`);
  }
);

module.exports = router;