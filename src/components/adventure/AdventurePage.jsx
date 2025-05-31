// src/components/adventure/AdventurePage.jsx
import React, { useEffect, useState } from 'react';
import DisplayResults from '@3d-dice/dice-ui/src/displayresults';
import DiceParser     from '@3d-dice/dice-parser-interface';
import { CharacterDice, OpponentDice, Dice } from '../dice/DiceBox.js';
import { getDiceNotation } from '../../utils/getDiceNotation.js';
import '../../styles/Dice.css';

const DRP     = new DiceParser();
const Results = new DisplayResults('#dice-box');

export default function AdventurePage({ character }) {
    const [battleStarted,    setBattleStarted]    = useState(false);
    const [diceNotationMap,  setDiceNotationMap]  = useState({});
    const [charRoll,         setCharRoll]         = useState(null);
    const [oppRoll,          setOppRoll]          = useState(null);
    const [winner,           setWinner]           = useState(null);

    // initialize both dice engines & global clear handler
    useEffect(() => {
        Promise.all([ CharacterDice.init(), OpponentDice.init() ]).then(() => {
            document.addEventListener('mousedown', () => {
                Dice.hide().clear();
                CharacterDice.hide().clear();
                OpponentDice.hide().clear();
                Results.clear();
                setCharRoll(null);
                setOppRoll(null);
                setWinner(null);
                setBattleStarted(false);
            });
        });

        CharacterDice.onRollComplete = results => {
            const score = results.reduce((sum, r) => sum + r.value, 0);
            setCharRoll(score);
            Results.showResults(results);
        };

        OpponentDice.onRollComplete = results => {
            const score = results.reduce((sum, r) => sum + r.value, 0);
            setOppRoll(score);
            Results.showResults(results);
        };
    }, []);

    // once both rolls are in, pick winner
    useEffect(() => {
        if (charRoll !== null && oppRoll !== null) {
            if      (charRoll > oppRoll) setWinner('🎉 You win!');
            else if (oppRoll  > charRoll) setWinner('😈 Opponent wins!');
            else                           setWinner("🤝 It's a tie!");
        }
    }, [charRoll, oppRoll]);

    // your “Start Battle” button handler
    function startBattle() {
        // freeze your dice pools now that the fight begins
        const map = getDiceNotation(character);
        setDiceNotationMap(map);
        setBattleStarted(true);

        // clear old visuals & state
        CharacterDice.hide().clear();
        OpponentDice.hide().clear();
        Results.clear();
        setCharRoll(null);
        setOppRoll(null);
        setWinner(null);

        // for example: roll each ability once immediately…
        // (or just roll hit‐dice, etc. — up to you)
        CharacterDice.show().roll(DRP.parseNotation(map.strength), 'char');
        OpponentDice.show().roll(DRP.parseNotation(map.strength), 'opp');
    }

    return (
        <div className="dice-page">
            <h1>Adventure Duel</h1>
            {!battleStarted ? (
                <button onClick={startBattle}>
                    ⚔️ Start Battle
                </button>
            ) : (
                <>
                    <p>Rolling with:</p>
                    <ul>
                        {Object.entries(diceNotationMap).map(([attr, note]) => (
                            <li key={attr}>
                                {attr}: <code>{note}</code>
                            </li>
                        ))}
                    </ul>
                    {winner && (
                        <div className="duel-result">
                            <strong>{winner}</strong>
                            <div>Your roll: {charRoll} — Opponent: {oppRoll}</div>
                        </div>
                    )}
                </>
            )}
            <div id="dice-box" />
        </div>
    );
}
