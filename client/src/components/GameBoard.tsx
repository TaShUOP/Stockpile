import React, { useState } from 'react';
import { Socket } from 'socket.io-client';

interface GameBoardProps {
  gameState: any;
  playerData: any;
  socket: Socket;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerData, socket }) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);

  const phaseNames = [
    'Setup',
    'Information Phase',
    'Supply Phase',
    'Demand Phase',
    'Action Phase',
    'Selling Phase',
    'Movement Phase',
    'Game Over - Final Results'
  ];

  const bidTrack = [0, 1000, 2000, 3000, 4000, 5000, 7000, 9000, 12000, 16000, 20000, 25000];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="board-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Round {gameState.round} of {gameState.maxRounds}</h2>
          <h3 style={{ color: 'var(--color-secondary)' }}>Phase {gameState.currentPhase}: {phaseNames[gameState.currentPhase]}</h3>
          {socket.id === gameState.hostId && gameState.currentPhase < 7 && (
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
                      return <li key={company} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span>{company}</span>
                        <div>
                          <strong style={{ marginRight: '1rem' }}>{count}</strong>
                          {gameState.currentPhase === 5 && (
                            <button 
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: '#e74c3c' }}
                              onClick={() => socket.emit('sellShares', { roomId: gameState.roomId, company, amount: 1 })}
                            >Sell 1</button>
                          )}
                        </div>
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
        {gameState.currentPhase === 3 && gameState.unplacedBidders && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: gameState.unplacedBidders[0] === socket.id ? '#f39c12' : '#7f8c8d', color: '#fff', borderRadius: '4px' }}>
            {gameState.unplacedBidders[0] === socket.id 
              ? "🔔 It's your turn to bid! Select a stockpile below." 
              : "Waiting for other players to bid..."}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
          {gameState.stockpiles?.map((pile: any, idx: number) => {
            const topBid = pile.bids.length > 0 ? pile.bids[pile.bids.length - 1].amount : -1;
            const topBidder = pile.bids.length > 0 ? gameState.players.find((p:any) => p.id === pile.bids[pile.bids.length - 1].playerId)?.name : null;

            return (
              <div key={idx} className="card" style={{ minWidth: '220px', background: '#34495e', color: 'white' }}>
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
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>Top Bid: ${topBid} ({topBidder})</p>
                  </div>
                )}

                {gameState.currentPhase === 2 && selectedCardId && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    {!playerData.hasPlacedFaceUp && (
                      <button style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => {
                        socket.emit('placeCard', { roomId: gameState.roomId, cardId: selectedCardId, stockpileIndex: idx, faceDown: false });
                        setSelectedCardId(null);
                      }}>Face Up</button>
                    )}
                    {!playerData.hasPlacedFaceDown && (
                      <button style={{ padding: '0.5rem', fontSize: '0.8rem' }} onClick={() => {
                        socket.emit('placeCard', { roomId: gameState.roomId, cardId: selectedCardId, stockpileIndex: idx, faceDown: true });
                        setSelectedCardId(null);
                      }}>Face Down</button>
                    )}
                  </div>
                )}

                {gameState.currentPhase === 3 && gameState.unplacedBidders?.[0] === socket.id && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select value={bidAmount} onChange={e => setBidAmount(Number(e.target.value))} style={{ padding: '0.5rem' }}>
                      {bidTrack.filter(amt => amt > topBid).map(amt => (
                        <option key={amt} value={amt}>${amt}</option>
                      ))}
                    </select>
                    <button style={{ padding: '0.5rem', fontSize: '0.8rem', background: 'var(--color-success)' }} onClick={() => {
                      socket.emit('placeBid', { roomId: gameState.roomId, stockpileIndex: idx, amount: bidAmount });
                      setBidAmount(0);
                    }}>Place Bid</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {playerData?.cardsInHand && playerData.cardsInHand.length > 0 && gameState.currentPhase === 2 && (
          <div style={{ marginTop: '2rem' }}>
            <h3>Your Hand (To Place)</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Click a card to select it, then choose a stockpile to place it into.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {playerData.cardsInHand.map((c: any, idx: number) => (
                <div 
                  key={idx} 
                  className="card" 
                  style={{ 
                    width: '150px', 
                    fontSize: '0.9rem', 
                    cursor: 'pointer', 
                    border: selectedCardId === c.id ? '2px solid var(--color-primary)' : '',
                    transform: selectedCardId === c.id ? 'translateY(-5px)' : 'none'
                  }}
                  onClick={() => setSelectedCardId(c.id)}
                >
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
