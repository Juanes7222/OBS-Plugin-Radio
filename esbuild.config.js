const esbuild = require('esbuild');

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
    entryPoints: ['js/main.js'],
    outfile: 'dist/bundle.js',
    bundle: true,
    format: 'iife',
    // OBS loads this file from disk; minifying cuts parse time for free.
    minify: !isWatch,
    sourcemap: isWatch ? 'inline' : false,
    legalComments: 'none',
};

if (isWatch) {
    esbuild.context(options)
        .then(async context => {
            await context.watch();
            console.log('Watching js/main.js for changes...');
        })
        .catch(() => process.exit(1));
} else {
    esbuild.build(options).catch(() => process.exit(1));
}
