// File: src/components/dice/DiceResultsModal.jsx
// Modal popup to display dice roll results temporarily

import { useEffect } from 'react';
import '../../styles/DiceResultsModal.css';

const DiceResultsModal = ({
                              isVisible,
                              playerRolls = [],
                              enemyRolls = [],
                              playerTotal = 0,
                              enemyTotal = 0,
                              winner = null,
                              onClose,
                              autoDismissDelay = 4000 // 4 seconds by default
                          }) => {
    // Auto-dismiss after specified delay
    useEffect(() => {
        if (isVisible && autoDismissDelay > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, autoDismissDelay);

            return () => clearTimeout(timer);
        }
    }, [isVisible, autoDismissDelay, onClose]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && isVisible) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const getWinnerText = () => {
        if (winner === 'character') {
            return { text: 'Victory!', className: 'victory' };
        } else if (winner === 'enemy') {
            return { text: 'Enemy Wins', className: 'defeat' };
        } else {
            return { text: 'Tie!', className: 'tie' };
        }
    };

    const getDieIcon = (sides) => {
        const icons = {
            4: '🔸',
            6: '⚀',
            8: '🔶',
            12: '🔷',
            20: '🎲'
        };
        return icons[sides] || '🎲';
    };

    const winnerInfo = getWinnerText();

    return (
        <div className="dice-results-overlay" onClick={onClose}>
            <div className="dice-results-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dice-results-header">
                    <h2>Dice Results</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="dice-results-content">
                    {/* Player Results */}
                    <div className="player-section">
                        <h3 className="section-title player">Your Roll</h3>
                        <div className="dice-container">
                            {playerRolls.map((die, index) => (
                                <div key={index} className="die-result player-die">
                                    <span className="die-icon">{getDieIcon(die.sides || 4)}</span>
                                    <span className="die-value">{die.value || die.result}</span>
                                    <span className="die-type">d{die.sides || 4}</span>
                                </div>
                            ))}
                        </div>
                        <div className="total-section player">
                            <span className="total-label">Total:</span>
                            <span className="total-value">{playerTotal}</span>
                        </div>
                    </div>

                    {/* VS Divider */}
                    <div className="vs-divider">
                        <span className="vs-text">VS</span>
                    </div>

                    {/* Enemy Results */}
                    <div className="enemy-section">
                        <h3 className="section-title enemy">Enemy Roll</h3>
                        <div className="dice-container">
                            {enemyRolls.map((die, index) => (
                                <div key={index} className="die-result enemy-die">
                                    <span className="die-icon">{getDieIcon(die.sides || 4)}</span>
                                    <span className="die-value">{die.value || die.result}</span>
                                    <span className="die-type">d{die.sides || 4}</span>
                                </div>
                            ))}
                        </div>
                        <div className="total-section enemy">
                            <span className="total-label">Total:</span>
                            <span className="total-value">{enemyTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Winner Announcement */}
                <div className={`winner-announcement ${winnerInfo.className}`}>
                    <h2 className="winner-text">{winnerInfo.text}</h2>
                    <div className="score-comparison">
                        <span className="player-score">{playerTotal}</span>
                        <span className="vs-small">vs</span>
                        <span className="enemy-score">{enemyTotal}</span>
                    </div>
                </div>

                {/* Auto-dismiss indicator */}
                <div className="auto-dismiss-bar">
                    <div className="auto-dismiss-progress"></div>
                </div>

                <div className="dice-results-footer">
                    <p className="dismiss-text">Click anywhere or press ESC to dismiss</p>
                </div>
            </div>
        </div>
    );
};

export default DiceResultsModal;