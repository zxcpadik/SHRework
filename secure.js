const { DBv2 } = require("./dbv2.js");

module.exports = {
    Auth,
    GetLastAuth
};

const db = new DBv2(process.env.DB_CONNECT);
var lastAuth = [];

function GetLastAuth(id) {
    return lastAuth[id] || -1;
}
function Auth(credits, callback) {
    if (credits.username == undefined) callback(null, { ok: false, code: 101 });
    if (credits.password == undefined) callback(null, { ok: false, code: 102 });
    if (callback == undefined) return;

    try {
        db.Exsist('users', `username='${credits.username}'`, (err, res) => {
            if (err != null) callback(null, { ok: false, code: 302 });
            if (res.rows[0] != null) {
                if (res.rows[0].exists) {
                    db.Get('users', `username='${credits.username}'`, '*', (err, res) => {
                        if (err != null) callback(null, { ok: false, code: 302 });
                        if (res.rows[0] != null) {
                            if (res.rows[0].password == credits.password) {
                                const id = res.rows[0].id;
                                db.Update('users', 'lastauth=now()', `username='${credits.username}'`, (err, res) => {if (err != null) console.log(err);});
                                lastAuth[id] = (Date.now()/1000).toFixed(0);
                                callback(null, { ok: true, code: 150, id: id });
                            } else {
                                callback(null, { ok: false, code: 103 });
                            };
                        } else {
                            callback(null, { ok: false, code: 301 });
                        };
                    });
                } else {
                    callback(null, { ok: false, code: 104 });
                };
            } else {
                callback(null, { ok: false, code: 301 });
            }
        });
    } catch (error) {
        callback(error, { ok: false, code: 401 });
    }
}