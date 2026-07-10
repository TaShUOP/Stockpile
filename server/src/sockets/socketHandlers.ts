import { Server, Socket } from 'socket.io';
import { GameEngine } from '../engine/Game';

const rooms: Record<string, GameEngine> = {};

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('createRoom', (data: { roomId: string, playerName: string }) => {
      const { roomId, playerName } = data;
      if (!rooms[roomId]) {
        rooms[roomId] = new GameEngine(roomId, socket.id);
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
      if (room && !room.hasStarted && socket.id === room.hostId) {
        room.startGame();
        io.to(roomId).emit('roomUpdated', room.getPublicState());
        // Also emit playerData to update starting hands
        room.players.forEach(p => {
          io.to(p.id).emit('playerData', p.getPrivateData());
        });
      }
    });

    socket.on('nextPhase', (roomId: string) => {
      const room = rooms[roomId];
      if (room && room.hasStarted && socket.id === room.hostId) {
        room.nextPhase();
        io.to(roomId).emit('roomUpdated', room.getPublicState());
        room.players.forEach(p => {
          io.to(p.id).emit('playerData', p.getPrivateData());
        });
      }
    });

    socket.on('placeCard', (data: { roomId: string, cardId: string, stockpileIndex: number, faceDown: boolean }) => {
      const room = rooms[data.roomId];
      if (room) {
        room.placeCard(socket.id, data.cardId, data.stockpileIndex, data.faceDown);
        io.to(data.roomId).emit('roomUpdated', room.getPublicState());
        room.players.forEach(p => {
          io.to(p.id).emit('playerData', p.getPrivateData());
        });
      }
    });

    socket.on('placeBid', (data: { roomId: string, stockpileIndex: number, amount: number }) => {
      const room = rooms[data.roomId];
      if (room) {
        room.placeBid(socket.id, data.stockpileIndex, data.amount);
        io.to(data.roomId).emit('roomUpdated', room.getPublicState());
        room.players.forEach(p => {
          io.to(p.id).emit('playerData', p.getPrivateData());
        });
      }
    });

    socket.on('sellShares', (data: { roomId: string, company: string, amount: number }) => {
      const room = rooms[data.roomId];
      if (room) {
        room.sellShares(socket.id, data.company, data.amount);
        io.to(data.roomId).emit('roomUpdated', room.getPublicState());
        room.players.forEach(p => {
          io.to(p.id).emit('playerData', p.getPrivateData());
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // Basic disconnect handling
    });
  });
}
