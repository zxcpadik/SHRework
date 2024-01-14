require('dotenv').config();

import Express from "express";
import { AuthService, Credentials } from "./sys/auth-service";
import OS from "os-utils";
import { Tools } from "./utils/tools";
import { TicketService } from "./sys/ticket-service";
import { Ticket } from "./entities/ticket";

const API_V1_VER = 1;
const API_V2_VER = 1;

const server = Express();

server.get('/api/v2/auth/', async (req, res) => {
    const Username = req.query['username'] as string | undefined;
    const Password = req.query['password'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(Username, Password));
    return res.send(result.ok ? { ok: true, status: 100, ID: result.user?.ID} : result);
});

server.get('/api/v2/create/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;

    let result = await AuthService.Create(new Credentials(username, password));
    return res.send(result.ok ? { ok: true, status: 120, ID: result.user?.ID} : result);
});

server.get('/api/v2/update/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;
    const newpassword = req.query['newpassword'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
        let changeresult = await AuthService.Update(new Credentials(username, password), newpassword);

        return res.send(changeresult.ok ? { ok: true, status: 150, ID: changeresult.user?.ID} : changeresult);
    } else return res.send(result);
});

server.get('/api/v2/delete/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (!result.ok) return res.send(result);
    
    let deleteresult = await AuthService.Delete(new Credentials(username, password));
    return res.send(deleteresult);
});


server.get('/api/v1/push/', async (req, res) => {
    const Username = req.query['username'] as string | undefined;
    const Password = req.query['password'] as string | undefined;

    const Destination = Number(req.query['destination']) as number | undefined;
    const ResponseID = Number(req.query['responseid']) as number | undefined;
    const Data = req.query['data'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(Username, Password));
    if (result.ok) {
        let GenRID = Tools.Between(100000, 999999);
        if (ResponseID && ResponseID !== Number.NaN) {
            let ticket = new Ticket();
            ticket.SourceID = result.user?.ID || -1;
            ticket.Data = Data || '';
            ticket.DestinationID = Destination || -1;
            ticket.TicketID = ResponseID || -1;
            ticket.ResponseID = GenRID;

            let tresult = await TicketService.Push(ticket);
            return res.send(tresult);
        } else {
            let ticket = new Ticket();
            ticket.SourceID = result.user?.ID || -1;
            ticket.Data = Data || '';
            ticket.DestinationID = Destination || -1;
            ticket.ResponseID = GenRID;
            
            let tresult = await TicketService.Push(ticket);
            return res.send(tresult);
        }

    } else return res.send(result);
});

server.get('/api/v1/pull/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;

    const offset = Number(req.query['offset']) as number | undefined;
    const count = Number(req.query['count']) as number | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
        let tres = await TicketService.Pull(result.user?.ID || -1, offset || -1, count || 1);
        res.send(tres);
    } else return res.send(result);
});

server.get('/api/v1/flush/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
        let tres = await TicketService.Flush(result.user?.ID || -1);
        return res.send({ok: true, status: 620, count: tres});
    } else return res.send(result);
});

server.get('/api/v1/last/', async (req, res) => {
    const username = req.query['username'] as string | undefined;
    const password = req.query['password'] as string | undefined;

    let result = await AuthService.Auth(new Credentials(username, password));
    if (result.ok) {
        let tres = await TicketService.GetLast(result.user?.ID || -1);
        return res.send({ok: true, status: 630, count: tres});
    } else return res.send(result);
});


server.get('/api/v1/', async (req, res) => {
    return res.send({ok: true, status: 800, version: API_V1_VER});
});

server.get('/api/v2/', async (req, res) => {
    return res.send({ok: true, status: 801, version: API_V2_VER});
});


server.get('/api/v1/user/info/', async (req, res) => {
    res.send({ ok: false, code: 500 });
    return;
    /*
    const Username = req.query['username'];
    const Password = req.query['password'];
    const UserID = req.query['userid'];

    secure.Auth({ username: Username, password: Password }, (err, resp) => {
        if (err != null) { res.send({ ok: false, code: 402 }); return; }
        if (!resp.ok) { res.send(resp); return; }

        if (userid == null) { res.send({ ok: false, code: 710 }); return; }

        res.send({ ok: true, code: 750, last: secure.GetLastAuth(userid) });
    });
    */
});

server.get('/api/v1/system/info/', async (req, res) => {
    OS.cpuUsage(function (v: number) {
        let total = (OS.totalmem() / 1024).toFixed(1);
        let free = ((OS.totalmem() - OS.freemem()) / 1024).toFixed(1);
        let percent = (OS.freememPercentage() * 100);

        res.send({ ok: true, code: 850, info: { cpu: v.toFixed(3), mem_free: OS.freemem().toFixed(3), mem_total: OS.totalmem().toFixed(3), heap: (process.memoryUsage().heapUsed / 1048576).toFixed(3) } });
    });
});

setInterval(() => {
    OS.cpuUsage(function (v) {
        let total = (OS.totalmem() / 1024).toFixed(1);
        let free = ((OS.totalmem() - OS.freemem()) / 1024).toFixed(1);
        let percent = (OS.freememPercentage() * 100);

        console.log(`[${Tools.GetDateTime()}] CPU: ${(v * 100).toFixed(1)}%\tMEM: ${free}/${total} GiB ${(100 - percent).toFixed(1)}% Used\tHeap: ${(process.memoryUsage().heapUsed / 1048576).toFixed(1)} MiB`);
    });
}, 60000);

server.get('*', (req, res) => {
    const path = req.path;
    const fpath = __dirname + '\\node' + Tools.MakePath(path);

    if (path != '/') {
        res.sendFile(fpath);
    }
    else res.redirect('/index.html');
});

server.listen(80, () => {
    console.log(`[HTTP] Server listening on port 80`)
});