#!/usr/bin/env node

/**
 * Module dependencies.
 */

import { myApp } from '../app/app.js';
import { socketAuthMiddleware } from '../app/auth/socket-auth.js';
import { createServer as createServerHttps } from 'https';
import debugPkg from 'debug';
import { Server } from 'socket.io'
import * as fs from 'fs';

const SSL_KEY_PATH = 'sslcert/server-key.pem'
const SSL_CERT_PATH = 'sslcert/server-cert.pem'
const SSL_CA_PATH = 'sslcert/cert.pem'


const debug = debugPkg('myproj:server');
/**
 * Get port from environment and store in Express.
 */

const app = myApp.getApp()

const port = normalizePort(process.env.PORT || process.env.NODE_PORT || '3011');
app.set('port', port);

/**
 * Create HTTPS server.
 */

const credentials = { 
  key: fs.readFileSync(SSL_KEY_PATH, 'utf8'), 
  cert: fs.readFileSync(SSL_CERT_PATH, 'utf8'), 
  ca: [fs.readFileSync(SSL_CA_PATH, 'utf8')]};
const httpsServer = createServerHttps(credentials, app);

/**
 * Add Socket.IO
 */
const io = new Server(httpsServer)

async function start() {
  await myApp.init(io)

  io.use(socketAuthMiddleware)

  io.on("connection", (socket) => {
    console.log("Socket connected: " + socket.id + " user=" + socket.user?.username)
  })

  httpsServer.listen(port);
  httpsServer.on('error', onError);
  httpsServer.on('listening', onListening);
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

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

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

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = httpsServer.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
