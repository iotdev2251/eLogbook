#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { myApp } from '../app/app.js';
import { socketAuthMiddleware } from '../app/auth/socket-auth.js';
import { createServer as createServerHttp } from 'http';
import { createServer as createServerHttps } from 'https';
import debugPkg from 'debug';
import { Server } from 'socket.io'
import * as fs from 'fs';

const SSL_KEY_PATH = 'sslcert/server-key.pem'
const SSL_CERT_PATH = 'sslcert/server-cert.pem'
const SSL_CA_PATH = 'sslcert/cert.pem'

const useHttpOnly = process.env.USE_HTTP === '1' || process.env.USE_HTTP === 'true'

const debug = debugPkg('myproj:server');
/**
 * Get port from environment and store in Express.
 */

const app = myApp.getApp()

const port = normalizePort(process.env.PORT || process.env.NODE_PORT || '3011');
app.set('port', port);

const io = new Server()

function createHttpsServer() {
  const credentials = {
    key: fs.readFileSync(SSL_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(SSL_CERT_PATH, 'utf8'),
    ca: [fs.readFileSync(SSL_CA_PATH, 'utf8')],
  };
  return createServerHttps(credentials, app);
}

function listenServer(server, listenPort, label) {
  server.listen(listenPort);
  server.on('error', (error) => onError(error, listenPort));
  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log(`${label} listening on ${bind}`);
    debug('Listening on ' + bind);
  });
}

async function start() {
  await myApp.init(io)

  io.use(socketAuthMiddleware)

  io.on("connection", (socket) => {
    console.log("Socket connected: " + socket.id + " user=" + socket.user?.username)
  })

  if (useHttpOnly) {
    const httpServer = createServerHttp(app)
    io.attach(httpServer)
    listenServer(httpServer, port, 'HTTP')
    return
  }

  const httpsServer = createHttpsServer()
  io.attach(httpsServer)
  listenServer(httpsServer, port, 'HTTPS')
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error, listenPort) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof listenPort === 'string'
    ? 'Pipe ' + listenPort
    : 'Port ' + listenPort;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
