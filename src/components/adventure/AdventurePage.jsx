// src/components/adventure/AdventurePage.jsx

import React, { useEffect, useState } from 'react';
import DisplayResults from '@3d-dice/dice-ui/src/displayResults';
import DiceParser from '@3d-dice/dice-parser-interface';
import { CharacterDice, OpponentDice, Dice } from '../dice/DiceBox.js';
import '../../styles/Dice.css';

const DRP = new DiceParser();
const Results = new DisplayResults('#dice-box');

export default function AdventurePage() {
    const [charRoll, setCharRoll] = useState(null);
    const [oppRoll, setOppRoll] = useState(null);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        // Initialize both dice engines
        Promise.all([ CharacterDice.init(), OpponentDice.init() ]).then(() => {
            // Global "click anywhere to clear" handler
            document.addEventListener('mousedown', () => {
                Dice.hide().clear();
                CharacterDice.hide().clear();
                OpponentDice.hide().clear();
                Results.clear();
                setCharRoll(null);
                setOppRoll(null);
                setWinner(null);
            });
        });

        // Helper to sum up the raw results array
        const sumResults = results =>
            results.reduce((total, die) => total + die.value, 0);

        // When character dice finish rolling
        CharacterDice.onRollComplete = results => {
            const total = sumResults(results);
            console.log('Character Score:', total);
            setCharRoll(total);
            Results.showResults(results);
        };

        // When opponent dice finish rolling
        OpponentDice.onRollComplete = results => {
            const total = sumResults(results);
            console.log('Opponent Score:', total);
            setOppRoll(total);
            Results.showResults(results);
        };
    }, []);

    // Decide winner once both rolls are in
    useEffect(() => {
        if (charRoll !== null && oppRoll !== null) {
            if (charRoll > oppRoll) setWinner('🎉 You win!');
            else if (oppRoll > charRoll) setWinner('😈 Opponent wins!');
            else setWinner("🤝 It's a tie!");
        }
    }, [charRoll, oppRoll]);

    const startDuel = () => {
        // Clear previous visuals & state
        CharacterDice.hide().clear();
        OpponentDice.hide().clear();
        Results.clear();
        setCharRoll(null);
        setOppRoll(null);
        setWinner(null);

        // Roll 1d6 for you, 1d4 for opponent
        CharacterDice.show().roll(DRP.parseNotation('2d6+1d8'), 'char');
        OpponentDice.show().roll(DRP.parseNotation('3d4+1d6'), 'opp');
    };

    return (
        <div className="dice-page">
            <h1>Dueling Dice</h1>
            <p>Roll 1d6 (you) vs 1d4 (opponent)</p>
            <button onClick={startDuel}>Start Duel</button>

            {winner && (
                <div className="duel-result">
                    <strong>{winner}</strong>
                    <div>Your roll: {charRoll} — Opponent: {oppRoll}</div>
                </div>
            )}

            {/* Mount point for the 3D dice canvas & results overlay */}
            <div id="dice-box"></div>
        </div>
    );
}
