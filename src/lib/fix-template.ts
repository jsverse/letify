import { writeFile } from 'node:fs/promises';
import { escapeRegExp, toCamelCase, verifyStreamName } from './utils';
import { AnalysisResult } from './types';
import { PropertyNameResolver } from '@jsverse/utils';
import debug from 'debug';

export async function fixTemplate({
  content,
  dupSubs,
  file,
  parsedFile,
  variableSuffix,
}: {
  content: string;
  dupSubs: [string, AnalysisResult[string]][];
  file: string;
  parsedFile: string;
  variableSuffix: string;
}) {
  let updatedTemplate = content;
  const variables: Record<string, string> = {};
  for (const [pipeName, { pipes }] of dupSubs) {
    const resolver = new PropertyNameResolver({
      // we want the right side of the expression as it's what we will pass to the async pipe
      binaryNavigator: (ast) => ast.right,
    });
    const [pipe] = pipes;
    resolver.visit(pipe.node.exp, {});
    const name = resolver.segments.filter((p) => p !== 'asObservable').pop();
    const letName = toCamelCase(
      `${verifyStreamName(name) ? name.slice(0, -1) : name}-${variableSuffix}`
    );

    const regex = `${escapeRegExp(resolver.path)}[^\\s]*\\s?\\|\\s?async`;
    const asyncPipeReg = new RegExp(regex).exec(parsedFile);

    if (!asyncPipeReg) {
      if (debug.enabled('letify:fix')) {
        console.log({ file, path: resolver.path, regex });
      }
      variables[pipeName] = '⚠️ Not created, unable to resolve pipe expression';
      continue;
    }

    const [asyncPipe] = asyncPipeReg;

    if (/\(.+\)/.test(asyncPipe)) {
      if (debug.enabled('letify:fix')) {
        console.log({ file, path: resolver.path, regex, asyncPipe });
      }
      variables[pipeName] = '⚠️ Not created, arguments are not supported';
      continue;
    }
    updatedTemplate = updatedTemplate.replace(
      new RegExp(escapeRegExp(asyncPipe), 'g'),
      letName
    );
    updatedTemplate = `@let ${letName} = ${asyncPipe};\n${updatedTemplate}`;
    variables[pipeName] = letName;
  }
  await writeFile(file, updatedTemplate);

  return variables;
}
