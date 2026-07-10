import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

const SOCKET_SERVER_URL = `http://${window.location.hostname}:2648`;

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<any>(null);
  const [playerData, setPlayerData] = useState<any>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('roomUpdated', (state) => {
      setGameState(state);
    });

    newSocket.on('playerData', (data) => {
      setPlayerData(data);
    });

    newSocket.on('error', (err) => {
      alert(err.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  if (!socket) {
    return <div className="board-panel">Connecting to market...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>STOCKPILE</h1>
      {!gameState ? (
        <Lobby socket={socket} />
      ) : (
        <div className="board-panel">
          <h2>Room: {gameState.roomId}</h2>
          {gameState.hasStarted ? (
            <div>
              <p>Phase: {gameState.currentPhase}</p>
              <p>Round: {gameState.round} / {gameState.maxRounds}</p>
              {/* Game Board and Player Dashboard */}
              <GameBoard gameState={gameState} playerData={playerData} socket={socket} />
            </div>
          ) : (
            <div>
              <h3>Players at the Table</h3>
              <ul style={{ margin: '1rem 0', listStyleType: 'none' }}>
                {gameState.players.map((p: any) => (
                  <li key={p.id} style={{ padding: '0.5rem 0', fontSize: '1.2rem' }}>
                    🎲 {p.name} {p.id === gameState.hostId ? '(Host)' : ''}
                  </li>
                ))}
              </ul>
              {socket.id === gameState.hostId ? (
                <button onClick={() => socket.emit('startGame', gameState.roomId)}>
                  Start Game
                </button>
              ) : (
                <p style={{ fontStyle: 'italic', color: '#666' }}>Waiting for host to start...</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
