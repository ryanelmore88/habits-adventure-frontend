// File: src/components/dice/SimpleDicePopup.jsx
// Simple popup to show dice totals and delta

import { useEffect } from 'react';

const SimpleDicePopup = ({
                             isVisible,
                             characterTotal = 0,
                             enemyTotal = 0,
                             onClose,
                             autoDismissDelay = 3000
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

    const delta = Math.abs(characterTotal - enemyTotal);
    const characterWins = characterTotal > enemyTotal;
    const deltaColor = characterWins ? '#3b82f6' : '#ef4444'; // Blue if character wins, red if enemy wins

    return (
        <div
            className="dice-popup-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2000,
                animation: 'fadeIn 0.3s ease-out'
            }}
        >
            <div
                className="dice-popup-content"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                    borderRadius: '16px',
                    border: '2px solid #374151',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    padding: '32px',
                    textAlign: 'center',
                    minWidth: '300px',
                    animation: 'slideInUp 0.4s ease-out'
                }}
            >
                <h2 style={{
                    color: '#a5b4fc',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    marginBottom: '24px',
                    margin: '0 0 24px 0'
                }}>
                    Dice Results
                </h2>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '20px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            color: '#3b82f6',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Your Roll
                        </div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: '#3b82f6'
                        }}>
                            {characterTotal}
                        </div>
                    </div>

                    <div style={{
                        fontSize: '1.5rem',
                        color: '#9ca3af',
                        fontWeight: '600'
                    }}>
                        VS
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            color: '#ef4444',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            Enemy Roll
                        </div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: '#ef4444'
                        }}>
                            {enemyTotal}
                        </div>
                    </div>
                </div>

                {/* Delta Display */}
                {delta > 0 && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            fontSize: '1rem',
                            color: '#9ca3af',
                            marginBottom: '8px',
                            fontWeight: '600'
                        }}>
                            {characterWins ? 'You win by:' : 'Enemy wins by:'}
                        </div>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: '800',
                            color: deltaColor
                        }}>
                            {delta}
                        </div>
                    </div>
                )}

                {delta === 0 && (
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            fontSize: '1.2rem',
                            color: '#fbbf24',
                            fontWeight: '700'
                        }}>
                            TIE!
                        </div>
                    </div>
                )}

                <div style={{
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                }}>
                    Click anywhere to continue...
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default SimpleDicePopup;