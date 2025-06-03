// src/utils/getDiceNotation.js

/**
 * Enhanced version of getDiceNotation that works with the new combat system
 * For each attribute on the character (except Constitution),
 * pick a dice‐pool string based on its effective level:
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
    for (const [attr, attributeData] of Object.entries(character.attributes)) {
        if (attr === 'constitution') continue;  // skip Con

        // Calculate effective level from base score and habit points
        const baseScore = attributeData.base || 10;
        const habitPoints = attributeData.habit_points || 0;
        const totalBonus = attributeData.bonus || 0;

        // Convert attribute power to dice level
        // Base approach: higher scores = higher levels
        const effectiveLevel = Math.max(1, Math.floor((baseScore + habitPoints - 8) / 2));

        const lvl = Math.max(0, Math.floor(effectiveLevel));
        const fullD12 = Math.floor(lvl / 4);             // how many full d12's
        const rem     = lvl % 4;                         // leftover "small" die

        const parts = [];
        if (fullD12 > 0) {
            parts.push(`${fullD12}d12`);
        }
        if (rem > 0) {
            // map 1→d4, 2→d6, 3→d8
            const die = rem === 1 ? 4 : rem === 2 ? 6 : 8;
            parts.push(`1d${die}`);
        }

        // if level was zero (or negative), we'll default to "1d4"
        notation[attr] = parts.length
            ? parts.join('+')
            : '1d4';
    }

    return notation;
}

/**
 * Get combined dice pool for combat
 * Returns a single dice pool string for the character
 */
export function getCombinedDicePool(character) {
    const notation = getDiceNotation(character);
    const diceParts = Object.values(notation);

    if (diceParts.length === 0) {
        return '1d4';
    }

    // For simplicity in 3D dice rolling, convert everything to d4s
    // This is optional - you could keep the complex notation
    return simplifyDicePool(diceParts.join('+'));
}

/**
 * Simplify complex dice pools into d4s for easier 3D visualization
 * This converts things like "1d6+1d8+1d4" into "6d4" (approximately equivalent)
 */
export function simplifyDicePool(dicePool) {
    if (!dicePool) return '1d4';

    const parts = dicePool.split('+');
    let totalD4Equivalent = 0;

    for (const part of parts) {
        const trimmedPart = part.trim();
        const match = trimmedPart.match(/(\d+)d(\d+)/);

        if (match) {
            const [, numDice, dieSize] = match;
            const num = parseInt(numDice);
            const size = parseInt(dieSize);

            // Convert to d4 equivalents based on average value
            // d4 average = 2.5, d6 average = 3.5, d8 average = 4.5, d12 average = 6.5
            const averageValue = num * ((size + 1) / 2);
            const d4Equivalent = Math.max(1, Math.round(averageValue / 2.5));
            totalD4Equivalent += d4Equivalent;
        }
    }

    return totalD4Equivalent > 0 ? `${totalD4Equivalent}d4` : '1d4';
}

/**
 * Calculate dice pool for new characters
 * Ensures new characters get exactly 5d4 (one per non-constitution attribute)
 */
export function getNewCharacterDiceNotation() {
    return {
        strength: '1d4',
        dexterity: '1d4',
        intelligence: '1d4',
        wisdom: '1d4',
        charisma: '1d4'
    };
}

/**
 * Analyze dice notation to get statistics
 */
export function analyzeDiceNotation(notation) {
    const analysis = {};

    for (const [attr, diceString] of Object.entries(notation)) {
        const parts = diceString.split('+');
        let min = 0, max = 0, average = 0;

        for (const part of parts) {
            const trimmedPart = part.trim();
            const match = trimmedPart.match(/(\d+)d(\d+)/);

            if (match) {
                const [, numDice, dieSize] = match;
                const num = parseInt(numDice);
                const size = parseInt(dieSize);

                min += num;
                max += num * size;
                average += num * ((size + 1) / 2);
            }
        }

        analysis[attr] = {
            diceString,
            min,
            max,
            average: Math.round(average * 100) / 100
        };
    }

    return analysis;
}

/**
 * Helper to validate dice notation
 */
export function isValidDiceNotation(diceString) {
    if (!diceString || typeof diceString !== 'string') return false;

    const parts = diceString.split('+');
    for (const part of parts) {
        const trimmedPart = part.trim();
        // Should match patterns like "1d4", "2d6", "3d12", etc.
        if (!/^\d+d\d+$/.test(trimmedPart)) {
            return false;
        }
    }
    return true;
}