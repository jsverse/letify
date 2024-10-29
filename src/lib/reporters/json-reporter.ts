import { Reporter } from './reporter';
import { writeFileSync } from 'node:fs';

export class JsonReporter extends Reporter {
  generate() {
    writeFileSync(
      'subscription-report.json',
      JSON.stringify(
        {
          filesWithMultiSubscriptions: this.filesWithMultiSubscriptions,
          ...this.result,
        },
        null,
        2
      )
    );

    return this;
  }
}
