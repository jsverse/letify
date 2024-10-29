import { AnalysisResult, CmdConfig, Result } from './types';
import path from 'node:path';
import { readFile } from '@jsverse/utils/file';
import {
  parseTemplate as ngParseTemplate,
  tmplAstVisitAll,
} from '@angular/compiler';
import { underline } from './reporters/list-reporter';
import { reporters } from './reporters';
import { isCI, loader, verifyStreamName } from './utils';
import {
  AstPipeCollector,
  PropertyNameResolver,
  TmplPipeCollector,
} from '@jsverse/utils';
import { fixTemplate } from './fix-template';

export async function analyze({ options, templateFiles, cmd }: CmdConfig) {
  const templatesRequiringReview: Result['templatesRequiringReview'] = [];
  const fileAnalysis: Result['fileAnalysis'] = {};

  for (const file of templateFiles) {
    loader.start(`Analyzing ${path.basename(file)}`);
    const content = await readFile(file);
    const noComments = content.replace(/<!--[\s\S]*?-->/g, '');
    const asyncPipesCount = noComments.match(/\|\s*async/g)?.length ?? 0;

    if (!asyncPipesCount) continue;

    const parsedTemplate = ngParseTemplate(noComments, file, {
      preserveWhitespaces: false,
      preserveLineEndings: false,
      preserveSignificantWhitespace: false,
    });
    if (parsedTemplate.errors?.length > 0) {
      loader.fail(`@angular/compiler failed to parse ${file}, skipping...`);
      continue;
    }

    const tmplVisitor = new TmplPipeCollector('async');
    tmplAstVisitAll(tmplVisitor, parsedTemplate.nodes);
    const astVisitor = new AstPipeCollector();
    astVisitor.visitAll([...tmplVisitor.astTrees], {});

    const analysisResult: AnalysisResult = {};
    astVisitor.pipes
      .get('async')
      ?.map((pipe) => {
        const resolver = new PropertyNameResolver();
        resolver.visit(pipe.node.exp, {});

        return {
          ...pipe,
          name: resolver.path,
        };
      })
      .forEach(({ name, ...rest }) => {
        analysisResult[name] ??= { count: 0, pipes: [] };
        analysisResult[name].count++;
        analysisResult[name].pipes.push(rest);
      });

    // This means we have cases where the word 'async' is used but, we didn't extract the usage
    const totalExtractedPipes = Object.values(analysisResult).reduce(
      (acc, { count }) => acc + count,
      0
    );
    if (totalExtractedPipes === 0 || totalExtractedPipes !== asyncPipesCount) {
      templatesRequiringReview.push({
        file: path.resolve(file),
        pipeCount: asyncPipesCount,
        extractedCount: totalExtractedPipes,
      });
      continue;
    }

    const dupSubs = Object.entries(analysisResult).filter(
      ([, { count }]) => count > 1
    );
    if (dupSubs.length > 0) {
      let variablesAdded: Awaited<ReturnType<typeof fixTemplate>> = {};

      if (cmd === 'fix') {
        const parsedFile =
          parsedTemplate.nodes[0].sourceSpan.start.file.content;
        variablesAdded = await fixTemplate({
          variableSuffix: options.variableSuffix,
          content,
          dupSubs,
          parsedFile,
          file,
        });
      }

      fileAnalysis[file] = dupSubs.map(([name, { count }]) => ({
        name,
        count,
        isCompliant: options.verifyConvention ? verifyStreamName(name) : true,
        variableName: variablesAdded[name],
      }));
    }
  }

  loader.succeed(
    `${templateFiles.length.toLocaleString()} files were analyzed`
  );

  console.log('');
  console.log(underline('Execution Summary'));

  const duplicateSubCount = Object.keys(fileAnalysis).length;
  const hasDuplications = duplicateSubCount > 0;

  if (hasDuplications) {
    let totalSubs = 0;
    let reducedSubs = 0;

    for (const occurrences of Object.values(fileAnalysis)) {
      for (const { count } of occurrences) {
        totalSubs += count;
        reducedSubs++;
      }
    }
    const savedSubs = totalSubs - reducedSubs;
    console.log(
      `❗ ${duplicateSubCount.toLocaleString()} files had duplicated subscriptions in them`
    );
    const asPercent = Math.ceil((savedSubs / totalSubs) * 100);
    const msg = cmd === 'fix' ? '✨ Letify reduced' : '❗ You can reduce';
    console.log(
      `${msg} your subscriptions by ${asPercent}% (from ${totalSubs.toLocaleString()} to ${reducedSubs.toLocaleString()})`
    );
    if (cmd === 'fix') {
      console.log(
        '\nMake sure you manually review the changes, letify is not perfect'
      );
    }
  } else {
    console.log(`✨ No duplicate subscriptions were found`);
  }
  console.log('');

  const reporter = new reporters[options.reporter]({
    cmd,
    result: {
      templatesRequiringReview,
      filesScanned: templateFiles.length,
      fileAnalysis,
    },
  }).generate();

  if (options.open && !isCI) {
    reporter.openReport();
  }

  process.exit(hasDuplications ? 1 : 0);
}
