#!/usr/bin/env node
import { Argument, Option, program } from 'commander';
import { name, version } from '../package.json';
import { letify } from './lib/letify';

const cliName = 'letify';
const header = `${name}
-----------------
Optimize your Angular templates with the @let syntax
Version: ${version}
`;

program.name(cliName).version(version).addHelpText('before', header);

program
  .addArgument(
    new Argument('action', 'Which action to perform')
      .choices(['analyze', 'fix'])
      .argRequired()
      .default('analyze')
  )
  .argument('[input...]', 'Path to template files or a glob pattern');

program
  .option('-o, --open', 'Open the report (in case of html reporter)', false)
  .option('--verify-convention', 'Verify stream names are ending with $', false)
  .option(
    '--variable-suffix',
    'Adds a suffix to the declared variable in `fix` mode, mainly to avoid collisions',
    'value'
  )
  .addOption(
    new Option('-r, --reporter <type>', 'Reporter type')
      .choices(['list', 'json', 'html'])
      .default('html')
  );

program.action((cmd, inputs, options) => {
  letify(cmd, {
    inputs,
    ...options,
  });
});

program.parse(process.argv);
