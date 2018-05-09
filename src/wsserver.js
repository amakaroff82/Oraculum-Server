import {server as WebSocketServer} from "websocket"
import http from "http"

const PORT = 3001

export function startSockets(server) {
  if (!server) {
    server = http.createServer(function (request, response) {
      console.log("Request handler. WebSockets don't use it");
    });
    server.listen(PORT, function () {
      console.log(`Server is listening on port ${PORT}`);
    });
  }
// create WS the server
  wsServer = new WebSocketServer({
    httpServer: server
  });

// WebSocket server
  wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);
//    connection.sendUTF("Some data");

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function (message) {
      if (message.type === 'utf8') {
  //    connection.sendUTF("Some data");
      }
    });

    connection.on('close', function (connection) {
      // close user connection
      console.log("Close connection");
    });
  });
  return wsServer;
}



