const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const Provider = require("../model/provider");

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        // Find provider by username
        const provider = await Provider.findOne({
          username: username,
          isVerified: true,
        });

        if (!provider) {
          return done(null, false, {
            message: "Invalid username or provider not verified",
          });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, provider.password);

        if (!isMatch) {
          return done(null, false, { message: "Invalid password" });
        }

        return done(null, provider);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((provider, done) => {
  done(null, provider._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const provider = await Provider.findById(id).select("-password");
    done(null, provider);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
