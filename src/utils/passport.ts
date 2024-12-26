import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from 'dotenv';  
import User from "../models/user";
config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
    scope: ["profile", "email"],
    passReqToCallback: true
  }, async (req, accessToken:any, refreshToken:any, profile:any, done:any)=> {
    try{      
      const user_email = profile.emails[0].value;
      let user = await User.findOne({email : user_email}).exec();
      
      if(!user){
        try {
          user = await User.create({
            email:user_email,
            password: null,
            firstname: profile.name.familyName,
            lastname: profile.name.givenName,
            avatar: profile.photos?.[0]?.value,
            is_google_account : true
        });
        }catch {
          throw Error('google error return');
        }
      }
      return done(null, user);
    } catch(err){
      done(err,null)
    }
  }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user:any, done) {
    done(null, user);
});

export default passport;
