const path = require('path');
const program = require('commander');
const isGitClean = require('is-git-clean');
const chalk = require('chalk');
const execa = require('execa');

const jscodeshiftBin = require.resolve('.bin/jscodeshift');
const pkg = require('../package.json');

const transformersDir = path.join(__dirname, '../', 'transforms');

const transformers = [
  'v3-Component-to-compatible',
  'v3-component-with-string-icon-props-to-v4',
  'v3-Icon-to-v4-Icon',
  'v3-LocaleProvider-to-v4-ConfigProvider',
  'v3-Modal-method-with-icon-to-v4',
  'v4-Icon-Outlined',
];

program.version(`${pkg.name} ${pkg.version}`).usage('<command> [options]');

program
  .command('run')
  .description('antd codemod for antd v4 Form migration')
  .requiredOption('-p, --path <path>', 'The file path to transform')
  .option('-s, --style', 'Inject style from @ant-design/compatible')
  .action(async cmd => {
    // await ensureGitClean();
    if (!cmd.path) {
      console.log(chalk.yellow('You need to pass a `path` option'));
      process.exit(1);
    }
    run(cmd.path);
  });

program.parse(process.argv);

function getRunnerArgs(filePath, transformerPath) {
  const args = ['--verbose=2', '--ignore-pattern=**/node_modules/**'];

  const extname = path.extname(filePath);
  // use bablyon as default parser
  // will you use Flow?
  if (['.tsx', '.ts'].includes(extname)) {
    args.push('--parser', 'tsx');
    args.push('--extensions=tsx,ts,jsx,js');
  } else {
    args.push('--parser', 'babylon');
    args.push('--extensions=jsx,js');
  }

  args.push('--transform', transformerPath);
  args.push(filePath);
  return args;
}

async function run(filePath) {
  for (const transformer of transformers) {
    const transformerPath = path.join(transformersDir, `${transformer}.js`);
    console.log(chalk.bgGreen.bold('Transforming'), transformer);
    const args = getRunnerArgs(filePath, transformerPath);
    const result = await execa(jscodeshiftBin, args, {
      stdio: 'inherit',
      stripEof: false,
    });

    if (result.error) {
      console.error(result.error);
    }
  }
}

async function checkUpdates() {}

async function ensureGitClean() {
  let clean = false;
  try {
    clean = await isGitClean();
  } catch (err) {
    if (err && err.stderr && err.stderr.includes('Not a git repository')) {
      clean = true;
    }
  }

  if (!clean) {
    console.log(chalk.yellow('Sorry that there are still some git changes'));
    console.log('\n you must commit or stash them firstly');
    process.exit(1);
  }
}
