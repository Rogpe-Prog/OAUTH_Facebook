const express = require('express')
const app = express()
require('dotenv/config')
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
const mongo = process.env.MONGODB
mongoose.Promise = global.Promise
const User = require('./models/user')
const session = require('express-session')
const FB = require('fb')

const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy

passport.serializeUser((user, done)=> {
    done(null, user)
})
passport.deserializeUser((user, done)=>{
    done(null, user)
})

app.use(session({ secret: 'aloha', resave: true, saveUninitialized: true }))
app.use(passport.initialize())
app.use(passport.session())

app.set('view engine', 'ejs')

app.get('/', (req, res)=> res.render('index'))
app.get('/friends', async(req, res)=> {
    if(req.isAuthenticated){
        FB.setAccessToken(req.user.accessToken)
        FB.options({ version: 'v2.4' })
        const results = await FB.api('me/friends?fields=name,picture', 'get' )
        res.render('friends', {
            results
        })
    }else{
        res.redirect('/facebook')
    }
})

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.SECRET,
    callbackURL: 'http://localhost:3000/facebook/callback',
    profileFields: ['id', 'displayName', 'email', 'photos'],
    scope: ['user_friends']
}, async(accessToken, refereshToken, profile, done)=> {
    const userDB = await User.findOne({ facebookId: profile.id })
    if(!userDB){
        const user = new User({
            name: profile.displayName,
            facebookId: profile.id,
            accessToken
        })
        await user.save()
        done(null, user)
    }else{
        done(null, userDB)
    }

}))
app.get('/facebook', passport.authenticate('facebook'))
app.get('/facebook/callback', 
                passport.authenticate('facebook', 
                        { failureRedirect: '/'}), 
                (req, res)=> res.redirect('/'))



mongoose
    .connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=> {
        app.listen(port, ()=> console.log('running....'))
    })