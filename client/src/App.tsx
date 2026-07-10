import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import Lobby from './components/Lobby';

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
    return <div className="panel">Connecting to market...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>STOCKPILE Terminal</h1>
      {!gameState ? (
        <Lobby socket={socket} />
      ) : (
        <div className="panel">
          <h2>Room: {gameState.roomId}</h2>
          {gameState.hasStarted ? (
            <div>
              <p>Phase: {gameState.currentPhase}</p>
              <p>Round: {gameState.round} / {gameState.maxRounds}</p>
              {/* Game Board and Player Dashboard will go here */}
            </div>
          ) : (
            <div>
              <h3>Players in Lobby</h3>
              <ul>
                {gameState.players.map((p: any) => (
                  <li key={p.id}>{p.name}</li>
                ))}
              </ul>
              <button onClick={() => socket.emit('startGame', gameState.roomId)}>
                Start Trading Day
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
