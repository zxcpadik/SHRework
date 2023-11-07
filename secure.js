const { DBv2 } = require("./dbv2.js");
const md5 = require('md5');
const crypto = require("crypto");

module.exports = {
    Auth,
    Exsist,
    Create,
    Delete,

    GetLastAuth,
    GenStr,

    ValidateString,
    ValidatePassword,
    ValidateUsername,
};

const goodsymbols = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_0123456789';

const db = new DBv2(process.env.DB_CONNECT);
var lastAuth = [];

function ValidateString(str) {
    for (let i = 0; i < str.length; i++) {
        if (!goodsymbols.includes(str[i])) return false;
    }
    return true;
}
function ValidatePassword(pass) {
    if (pass.length > 64 || pass.length < 8) return false;
    return ValidateString(pass);
}
function ValidateUsername(user) {
    if (user.length > 16 || user.length < 4) return false;
    return ValidateString(user);
}

function GenStr(len) {
    return crypto.randomBytes(len / 2).toString('hex');
}

function GetLastAuth(id) {
    return lastAuth[id] || -1;
}

function Auth(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { callback(null, { ok: false, code: 101 }); return; }  // Username Is Null // [ERROR]
    if (credits.password == undefined) { callback(null, { ok: false, code: 102 }); return; }  // Password Is Null // [ERROR]

    if (!ValidateUsername(credits.username)) { callback(null, { ok: false, code: 106 }); return; }  // Username Has Bad Symbols // [ERROR]
    if (!ValidatePassword(credits.password)) { callback(null, { ok: false, code: 105 }); return; }  // Password Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { callback(null, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]
            if (!res.rows[0].exists) { callback(null, { ok: false, code: 104 }); return; }  // User Not Found // [ERROR]

            db.Get('users', `username='${credits.username}'`, '*', (err, res) => {
                if (err != null) { callback(null, { ok: false, code: 302 }); return; } // DB Internal // [ERROR]
                if (res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]

                let [hash, salt1, salt2] = res.rows[0].password.split(':');  // Split into Hash and Salt
                let md5c = md5(salt1 + credits.password + salt2);  // Make MD5 Hash From Password

                if (md5c !== hash) { callback(null, { ok: false, code: 103 }); return; }  // Incorrect Passwod // [ERROR]

                const id = res.rows[0].id;  // Get User ID
                db.Update('users', 'lastauth=now()', `username='${credits.username}'`, (err, res) => { if (err != null) console.log(err); });  // Update lastauth in DB
                lastAuth[id] = (Date.now() / 1000).toFixed(0);  // Update lastauth in Server
                callback(null, { ok: true, code: 100, id: id });  // Successful auth // [OK]
            });
        });
    } catch (error) {
        callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}
function Exsist(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { callback(null, { ok: false, code: 111 }); return; }  // Username Is Null // [ERROR]

    if (ValidateUsername(credits.username)) { callback(null, { ok: false, code: 112 }); return; }  // Username Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { callback(null, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]

            callback(null, { ok: true, code: 110, result: res.rows[0].exists });  // Successful Exists // [OK]
        });
    } catch (error) {
        callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}
function Create(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { callback(null, { ok: false, code: 121 }); return; }  // Username Is Null // [ERROR]
    if (credits.password == undefined) { callback(null, { ok: false, code: 122 }); return; }  // Password Is Null // [ERROR]

    if (!ValidateUsername(credits.username)) { callback(null, { ok: false, code: 124 }); return; }  // Username Has Bad Symbols // [ERROR]
    if (!ValidatePassword(credits.password)) { callback(null, { ok: false, code: 123 }); return; }  // Password Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { callback(err, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]
            if (res.rows[0].exists) { callback(null, { ok: false, code: 125 }); return; }  // User Already Exists // [ERROR]

            let salt1 = GenStr(16);  // Generate Salt1
            let salt2 = GenStr(16);  // Generate Salt2
            let hash = md5(salt1 + credits.password + salt2);  // Make MD5 hash

            db.Add('users', 'username, password', `'${credits.username}', '${hash}:${salt1}:${salt2}'`, (err, res) => {
                if (err != null) { callback(err, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
                //if (res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR] -- Not Used

                callback(null, { ok: true, code: 120 }); return;  // User Created // [OK]
            });
        });
    } catch (error) {
        callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}
function Delete(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { callback(null, { ok: false, code: 131 }); return; }  // Username Is Null // [ERROR]

    if (!ValidateUsername(credits.username)) { callback(null, { ok: false, code: 132 }); return; }  // Username Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { callback(null, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]
            if (!res.rows[0].exists) { callback(null, { ok: false, code: 133 }); return; }  // User not exists // [ERROR]

            db.Delete('users', `username='${credits.username}'`, (err, res) => {
                if (err != null) { callback(null, { ok: false, code: 302 }); return; }  // DB Internal // [ERROR]
                //if (res.rows[0] == null) { callback(null, { ok: false, code: 301 }); return; }  // DB Rows Null // [ERROR]  -- Not Used

                callback(null, { ok: true, code: 130 });  // Delete successful // [OK]
            });
        });
    } catch (error) {
        callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}


// Do Update() method
// Add 2FA