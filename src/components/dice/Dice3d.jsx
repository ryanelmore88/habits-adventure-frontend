import React, { useRef, useLayoutEffect, useEffect } from 'react';
import DiceBox from '@3d-dice/dice-box';

const Dice3D = ({ notation = "1d20", rollTrigger, onRollComplete }) => {
    const diceBoxRef = useRef(null);

    useLayoutEffect(() => {
        const diceBox = new DiceBox("#dice-container", {
            id: "dice-canvas",
            theme: "default",
            gravity: 9.8,
            assetPath: "/dice-assets/" // adjust as needed
        });

        diceBoxRef.current = diceBox;

        diceBox.init().then(() => {
            diceBox.showSelector = false;
            diceBox.animateSelector = false;
        });

        return () => {
            diceBoxRef.current?.destroy?.();
        };
    }, []);

    useEffect(() => {
        if (rollTrigger && diceBoxRef.current) {
            diceBoxRef.current.roll(notation).then((results) => {
                const total = results.reduce((sum, r) => sum + (r?.value || 0), 0);
                onRollComplete?.({ rolls: results, total });
            });
        }
    }, [rollTrigger, notation]);

    return (
        <div
            id="dice-container"
            style={{ width: "100%", height: "300px", background: "#111" }}
        />
    );
};

export default Dice3D;
