import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface LobbyProps {
  socket: Socket;
}

type LobbyMode = 'home' | 'create' | 'join';

const Lobby: React.FC<LobbyProps> = ({ socket }) => {
  const [mode, setMode] = useState<LobbyMode>('home');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreate = () => {
    if (playerName) {
      const newRoomId = generateRoomCode();
      socket.emit('createRoom', { roomId: newRoomId, playerName });
    }
  };

  const handleJoin = () => {
    if (roomId && playerName) {
      socket.emit('joinRoom', { roomId: roomId.toUpperCase(), playerName });
    }
  };

  if (mode === 'home') {
    return (
      <div className="board-panel" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Welcome to Stockpile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <button onClick={() => setMode('create')}>Create New Game</button>
          <button onClick={() => setMode('join')}>Join Existing Game</button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="board-panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h2>Create a Game</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Your Name" 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setMode('home')} style={{ flex: 1, background: '#7f8c8d' }}>Back</button>
            <button onClick={handleCreate} style={{ flex: 2 }}>Create</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="board-panel" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Join the Table</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Your Name" 
          value={playerName} 
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <input 
          type="text" 
          placeholder="Room Code" 
          value={roomId} 
          onChange={(e) => setRoomId(e.target.value)}
          style={{ textTransform: 'uppercase' }}
        />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => setMode('home')} style={{ flex: 1, background: '#7f8c8d' }}>Back</button>
          <button onClick={handleJoin} style={{ flex: 2 }}>Join</button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
