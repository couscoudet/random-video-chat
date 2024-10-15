import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

const waitingUsers = new Set();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('ready', () => {
    if (waitingUsers.size > 0) {
      const partner = waitingUsers.values().next().value;
      waitingUsers.delete(partner);
      socket.partner = partner;
      partner.partner = socket;
      socket.emit('start_call', { initiator: true });
      partner.emit('start_call', { initiator: false });
    } else {
      waitingUsers.add(socket);
    }
  });

  socket.on('signal', (data) => {
    if (socket.partner) {
      socket.partner.emit('signal', data);
    }
  });

  socket.on('disconnect', () => {
    waitingUsers.delete(socket);
    if (socket.partner) {
      socket.partner.emit('call_ended');
      socket.partner.partner = null;
    }
  });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});