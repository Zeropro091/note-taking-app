import { createServer } from 'http';
import { Server } from 'socket.io';
import os from 'os';
import pty from 'node-pty';

const PORT = process.env.TERMINAL_PORT || 3006;
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

io.on('connection', (socket) => {
  console.log('Terminal client connected');

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.cwd(),
    env: process.env
  });

  ptyProcess.onData((data) => {
    socket.emit('output', data);
  });

  socket.on('input', (data) => {
    ptyProcess.write(data);
  });

  socket.on('resize', ({ cols, rows }) => {
    ptyProcess.resize(cols, rows);
  });

  socket.on('disconnect', () => {
    console.log('Terminal client disconnected');
    ptyProcess.kill();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Terminal PTY server listening on port ${PORT}`);
});
