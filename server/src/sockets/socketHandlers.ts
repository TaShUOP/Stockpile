import { Server, Socket } from 'socket.io';
import { GameEngine } from '../engine/Game';

const rooms: Record<string, GameEngine> = {};

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createRoom', (data: { roomId: string, playerName: string }) => {
      const { roomId, playerName } = data;
      if (!rooms[roomId]) {
        rooms[roomId] = new GameEngine(roomId);
        console.log(`Room ${roomId} created`);
      }
      
      socket.join(roomId);
      const player = rooms[roomId].addPlayer(socket.id, playerName);
      
      io.to(roomId).emit('roomUpdated', rooms[roomId].getPublicState());
      socket.emit('playerData', player.getPrivateData());
    });

    socket.on('joinRoom', (data: { roomId: string, playerName: string }) => {
      const { roomId, playerName } = data;
      const room = rooms[roomId];
      if (room && !room.hasStarted) {
        socket.join(roomId);
        const player = room.addPlayer(socket.id, playerName);
        
        io.to(roomId).emit('roomUpdated', room.getPublicState());
        socket.emit('playerData', player.getPrivateData());
      } else {
        socket.emit('error', { message: 'Room not found or already started' });
      }
    });

    socket.on('startGame', (roomId: string) => {
      const room = rooms[roomId];
      if (room && !room.hasStarted) {
        room.startGame();
        io.to(roomId).emit('roomUpdated', room.getPublicState());
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Basic disconnect handling
    });
  });
}
