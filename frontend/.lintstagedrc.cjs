// Chunk file list to stay under Windows cmd.exe's 8191-char limit when
// committing many files at once. ESLint is invoked once per chunk.
const CHUNK = 25;

/** @type {import('lint-staged').Configuration} */
module.exports = {
    'src/**/*.{ts,tsx}': (files) => {
        const cmds = [];
        for (let i = 0; i < files.length; i += CHUNK) {
            const slice = files.slice(i, i + CHUNK);
            cmds.push(
                `eslint --fix ${slice.map((f) => `"${f}"`).join(' ')}`,
            );
        }
        return cmds;
    },
};
