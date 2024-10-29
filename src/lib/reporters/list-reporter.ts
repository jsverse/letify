import { Reporter } from './reporter';
import CliTable from 'cli-table3';

export class ListReporter extends Reporter {
  generate() {
    if (this.filesWithMultiSubscriptions === 0) {
      return this;
    }

    if (this.result.templatesRequiringReview.length > 0) {
      console.log(
        `\n⚠️ Some templates might require manual review (${this.result.templatesRequiringReview.length.toLocaleString()})`
      );
      console.log(
        'In the following templates we detected the async operator usage, but we were unable to extract the usage. Feel free to open an issue if necessary.'
      );
      const table = new CliTable({
        head: ['File', 'Pipes Count', 'Extracted Count'],
      });
      for (const { pipeCount, extractedCount, file } of this.result
        .templatesRequiringReview) {
        table.push([file, pipeCount, extractedCount]);
      }
      console.log(table.toString());
      console.log();
    }

    for (const [filePath, occurrences] of Object.entries(
      this.result.fileAnalysis
    )) {
      const relativeFilePath = this.getRelativePath(filePath);
      console.log(underline(relativeFilePath));

      const hasNonCompliantNames = occurrences.some((s) => !s.isCompliant);
      if (hasNonCompliantNames) {
        console.log(
          "⚠️  Some stream names in this file didn't match the convention\n"
        );
      }

      const headers = ['Stream Name', 'Subscriptions'];
      if (this.config.cmd === 'fix') {
        headers.unshift('Variable Name');
      }
      const table = new CliTable({
        head: headers,
      });
      for (const { name, count, isCompliant, variableName } of occurrences) {
        const row = [];
        if (variableName) {
          row.push(variableName);
        }
        if (isCompliant) {
          row.push(name);
        } else {
          row.push(`\x1b[31m${name}\x1b[0m`);
        }
        row.push(count);
        table.push(row);
      }
      console.log(table.toString());
      console.log();
    }

    return this;
  }
}

export function underline(text: string) {
  return `\x1b[4m${text}\x1b[0m`;
}
