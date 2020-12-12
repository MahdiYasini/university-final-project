// const LocalStrategy = require('passport-local').Strategy;
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const User = require('../Models/User');

// module.exports = (passport) => {
//     passport.use(
//         new LocalStrategy({
//             usernameField: 'email'
//         }, (email, password, done) => {
//             // Checking email is exist on DB.
//             User.findOne({
//                 email: email
//             })
//                 .then(user => {
//                     if (!user) {
//                         return done(null, false, {
//                             message: "آدرس رایانه اشتباه است یا وجود ندارد"
//                         });
//                     }
//                     //If email exist then we check password
//                     bcrypt.compare(password, user.password, (err, isMatch) => {
//                         if (isMatch) {
//                             return done(null, user)
//                         }
//                         else {
//                             return done(null, false, {
//                                 message: "رمز درست وارد نشده است"
//                             })
//                         }
//                     })
//                 })
//                 .catch(err => console.log(err));
//         })
//     );
//     //!why we use serializeUser? 
//     //serializeUser determines which data of the user object should be stored in the session
//     passport.serializeUser((user, done) => {
//         done(null, user.id);
//     });

//     passport.deserializeUser((id, done) => {
//         User.findById(id, (err, user) => {
//             done(err, user);
//         });
//     });
// };



const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load User Model 
const User = require('../Models/User')

module.exports = function (passport) {


    passport.use(
        new LocalStrategy({
            usernameField: 'email'
        }, (email, password, done) => {
            //Match User
            User.findOne({
                    email: email
                })
                .then(user => {
                    
                    if (!user) {
                        return done(null, false, {
                            message: 'آدرس رایانامه اشتباه است'
                        });
                    }

                    // Match password
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        
                        if (isMatch) {
                            return done(null, user)
                        } else {
                            return done(null, false, {
                                message: 'رمز اشتباه است'
                            })
                        }
                    })
                })
                .catch(err => console.log(err))
        })
    )

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
}
