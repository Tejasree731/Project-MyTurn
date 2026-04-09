const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const Admin = require("../models/Admin");

module.exports = function(passport) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.BACKEND_URL 
            ? `${process.env.BACKEND_URL}/api/auth/google/callback` 
            : "/api/auth/google/callback",
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const role = req.query.state === 'admin' ? 'admin' : 'user';

            if (role === 'admin') {
              let admin = await Admin.findOne({ googleId: profile.id });

              if (!admin) {
                admin = await Admin.findOne({ email: profile.emails[0].value });

                if (admin) {
                  admin.googleId = profile.id;
                  await admin.save();
                } else {
                  admin = await Admin.create({
                    name: profile.displayName || profile.emails[0].value.split("@")[0],
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    organizationName: profile.displayName ? `${profile.displayName}'s Organization` : "My Organization",
                    role: "admin",
                  });
                }
              }
              return done(null, admin);
            } else {
              let user = await User.findOne({ googleId: profile.id });

              if (!user) {
                // Check if user exists with the same email
                user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                  // Update existing user with Google ID
                  user.googleId = profile.id;
                  await user.save();
                } else {
                  // Create new user
                  user = await User.create({
                    username: profile.displayName || profile.emails[0].value.split("@")[0],
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    role: "user",
                  });
                }
              }
              return done(null, user);
            }

            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  } else {
    console.warn('Google OAuth credentials missing. Google Login disabled.');
  }

  passport.serializeUser((user, done) => {
    done(null, { id: user.id, role: user.role });
  });

  passport.deserializeUser(async (obj, done) => {
    try {
      let user;
      if (obj.role && obj.role.includes('admin')) {
        user = await Admin.findById(obj.id);
      } else {
        user = await User.findById(obj.id || obj);
      }
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};