/**
 * Basic JavaScript project entry file
 * Usage:
 *   node index.js         # run default
 *   node index.js --name Alice
 */

'use strict';

/**
 * Initialize application with optional config.
 * @param {Object} [config]
 */
function init(config = {}) {
    const defaults = { env: process.env.NODE_ENV || 'development' };
    return Object.assign({}, defaults, config);
}

/**
 * Simple greeting utility.
 * @param {string} name
 */
function greet(name = 'World') {
    return `Hello, ${name}!`;
}

/**
 * Main entry point for CLI usage.
 * @param {string[]} args
 */
async function run(args = []) {
    const opts = parseArgs(args);
    const config = init(opts.config);
    console.log(`[${config.env}]`, greet(opts.name));
}

/**
 * Minimal argument parser.
 */
function parseArgs(args) {
    const out = { name: 'World', config: {} };
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '--name' && args[i + 1]) {
            out.name = args[++i];
        } else if (a === '--env' && args[i + 1]) {
            out.config.env = args[++i];
        }
    }
    return out;
}

module.exports = { init, greet, run };

if (require.main === module) {
    run(process.argv.slice(2)).catch(err => {
        console.error('Fatal:', err);
        process.exit(1);
    });
}