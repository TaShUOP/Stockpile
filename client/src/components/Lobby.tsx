import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface LobbyProps {
  socket: Socket;
}

const Lobby: React.FC<LobbyProps> = ({ socket }) => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleCreate = () => {
    if (roomId && playerName) {
      socket.emit('createRoom', { roomId, playerName });
    }
  };

  const handleJoin = () => {
    if (roomId && playerName) {
      socket.emit('joinRoom', { roomId, playerName });
    }
  };

  return (
    <div className="panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Lobby</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="ENTER BROKER NAME" 
          value={playerName} 
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="ENTER ROOM ID" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={handleCreate} style={{ flex: 1 }}>Create Room</button>
          <button onClick={handleJoin} style={{ flex: 1 }}>Join Room</button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
