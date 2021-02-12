module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'لطفا وارد شوید');
        res.redirect('/login');
    },
    ensureAdminAuthenticated: function(req, res, next) {
        if(req.isAuthenticated() && req.user.userName === "Administrator") {
            return next();
        }
        req.flash('error_msg', 'رمز یا نام کاربری اشتباه است');
        res.redirect('/adminLogin');
    }

};

