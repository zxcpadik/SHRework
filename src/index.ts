import { config } from "dotenv";
config();

import Express from "express";
import OS from "os-utils";
import { Tools } from "./utils/tools";
import formData from "express-form-data";
import path from "path";

import fs from "fs";
import http from "http";
import https from "https";
import { APIv3Host } from "./sys/post-api";
import { UDPAPI } from "./sys/tcp-api";

const options = {
  uploadDir: "tmp",
  autoClean: true,
};

const server = Express();
server.use(Express.static(path.join(__dirname, "/web/")));

server.use(formData.parse(options));
server.use(formData.format());
server.use(formData.stream());
server.use(formData.union());

server.use(Express.json());
server.use(Express.urlencoded({ extended: true }));

server.use((req, res, next) => {
  if (
    !req.is([
      "application/json",
      "application/x-www-form-urlencoded",
      "multipart/form-data",
    ])
  )
    return next();

  req.body = Object.entries(req.body).reduce(
    (carry: any, [key, value]: any) => {
      carry[key.toLowerCase()] = value;
      return carry;
    },
    {}
  );

  return next();
});

APIv3Host.Load(server);
UDPAPI.Load(server);

server.get("/api/system/info/", async (req, res) => {
  OS.cpuUsage(function (v: number) {
    let total = (OS.totalmem() / 1024).toFixed(1);
    let free = ((OS.totalmem() - OS.freemem()) / 1024).toFixed(1);
    let percent = OS.freememPercentage() * 100;

    res.send({
      ok: true,
      code: 850,
      info: {
        cpu: v.toFixed(3),
        mem_free: OS.freemem().toFixed(3),
        mem_total: OS.totalmem().toFixed(3),
        heap: (process.memoryUsage().heapUsed / 1048576).toFixed(3),
      },
    });
  });
});

setInterval(() => {
  OS.cpuUsage(function (v) {
    let total = (OS.totalmem() / 1024).toFixed(1);
    let free = ((OS.totalmem() - OS.freemem()) / 1024).toFixed(1);
    let percent = OS.freememPercentage() * 100;

    console.log(
      `[${Tools.GetDateTime()}] CPU: ${(v * 100).toFixed(
        1
      )}%\tMEM: ${free}/${total} GiB ${(100 - percent).toFixed(
        1
      )}% Used\tHeap: ${(process.memoryUsage().heapUsed / 1048576).toFixed(
        1
      )} MiB`
    );
  });
}, 60000);

server.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/web/index.html"), (err) => {
    console.log(`[${Tools.GetDateTime()}][WEB] Error: ${err.message} `);
    res.sendFile(path.join(__dirname, "/web/404.html"), (err) => {
      res.send("ERROR");
    });
  });

  //const path = req.path;
  //const fpath = __dirname + "\\node" + Tools.MakePath(path);
  //if (path != "/") {
  //  res.sendFile(fpath);
  //} else res.redirect("/index.html");
});

var httpServer: http.Server;
var httpsServer: https.Server;

if (process.env.HTTP_ENABLED === "true") {
  httpServer = http.createServer(server);

  httpServer.listen(80, () => {
    console.log(`[HTTP] Server listening on port 80`);
  });
} else console.log(`[HTTP] Server disabled`);

if (process.env.HTTPS_ENABLED === "true") {
  var pkey = fs.readFileSync("ssl/" + process.env.HTTPS_PKEY, "utf8");
  var cert = fs.readFileSync("ssl/" + process.env.HTTPS_CERT, "utf8");
  var chain = fs.readFileSync("ssl/" + process.env.HTTPS_CA, "utf8");
  var credentials = { key: pkey, cert: cert, ca: chain };
  httpsServer = https.createServer(credentials, server);

  httpsServer.listen(443, () => {
    console.log(`[HTTPS] Server listening on port 443`);
  });
} else console.log(`[HTTPS] Server disabled`);