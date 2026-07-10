import React from 'react';
import { Socket } from 'socket.io-client';

interface GameBoardProps {
  gameState: any;
  playerData: any;
  socket: Socket;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerData, socket }) => {
  const phaseNames = [
    'Setup',
    'Information Phase',
    'Supply Phase',
    'Demand Phase',
    'Action Phase',
    'Selling Phase',
    'Movement Phase'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="board-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Round {gameState.round} of {gameState.maxRounds}</h2>
          <h3 style={{ color: 'var(--color-secondary)' }}>Phase {gameState.currentPhase}: {phaseNames[gameState.currentPhase]}</h3>
          {socket.id === gameState.hostId && (
            <button 
              style={{ marginTop: '1rem', background: 'var(--color-secondary)' }}
              onClick={() => socket.emit('nextPhase', gameState.roomId)}
            >
              Next Phase &raquo;
            </button>
          )}
        </div>
        {gameState.publicForecast && (
          <div className="card" style={{ padding: '1rem', minWidth: '200px' }}>
            <h4 style={{ margin: 0, borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Public Forecast</h4>
            <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
              {gameState.publicForecast.company}: 
              <span className={gameState.publicForecast.movement >= 0 ? 'text-success' : 'text-danger'}>
                {gameState.publicForecast.movement > 0 ? '+' : ''}{gameState.publicForecast.movement}
              </span>
            </p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="board-panel">
          <h2>Market Tracks</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {Object.entries(gameState.companyTracks).map(([company, value]) => (
              <div key={company} className="card" style={{ padding: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>{company}</h4>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0' }}>${value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="board-panel">
          <h2>Your Portfolio</h2>
          {playerData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ background: '#f1c40f', color: '#333' }}>
                <h4 style={{ margin: 0 }}>Cash</h4>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>${playerData.cash}</p>
              </div>
              
              <div className="card">
                <h4 style={{ margin: 0, borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' }}>Shares</h4>
                <ul style={{ listStyleType: 'none', padding: 0, marginTop: '0.5rem' }}>
                  {Object.entries(playerData.portfolio).map(([company, amount]) => {
                    const count = amount as number;
                    if (count > 0) {
                      return <li key={company} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{company}</span>
                        <strong>{count}</strong>
                      </li>
                    }
                    return null;
                  })}
                </ul>
              </div>

              {playerData.hiddenCompanyCard && (
                <div className="card" style={{ border: '2px solid var(--color-primary)' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Secret Information</h4>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {playerData.hiddenCompanyCard}: {playerData.hiddenForecastCard?.movement > 0 ? '+' : ''}{playerData.hiddenForecastCard?.movement}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Loading player data...</p>
          )}
        </div>
      </div>

      <div className="board-panel">
        <h2>Stockpiles & Market</h2>
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
          {gameState.stockpiles?.map((pile: any, idx: number) => (
            <div key={idx} className="card" style={{ minWidth: '150px', background: '#34495e', color: 'white' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Pile {idx + 1}</h4>
              {pile.cards.length === 0 ? <p>Empty</p> : (
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                  {pile.cards.map((c: any, cIdx: number) => (
                    <li key={cIdx} style={{ fontSize: '0.9rem', marginBottom: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' }}>
                      {c.faceDown ? '🔒 Hidden Card' : (c.type === 'stock' ? `📈 ${c.company}` : `⚡ ${c.type}`)}
                    </li>
                  ))}
                </ul>
              )}
              {pile.bids.length > 0 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid #555', paddingTop: '0.5rem' }}>
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Top Bid: ${pile.bids[pile.bids.length - 1].amount}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {playerData?.cardsInHand && playerData.cardsInHand.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Your Hand (To Place)</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {playerData.cardsInHand.map((c: any, idx: number) => (
                <div key={idx} className="card" style={{ width: '150px', fontSize: '0.9rem' }}>
                  {c.type === 'stock' ? `📈 ${c.company}` : `⚡ ${c.type}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
