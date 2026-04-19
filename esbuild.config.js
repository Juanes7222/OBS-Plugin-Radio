const esbuild = require('esbuild');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};

const define = {
  'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`
};

for (const key in env) {
  define[`process.env.${key}`] = JSON.stringify(env[key]);
}

const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: ['js/main.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'iife',
  define: define,
};

if (isWatch) {
  esbuild.context(options).then(ctx => {
    ctx.watch();
    console.log('Watching js/main.js for changes...');
  }).catch(() => process.exit(1));
} else {
  esbuild.build(options).catch(() => process.exit(1));
}
