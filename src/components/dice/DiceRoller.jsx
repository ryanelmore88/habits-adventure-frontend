// File: src/components/dice/DiceRoller.jsx
// Updated for full-screen dice rolling support

import "../../styles/App.css";
import DisplayResults from "@3d-dice/dice-ui/src/displayResults";
import DiceParser from "@3d-dice/dice-parser-interface";
import { Dice } from "./DiceBox.js";
import AdvRollBtn from "./AdvRollBtn.jsx";

// create dice Roll Parser to handle complex notations
const DRP = new DiceParser();

// create display overlay for final results
const DiceResults = new DisplayResults("#dice-box");

// Enhanced initialization for full-screen support
Dice.init().then(() => {
    console.log("Dice initialized for full-screen rolling");

    // Enhanced click handler for full-screen clearing
    document.addEventListener("mousedown", (event) => {
        const diceBoxCanvas = document.getElementById("dice-canvas");
        const diceBox = document.getElementById("dice-box");

        // Only clear if dice box is visible and not clicking on UI buttons
        if (diceBoxCanvas &&
            window.getComputedStyle(diceBoxCanvas).display !== "none" &&
            !event.target.closest('button') &&
            !event.target.closest('.dice-ui-results')) {

            Dice.hide().clear();
            DiceResults.clear();

            // Hide the full-screen overlay
            if (diceBox) {
                diceBox.classList.remove('rolling');
                diceBox.style.display = 'none';
            }
        }
    });

    // Optional: ESC key to clear dice
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            const diceBoxCanvas = document.getElementById("dice-canvas");
            if (diceBoxCanvas && window.getComputedStyle(diceBoxCanvas).display !== "none") {
                Dice.hide().clear();
                DiceResults.clear();

                const diceBox = document.getElementById("dice-box");
                if (diceBox) {
                    diceBox.classList.remove('rolling');
                    diceBox.style.display = 'none';
                }
            }
        }
    });
});

export default function App() {
    // Enhanced roll complete handler
    Dice.onRollComplete = (results) => {
        console.log("Full-screen dice roll results:", results);

        // handle any rerolls
        const rerolls = DRP.handleRerolls(results);
        if (rerolls.length) {
            rerolls.forEach((roll) => Dice.add(roll, roll.groupId));
            return rerolls;
        }

        // if no rerolls needed then parse the final results
        const finalResults = DRP.parseFinalResults(results);

        // show the results with enhanced full-screen display
        DiceResults.showResults(finalResults);

        // Keep dice box visible for result viewing
        const diceBox = document.getElementById("dice-box");
        if (diceBox) {
            diceBox.classList.add('rolling'); // Keep it visible
        }
    };

    // Enhanced dice roll trigger for full-screen
    const rollDice = (notation, group) => {
        console.log(`Rolling ${notation} in full-screen mode`);

        // Show the full-screen dice box
        const diceBox = document.getElementById("dice-box");
        if (diceBox) {
            diceBox.classList.add('rolling');
            diceBox.style.display = 'block';
        }

        // Clear any previous results
        DiceResults.clear();

        // trigger the dice roll using the parser
        Dice.show().roll(DRP.parseNotation(notation));
    };

    return (
        <div className="App">
            {/*
                This empty div is where Dice-Box will inject its <canvas>.
                The CSS will position it to fill the entire viewport when rolling.
            */}
            <div id="dice-box"></div>

            <h1>Full-Screen Dice Rolling</h1>
            <p>Click anywhere on the screen (except buttons) or press ESC to clear dice</p>

            <div className="diceButtonList">
                <span className="header">Standard Dice</span>
                <span className="header">Notation</span>
                <span className="header">Description</span>

                <button onClick={() => rollDice("1d4")}>d4</button>
                <span className="diceNotation">1d4</span>
                <span>Four-sided die</span>

                <button onClick={() => rollDice("1d6")}>d6</button>
                <span className="diceNotation">1d6</span>
                <span>Six-sided die</span>

                <button onClick={() => rollDice("1d8")}>d8</button>
                <span className="diceNotation">1d8</span>
                <span>Eight-sided die</span>

                <button onClick={() => rollDice("1d10")}>d10</button>
                <span className="diceNotation">1d10</span>
                <span>Ten-sided die</span>

                <button onClick={() => rollDice("1d12")}>d12</button>
                <span className="diceNotation">1d12</span>
                <span>Twelve-sided die</span>

                <button onClick={() => rollDice("1d20")}>d20</button>
                <span className="diceNotation">1d20</span>
                <span>Twenty-sided die</span>

                <button onClick={() => rollDice("1d100")}>d100</button>
                <span className="diceNotation">1d100</span>
                <span>Hundred-sided die</span>

                <span className="header">Multiple Dice</span>
                <span className="header">Notation</span>
                <span className="header">Description</span>

                <button onClick={() => rollDice("2d6")}>2d6</button>
                <span className="diceNotation">2d6</span>
                <span>Two six-sided dice</span>

                <button onClick={() => rollDice("3d6")}>3d6</button>
                <span className="diceNotation">3d6</span>
                <span>Three six-sided dice</span>

                <button onClick={() => rollDice("4d6")}>4d6</button>
                <span className="diceNotation">4d6</span>
                <span>Four six-sided dice</span>
            </div>

            <AdvRollBtn onRoll={rollDice} />
        </div>
    );
}