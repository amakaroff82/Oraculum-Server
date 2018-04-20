import {server as WebSocketServer} from "websocket"
import http from "http"

const PORT = 3001

function startSockets(server){
  if(!server){
    server = http.createServer(function(request, response) {});
    server.listen(PORT, function() { });
  }

    console.log("start");

// create the server
    wsServer = new WebSocketServer({
        httpServer: server
    });

// WebSocket server
    wsServer.on('request', function(request) {
        var connection = request.accept(null, request.origin);

        console.log("request");

        connection.sendUTF("test");

        // This is the most important callback for us, we'll handle
        // all messages from users here.
        connection.on('message', function(message) {

            console.log("message");

            if (message.type === 'utf8') {
                // process WebSocket message
            }
        });

        connection.on('close', function(connection) {
            console.log("close");

            // close user connection
        });
    });
}

module.exports.startSockets = startSockets;
