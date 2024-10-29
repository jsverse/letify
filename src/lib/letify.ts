import { glob } from 'glob';
import ora from 'ora';
import { analyze } from './analyze';

export interface Options {
  inputs: string[];
  reporter: 'list' | 'json' | 'html';
  open: boolean;
  verifyConvention: boolean;
  variableSuffix: string;
}

export async function letify(cmd: 'analyze' | 'fix', options: Options) {
  const templateFiles = options.inputs
    .map((p) =>
      glob.sync(p, {
        ignore: ['**/node_modules/**', '**/dist/**'],
      })
    )
    .flat();
  const loader = ora();

  if (templateFiles.length === 0) {
    loader.warn('No files were found');
    return;
  }

  await analyze({ options, templateFiles, cmd });
}
