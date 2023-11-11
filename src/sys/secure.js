const { DBv3 } = require("./db-v3");
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

if (!process.env.DB_CONNECT) console.error("[SECURE] DB connection string not set!\n[SECURE] Check .env!");
const db = new DBv3(process.env.DB_CONNECT);

function sha512(str) {
    return crypto.subtle.digest("SHA-512", new TextEncoder("utf-8").encode(str)).then(buf => {
        return Array.prototype.map.call(new Uint8Array(buf), x => (('00' + x.toString(16)).slice(-2))).join('');
    });
}
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

function GetLastAuth(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { return callback(null, { ok: false, code: 141 }); }  // Username Is Null // [ERROR]

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { return callback(null, { ok: false, code: 302 }); }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null || res.rows[0].exists == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]
            if (res.rows[0].exists == false) { return callback(null, { ok: false, code: 142 }); }  // User Not Found // [ERROR]

            db.Get('users', `username='${credits.username}'`, 'lastauth', (err, res) => {
                if (err != null) { return callback(null, { ok: false, code: 302 }); } // DB Internal // [ERROR]
                if (res.rows == null || res.rows[0] == null || res.rows[0].lastauth == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]

                return callback(null, { ok: true, code: 140, result: res.rows[0].lastauth.toISOString() }); // Successful // [OK]
            });
        });
    } catch (error) {
        return callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}

function Auth(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { return callback(null, { ok: false, code: 101 }); }  // Username Is Null // [ERROR]
    if (credits.password == undefined) { return callback(null, { ok: false, code: 102 }); }  // Password Is Null // [ERROR]

    if (!ValidateUsername(credits.username)) { return callback(null, { ok: false, code: 106 }); }  // Username Has Bad Symbols // [ERROR]
    if (!ValidatePassword(credits.password)) { return callback(null, { ok: false, code: 105 }); }  // Password Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { return callback(null, { ok: false, code: 302 }); }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]
            if (!res.rows[0].exists) { return callback(null, { ok: false, code: 104 }); }  // User Not Found // [ERROR]

            db.Get('users', `username='${credits.username}'`, '*', (err, res) => {
                if (err != null) { return callback(null, { ok: false, code: 302 }); } // DB Internal // [ERROR]
                if (res.rows[0] == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]
                let [hash, salt1, salt2] = res.rows[0].password.split(':');

                sha512(salt1 + credits.password + salt2).then((hashc) => {  // Make SHA512 Hash From Password
                    if (hashc !== hash) { return callback(null, { ok: false, code: 103 }); }  // Incorrect Passwod // [ERROR]
    
                    const id = res.rows[0].id;  // Get User ID
                    db.Update('users', 'lastauth=now()', `username='${credits.username}'`, (err, res) => { if (err != null) console.log(err); });  // Update lastauth in DB
                    lastAuth[id] = (Date.now() / 1000).toFixed(0);  // Update lastauth in Server
                    return allback(null, { ok: true, code: 100, id: id });  // Successful auth // [OK]
                }); 
            });
        });
    } catch (error) {
        return callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}
function Exsist(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { return callback(null, { ok: false, code: 111 }); }  // Username Is Null // [ERROR]

    if (ValidateUsername(credits.username)) { return callback(null, { ok: false, code: 112 }); }  // Username Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { return callback(null, { ok: false, code: 302 }); }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]

            return callback(null, { ok: true, code: 110, result: res.rows[0].exists });  // Successful Exists // [OK]
        });
    } catch (error) {
        return callback(error, { ok: false, code: 401 });  // By System // [ERROR]
    }
}
function Create(credits, callback) {
    if (callback == undefined) return;  // Callback Method Is Null // [ERROR]
    if (credits.username == undefined) { return callback(null, { ok: false, code: 121 }); }  // Username Is Null // [ERROR]
    if (credits.password == undefined) { return callback(null, { ok: false, code: 122 }); }  // Password Is Null // [ERROR]

    if (!ValidateUsername(credits.username)) { return callback(null, { ok: false, code: 124 }); }  // Username Has Bad Symbols // [ERROR]
    if (!ValidatePassword(credits.password)) { return callback(null, { ok: false, code: 123 }); }  // Password Has Bad Symbols // [ERROR]

    credits.username = credits.username.toLowerCase();  // Username to Lower Case

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) { return callback(err, { ok: false, code: 302 }); }  // DB Internal // [ERROR]
            if (res.rows == null || res.rows[0] == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR]
            if (res.rows[0].exists) { return callback(null, { ok: false, code: 125 }); }  // User Already Exists // [ERROR]

            let salt1 = GenStr(32);  // Generate Salt1
            let salt2 = GenStr(32);  // Generate Salt2
            sha512(salt1 + credits.password + salt2).then((hashc) => {  // Make SHA512 hash
                db.Add('users', 'username, password', `'${credits.username}', '${hashc}:${salt1}:${salt2}'`, (err, res) => {
                    if (err != null) { return callback(err, { ok: false, code: 302 }); }  // DB Internal // [ERROR]
                    //if (res.rows[0] == null) { return callback(null, { ok: false, code: 301 }); }  // DB Rows Null // [ERROR] -- Not Used
    
                    return callback(null, { ok: true, code: 120 });  // User Created // [OK]
                });
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