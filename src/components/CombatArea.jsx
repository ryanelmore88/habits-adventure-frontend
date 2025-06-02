import { useState } from 'react';
import { useCombat } from '../hooks/useCombat';

export default function CombatArea({ character, onAdventureComplete }) {
    const { combatState, startCombat, executeRound, resetCombat, availableEnemies } = useCombat(character);
    const [localCharacter, setLocalCharacter] = useState(character);

    const handleCombatRound = () => {
        const updatedCharacter = executeRound();
        if (updatedCharacter) {
            setLocalCharacter(updatedCharacter);
        }
    };

    const handleAdventureComplete = async () => {
        const adventureResults = {
            characterId: character.id,
            hpChange: localCharacter.current_hp - character.current_hp,
            xpGained: combatState.totalXpGained,
            loot: combatState.totalLoot,
            victory: combatState.phase === 'victory'
        };

        try {
            await onAdventureComplete(adventureResults);
            resetCombat();
            setLocalCharacter(character);
        } catch (error) {
            console.error('Failed to complete adventure:', error);
        }
    };

    return (
        <div className="combat-area">
            <div className="character-status">
                <h3>{localCharacter.name}</h3>
                <div className="hp-bar">
                    <div
                        className="hp-fill"
                        style={{
                            width: `${(localCharacter.current_hp / localCharacter.max_hp) * 100}%`,
                            backgroundColor: localCharacter.current_hp > localCharacter.max_hp * 0.5 ? '#4CAF50' :
                                localCharacter.current_hp > localCharacter.max_hp * 0.2 ? '#FF9800' : '#F44336'
                        }}
                    ></div>
                    <span className="hp-text">{localCharacter.current_hp}/{localCharacter.max_hp} HP</span>
                </div>
            </div>

            {combatState.phase === 'selection' && (
                <div className="enemy-selection">
                    <h3>Choose your opponent:</h3>
                    <div className="enemy-buttons">
                        {availableEnemies.map(enemyType => (
                            <button
                                key={enemyType}
                                onClick={() => startCombat(enemyType)}
                                className="enemy-button"
                            >
                                <div className="enemy-name">{enemyType}</div>
                                <div className="enemy-details">Level {enemyType === 'goblin' || enemyType === 'skeleton' ? 1 : enemyType === 'orc' ? 2 : 5}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {combatState.phase === 'active' && combatState.enemy && (
                <div className="active-combat">
                    <div className="enemy-status">
                        <h3>{combatState.enemy.name}</h3>
                        <div className="hp-bar">
                            <div
                                className="hp-fill enemy-hp"
                                style={{
                                    width: `${(combatState.enemy.currentHp / combatState.enemy.maxHp) * 100}%`
                                }}
                            ></div>
                            <span className="hp-text">{combatState.enemy.currentHp}/{combatState.enemy.maxHp} HP</span>
                        </div>
                    </div>

                    <button onClick={handleCombatRound} className="attack-button">
                        🎲 Roll for Combat!
                    </button>

                    <div className="combat-log">
                        {combatState.combatLog.map((round, index) => (
                            <div key={index} className="combat-round">
                                <p>
                                    <strong>You:</strong> {round.characterRoll} ({round.characterDice.dicePool})
                                    vs <strong>{combatState.enemy.name}:</strong> {round.enemyRoll} ({round.enemyDice})
                                </p>
                                {round.winner === 'character' && (
                                    <p className="victory-text">💥 You deal {round.damage} damage!</p>
                                )}
                                {round.winner === 'enemy' && (
                                    <p className="damage-text">🩸 You take {round.damage} damage!</p>
                                )}
                                {round.winner === 'tie' && (
                                    <p className="tie-text">⚔️ It's a tie! No damage dealt.</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {combatState.phase === 'victory' && (
                <div className="victory-screen">
                    <h2>🎉 Victory!</h2>
                    <p>You defeated the {combatState.enemy.name}!</p>
                    <p><strong>XP Gained:</strong> {combatState.totalXpGained}</p>
                    {combatState.totalLoot.length > 0 && (
                        <div className="loot">
                            <h4>Loot Found:</h4>
                            {combatState.totalLoot.map(item => (
                                <p key={item.id}>{item.quantity}x {item.type}</p>
                            ))}
                        </div>
                    )}
                    <button onClick={handleAdventureComplete} className="complete-button">
                        Complete Adventure
                    </button>
                </div>
            )}

            {combatState.phase === 'defeat' && (
                <div className="defeat-screen">
                    <h2>💀 Defeat...</h2>
                    <p>You have been slain by the {combatState.enemy.name}!</p>
                    <p>Don't worry, you can heal up and try again.</p>
                    <button onClick={handleAdventureComplete} className="complete-button">
                        Return to Town
                    </button>
                </div>
            )}
        </div>
    );
}