const tsConfigPaths = require('tsconfig-paths');
const path = require('path');
const tsConfig = require('./tsconfig.json');

// The compiled JS lives in dist/src/, so we need baseUrl to point there
// so tsconfig-paths can resolve @/* aliases to the correct compiled files.
const baseUrl = path.resolve(__dirname, 'dist');

tsConfigPaths.register({
    baseUrl,
    paths: tsConfig.compilerOptions.paths,
});
