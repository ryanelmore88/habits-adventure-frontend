// src/utils/dicePoolUtils.js

/**
 * Calculate dice pool for a character based on their attributes
 * New characters should roll 5d4 (one for each attribute except constitution)
 */

export function calculateCharacterDicePool(character) {
    if (!character?.attributes) {
        return {
            dicePool: '1d4',
            totalDice: 1,
            breakdown: { default: 1 },
            description: 'Default (no attributes found)'
        };
    }

    // Attributes that contribute to dice pool (excluding constitution)
    const diceAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
    const breakdown = {};
    let totalDice = 0;

    // Calculate dice per attribute
    diceAttributes.forEach(attrName => {
        const attribute = character.attributes[attrName];
        if (attribute) {
            // Simple approach: each attribute contributes 1d4 base
            // Can be enhanced based on attribute scores later
            const baseScore = attribute.base || 10;

            // Basic formula: 1d4 per attribute, with potential bonuses
            // Every 4 points above 10 adds an extra die
            const baseDice = 1;
            const bonusDice = Math.floor(Math.max(0, baseScore - 10) / 4);
            const totalForAttribute = baseDice + bonusDice;

            breakdown[attrName] = totalForAttribute;
            totalDice += totalForAttribute;
        }
    });

    // Ensure minimum dice pool
    if (totalDice === 0) {
        totalDice = 1;
        breakdown.default = 1;
    }

    return {
        dicePool: `${totalDice}d4`,
        totalDice,
        breakdown,
        description: Object.entries(breakdown)
            .map(([attr, count]) => `${attr.slice(0, 3).toUpperCase()}(${count})`)
            .join(', ')
    };
}

/**
 * Alternative calculation using your existing getDiceNotation approach
 * This would use the level-based system from your original utility
 */
export function calculateDicePoolFromLevels(character) {
    if (!character?.attributes) {
        return {
            dicePool: '1d4',
            totalDice: 1,
            breakdown: { default: 1 },
            description: 'Default (no attributes found)'
        };
    }

    const diceAttributes = ['strength', 'dexterity', 'intelligence', 'wisdom', 'charisma'];
    const breakdown = {};
    const diceParts = [];
    let totalDice = 0;

    diceAttributes.forEach(attrName => {
        const attribute = character.attributes[attrName];
        if (attribute) {
            // Use a level system based on attribute scores
            // This maps attribute scores to "levels" for dice calculation
            const score = attribute.base || 10;
            const level = Math.max(1, Math.floor((score - 8) / 2)); // Level 1-6+ based on score

            // Calculate dice based on level (from your original getDiceNotation logic)
            const fullD12 = Math.floor(level / 4);
            const remainder = level % 4;

            const parts = [];
            if (fullD12 > 0) {
                parts.push(`${fullD12}d12`);
            }
            if (remainder > 0) {
                const die = remainder === 1 ? 4 : remainder === 2 ? 6 : 8;
                parts.push(`1d${die}`);
                if (die === 4) totalDice += 1;
            }

            if (parts.length > 0) {
                diceParts.push(parts.join('+'));
                breakdown[attrName] = parts.join('+');
            }
        }
    });

    // Combine all dice into one pool for simplicity
    const dicePool = diceParts.length > 0 ? diceParts.join('+') : '1d4';

    return {
        dicePool,
        totalDice: totalDice || diceParts.length || 1,
        breakdown,
        description: Object.entries(breakdown)
            .map(([attr, dice]) => `${attr.slice(0, 3).toUpperCase()}(${dice})`)
            .join(', ')
    };
}

/**
 * Simple dice pool for new characters - exactly 5d4
 * This ensures new characters always start with a proper dice pool
 */
export function getNewCharacterDicePool() {
    return {
        dicePool: '5d4',
        totalDice: 5,
        breakdown: {
            strength: 1,
            dexterity: 1,
            intelligence: 1,
            wisdom: 1,
            charisma: 1
        },
        description: 'STR(1), DEX(1), INT(1), WIS(1), CHA(1)'
    };
}

/**
 * Parse a dice pool string and calculate expected values
 */
export function analyzeDicePool(dicePool) {
    if (!dicePool || typeof dicePool !== 'string') {
        return { min: 0, max: 0, average: 0, description: 'Invalid dice pool' };
    }

    // Handle complex dice pools like "5d4" or "2d6+3d4+1"
    const parts = dicePool.split('+');
    let min = 0;
    let max = 0;
    let average = 0;

    for (const part of parts) {
        const trimmedPart = part.trim();

        // Check if it's just a number (flat bonus)
        if (/^\d+$/.test(trimmedPart)) {
            const bonus = parseInt(trimmedPart);
            min += bonus;
            max += bonus;
            average += bonus;
            continue;
        }

        // Parse dice notation
        const match = trimmedPart.match(/(\d+)d(\d+)/);
        if (match) {
            const [, numDice, dieSize] = match;
            const num = parseInt(numDice);
            const size = parseInt(dieSize);

            min += num; // Minimum roll (all 1s)
            max += num * size; // Maximum roll (all max)
            average += num * ((size + 1) / 2); // Average roll
        }
    }

    return {
        min,
        max,
        average: Math.round(average * 100) / 100,
        description: `${dicePool}: ${min}-${max} (avg ${Math.round(average * 100) / 100})`
    };
}

/**
 * Roll dice based on a dice pool string
 * This is a utility version of the rolling logic
 */
export function rollDicePool(dicePool) {
    if (!dicePool || typeof dicePool !== 'string') {
        return { total: 0, rolls: [], breakdown: {} };
    }

    const parts = dicePool.split('+');
    let total = 0;
    const allRolls = [];
    const breakdown = {};

    for (const part of parts) {
        const trimmedPart = part.trim();

        // Handle flat bonuses
        if (/^\d+$/.test(trimmedPart)) {
            const bonus = parseInt(trimmedPart);
            total += bonus;
            breakdown[`+${bonus}`] = bonus;
            continue;
        }

        // Handle dice notation
        const match = trimmedPart.match(/(\d+)d(\d+)/);
        if (match) {
            const [, numDice, dieSize] = match;
            const num = parseInt(numDice);
            const size = parseInt(dieSize);
            const partRolls = [];

            for (let i = 0; i < num; i++) {
                const roll = Math.floor(Math.random() * size) + 1;
                partRolls.push(roll);
                allRolls.push(roll);
                total += roll;
            }

            breakdown[trimmedPart] = {
                rolls: partRolls,
                total: partRolls.reduce((a, b) => a + b, 0)
            };
        }
    }

    return {
        total,
        rolls: allRolls,
        breakdown,
        dicePool
    };
}