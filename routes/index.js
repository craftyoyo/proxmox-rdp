const express  = require('express');
const proxapi  = require('../system/proxapi');
const startrdp = require('../system/rdp');
const router   = express.Router();

// middleware function to check for logged-in users
var sessionChecker = (req, res, next) => {
    if (req.session.user && req.cookies.user_sid) {
        next();
    } else {
        res.render('login', {
            title: 'Login',
            message: 'Proxmox login',
            name: 'loginname'
        });
    }
};

// route for Home-Page
router.get('/', sessionChecker, (req, res) => {
    res.render('login', {
        title: 'Login',
        message: 'Proxmox login',
        name: 'loginname'
    });
});

// route to start RDP
router.get('/rdp/:vmid', sessionChecker, (req, res, err) => {
    console.log("now connect vm " + req.params.vmid);
    startrdp(req.params.vmid, req.session.credentials, function (err) {
        res.redirect('/dashboard');
    })
});

// route for user Login
router.route('/login')
    .get(sessionChecker, (req, res) => {
        res.render('login', {
            title: 'Login',
            message: 'Proxmox login',
            name: 'loginname'
        });
    })
    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;
        const realm = req.body.realm;

        proxapi.login(username, password, realm, function (err, reply) {
            if (err) {
                res.redirect('/login');
            } else {
                req.session.user = reply.ticket;
                //TODO: Improve security by storing an encrypted version of the credentials
                req.session.credentials = { username: username, password: password, domain: realm };
                res.redirect('/dashboard');
            }
        });
    });


// route for user's dashboard
router.get('/dashboard', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        proxapi.enumvm(function (err, vmlist) {
            if (err) {
                res.redirect('/login');
            } else {
                res.render('dashboard', {
                    title: 'Dashboard',
                    message: 'Proxmox Dashboard',
                    name: 'dashboardname',
                    vmlist: vmlist
                });
            }
        })
    } else {
        res.redirect('/login');
    }
});

// route for user logout
router.get('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
        proxapi.logout();
    } else {
        res.redirect('/login');
    }
});

module.exports = router;