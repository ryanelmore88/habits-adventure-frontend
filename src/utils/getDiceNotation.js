// src/utils/getDiceNotation.js

/**
 * For each attribute on the character (except Constitution),
 * pick a dice‐pool string based on its `level`:
 *
 *  Level 1 → 1d4
 *  Level 2 → 1d6
 *  Level 3 → 1d8
 *  Level 4 → 1d12
 *  Level 5 → 1d12 + 1d4
 *  Level 6 → 1d12 + 1d6
 *  Level 7 → 1d12 + 1d8
 *  Level 8 → 2d12
 *  Level 9 → 2d12 + 1d4
 *  Level 10→ 2d12 + 1d6
 *  …and so on
 */
export function getDiceNotation(character) {
    if (!character?.attributes) return {};

    const notation = {};
    for (const [attr, { level }] of Object.entries(character.attributes)) {
        if (attr === 'constitution') continue;  // skip Con

        const lvl = Math.max(0, Math.floor(level));      // sanitize
        const fullD12 = Math.floor(lvl / 4);             // how many full d12’s
        const rem     = lvl % 4;                         // leftover “small” die

        const parts = [];
        if (fullD12 > 0) {
            parts.push(`${fullD12}d12`);
        }
        if (rem > 0) {
            // map 1→d4, 2→d6, 3→d8
            const die = rem === 1 ? 4 : rem === 2 ? 6 : 8;
            parts.push(`1d${die}`);
        }

        // if level was zero (or negative), we’ll default to “1d4” or skip:
        notation[attr] = parts.length
            ? parts.join('+')
            : '1d4';
    }

    return notation;
}
