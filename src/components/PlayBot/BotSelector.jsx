import { BOT_LEVELS } from '../../data/bots.js';

export default function BotSelector({ onSelect }) {
  return (
    <div className="fade-in">
      <div className="page-title">Play vs Bot</div>
      <div className="page-subtitle">Choose your opponent. Pick a side and start playing!</div>
      <div className="bot-grid">
        {BOT_LEVELS.map(bot => (
          <div key={bot.rating} className="bot-card">
            <div className="bot-card-header">
              <span className="bot-emoji">{bot.emoji}</span>
              <div>
                <div className="bot-name">{bot.name}</div>
                <div className="bot-rating">Rating: {bot.rating}</div>
              </div>
            </div>
            <p className="bot-desc">{bot.description}</p>
            <div className="bot-actions">
              <button className="btn btn-sm" onClick={() => onSelect(bot, 'w')}>▶ White</button>
              <button className="btn btn-outline btn-sm" onClick={() => onSelect(bot, 'b')}>▶ Black</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
