process.env.DB_CONNECT = 'postgres://postgres:Abobus090@localhost:5432/'; 

const express = require('express');
//const { DBv2 } = require('./dbv2.js');
const secure = require('./secure.js');
const os = require('os-utils');
const crypto = require("crypto");
const FileSystem = require('fs');

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};
Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}
Number.prototype.clamp = function(min, max) {
    return Math.min(Math.max(this, min), max);
};

function between(min, max) {  
    return Math.floor(
        Math.random() * (max - min) + min
    )
}
function getPathSegments(path) {
    let sp = path.split('/');
    for (let i = 0; i < sp.length; i++) {
        if (sp[i] === '' || sp[i] === '/') sp.splice(i, 1);
    }
    return sp;
}
function makePath(path) {
    let segs = getPathSegments(path);
    let lpath = '';
    for (let i = 0; i < segs.length; i++) {
        lpath += '\\' + segs[i];
    }
    return lpath;
}
function GetDateTime(date = new Date()) {
    return `${date.getHours().padLeft()}:${date.getMinutes().padLeft()}:${date.getSeconds().padLeft()}`
}

// --- MAIN CODE ---

const server = express();
//const db = new DBv2(process.env.DB_CONNECT);

var tickets = [];
var dynid = [];

server.get('/api/v1/auth/', async (req, res) => {
    const username = req.query['username'];
    const password = req.query['password'];
    
    if (username == null) {res.send({ok: false, code: 501}); return; }
    if (password == null) {res.send({ok: false, code: 502}); return; }

    secure.Auth({username: username, password: password}, (err, resp) => {
        if (err != null) {res.send({ok: false, code: 402}); return; }

        res.send(resp);
    });
});

server.get('/api/v1/ticket/push/', async (req, res) => {
    if (req.query['username'] == null) {res.send({ok: false, code: 501}); return;}
    if (req.query['password'] == null) {res.send({ok: false, code: 502}); return;}
    if (req.query['destination'] == null) {res.send({ok: false, code: 601}); return;}

    secure.Auth({username: req.query['username'], password: req.query['password']}, (err, resp) => {
        if (err != null) { res.send({ok: false, code: 402}); return; }
        if (!resp.ok) { res.send(resp); return; }

        if (tickets[req.query['destination']] == undefined) tickets[req.query['destination']] = [];

        if (req.query['rid'] != undefined) {
            let rid = between(100000, 999999);

            tickets[req.query['destination']][req.query['rid']] = {from: resp.id, destination: req.query['destination'], key: req.query['key'], data: req.query['data'], id: req.query['rid'], rid: rid};
            res.send({ok: true, code: 650, id: req.query['rid'], rid: rid});
        } else {
            if (dynid[req.query['destination']] == undefined) dynid[req.query['destination']] = 0;

            let tid = dynid[req.query['destination']];
            let rid = between(100000, 999999);

            tickets[req.query['destination']][tid] = {from: resp.id, destination: req.query['destination'], key: req.query['key'], data: req.query['data'], id: tid, rid: rid};
            res.send({ok: true, code: 650, id: tid, rid: rid});

            dynid[req.query['destination']]++;
        }
    });
});

server.get('/api/v1/ticket/pull/', async (req, res) => {
    if (req.query['username'] == null) {res.send({ok: false, code: 501}); return;}
    if (req.query['password'] == null) {res.send({ok: false, code: 502}); return;}

    secure.Auth({username: req.query['username'], password: req.query['password']}, (err, resp) => {
        if (err != null) {res.send({ok: false, code: 402}); return;}
        if (!resp.ok) { res.send(resp); return; }

        if (tickets[resp.id] == undefined) {res.send({ok: true, code: 651, count: 0}); return}

        let ret = {ok: true, code: 651, count: 0, tickets: []};
        let lastid = dynid[resp.id];

        if (req.query['offset'] == null) {
            if (req.query['lenght'] == null) ret.tickets = tickets[resp.id].slice((lastid - 3).clamp(0, Number.MAX_SAFE_INTEGER), lastid);
            else ret.tickets = tickets[resp.id].slice((lastid - req.query['lenght']).clamp(0, Number.MAX_SAFE_INTEGER), lastid);
        }
        else {
            let offset = Number(req.query['offset']).clamp(0, lastid);
            if (req.query['lenght'] == null) {
                let t_ = tickets[resp.id][req.query['offset']];
                if (t_ != undefined || t_ != null) ret.tickets = [t_];
                else ret.tickets = [undefined];
            }
            else {
                ret.tickets = tickets[resp.id].slice(offset, (offset + Number(req.query['lenght'])).clamp(0, lastid));
            }
        }

        ret.count = ret.tickets.length;
        res.send(ret);
    });
});

server.get('/api/v1/ticket/flush/', async (req, res) => {
    if (req.query['username'] == null) {res.send({ok: false, code: 501}); return;}
    if (req.query['password'] == null) {res.send({ok: false, code: 502}); return;}

    secure.Auth({username: req.query['username'], password: req.query['password']}, (err, resp) => {
        if (err != null) { res.send({ok: false, code: 402}); return; }
        if (!resp.ok) { res.send(resp); return; }

        tickets[resp.id] = [];
        dynid[resp.id] = 0;

        res.send({ok: true, code: 652});
    });
});

server.get('/api/v1/user/info/', async (req, res) => {
    const username = req.query['username'];
    const password = req.query['password'];
    const userid = req.query['userid'];

    if (username == null) {res.send({ok: false, code: 501}); return;}
    if (password == null) {res.send({ok: false, code: 502}); return;}
    if (userid == null) {res.send({ok: false, code: 710}); return;}

    secure.Auth({username: username, password: password}, (err, resp) => {
        if (err != null) { res.send({ok: false, code: 402}); return; }
        if (!resp.ok) { res.send(resp); return; }

        res.send({ok: true, code: 750, last: secure.GetLastAuth(userid)});
    });
});

server.get('/api/v1/system/info/', async (req, res) => {
    os.cpuUsage(function(v) {
        let total = (os.totalmem() / 1024).toFixed(1);
        let free = ((os.totalmem() - os.freemem()) / 1024).toFixed(1);
        let percent = (os.freememPercentage() * 100);

        res.send({ok: false, code: 850, info: {cpu: v.toFixed(3), mem_free: os.freemem().toFixed(3), mem_total: os.totalmem().toFixed(3), heap: (process.memoryUsage().heapUsed / 1048576).toFixed(3)}});
    });
});

setInterval(() => {
    os.cpuUsage(function(v) {
        let total = (os.totalmem() / 1024).toFixed(1);
        let free = ((os.totalmem() - os.freemem()) / 1024).toFixed(1);
        let percent = (os.freememPercentage() * 100);

        console.log(`[${GetDateTime()}] CPU: ${(v * 100).toFixed(1)}%\tMEM: ${free}/${total} GiB ${(100 - percent).toFixed(1)}% Used\tHeap: ${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MiB`);
    });
}, 30000);

server.get('*', (req, res) => {
    const path = req.path;
    const fpath = __dirname + '\\node' + makePath(path);

    if (path != '/' || path != '') {
        res.sendFile(fpath);
    }
    else res.redirect('/index.html');
});

server.listen(80, () => {
    console.log(`[HTTP] Server listening on port 80`)
});