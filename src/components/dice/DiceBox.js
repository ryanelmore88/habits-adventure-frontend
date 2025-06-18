// File: src/components/dice/DiceBox.js
// Updated configuration for full-screen dice rolling

import DiceBox from "@3d-dice/dice-box";

/*  --------------- DICE BOX - FULL SCREEN CONFIG -------------- */
// Note the dice-box assets in the public folder.
// Those files are all necessary for the web workers to function properly

// Base configuration for full-screen dice rolling
const baseConfig = {
    id: "dice-canvas", // canvas element id
    assetPath: "/assets/dice-box/",
    startingHeight: 8,
    throwForce: 6,
    spinForce: 5,
    lightIntensity: 0.9,
    // Full-screen specific settings
    scale: 6,           // Make dice larger for full screen
    gravity: 1,         // Slower gravity for more dramatic rolls
    mass: 1,            // Standard mass
    friction: 0.8,      // Good bounce without being too bouncy
    restitution: 0.4,   // Bounce factor
    linearDamping: 0.4, // Air resistance
    angularDamping: 0.4 // Rotational resistance
};

// Default dice (neutral theme)
const Dice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
        ...baseConfig
    }
);

// Blue dice for your character
const CharacterDice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
        ...baseConfig,
        themeColor: "#0066ff"
    }
);

// Red dice for the opponent
const OpponentDice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
        ...baseConfig,
        themeColor: "#ff0000"
    }
);

// Enhanced initialization with full-screen support
const initializeDiceBox = async (diceInstance) => {
    try {
        await diceInstance.init();

        // Configure for full-screen rolling
        diceInstance.onBeforeRoll = () => {
            // Show the dice box when rolling starts
            const diceBox = document.getElementById('dice-box');
            if (diceBox) {
                diceBox.classList.add('rolling');
                diceBox.style.display = 'block';
            }
        };

        diceInstance.onAfterRoll = () => {
            // Keep dice box visible until cleared
            console.log('Dice roll completed');
        };

        // Enhanced clear function that hides the dice box
        const originalClear = diceInstance.clear.bind(diceInstance);
        diceInstance.clear = () => {
            originalClear();
            const diceBox = document.getElementById('dice-box');
            if (diceBox) {
                diceBox.classList.remove('rolling');
                // Small delay to allow dice to finish falling before hiding
                setTimeout(() => {
                    diceBox.style.display = 'none';
                }, 100);
            }
        };

        console.log('DiceBox initialized for full-screen rolling');
        return diceInstance;
    } catch (error) {
        console.error('Failed to initialize DiceBox:', error);
        throw error;
    }
};

// Initialize all dice instances
Promise.all([
    initializeDiceBox(Dice),
    initializeDiceBox(CharacterDice),
    initializeDiceBox(OpponentDice)
]).then(() => {
    console.log('All dice instances ready for full-screen rolling');
}).catch(error => {
    console.error('Error initializing dice:', error);
});

export { Dice, OpponentDice, CharacterDice, initializeDiceBox };