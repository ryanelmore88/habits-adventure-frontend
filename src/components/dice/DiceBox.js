import DiceBox from "@3d-dice/dice-box";

/*  --------------- DICE BOX -------------- */
// Note the dice-box assets in the public folder.
// Those files are all necessary for the web workers to function properly
// create new DiceBox class
const Dice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
        id: "dice-canvas", // canvas element id
        assetPath: "/assets/dice-box/",
        startingHeight: 8,
        throwForce: 6,
        spinForce: 5,
        lightIntensity: 0.9
    }
);

// blue for your character themeColor: "#0066ff"
const CharacterDice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
            id: "dice-canvas", // canvas element id
            assetPath: "/assets/dice-box/",
            startingHeight: 8,
            throwForce: 6,
            spinForce: 5,
            lightIntensity: 0.9,
            themeColor: "#0066ff"
    }
);

// red for the opponent themeColor: "#ff0000"
const OpponentDice = new DiceBox(
    "#dice-box", // target DOM element to inject the canvas for rendering
    {
            id: "dice-canvas", // canvas element id
            assetPath: "/assets/dice-box/",
            startingHeight: 8,
            throwForce: 6,
            spinForce: 5,
            lightIntensity: 0.9,
            themeColor: "#ff0000"
    }
);

// for backwards-compat you can still default `Dice` to CharacterDice
// export const Dice = CharacterDice;

// const Dice = new DiceBox({
//         assetPath: '/assets/dice-box/' // include the trailing backslash
// })

export { Dice, OpponentDice, CharacterDice };