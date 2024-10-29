import path from 'node:path';
import { CmdConfig, Result } from '../types';

export abstract class Reporter {
  protected filesWithMultiSubscriptions = 0;

  constructor(
    protected readonly config: {
      cmd: CmdConfig['cmd'];
      result: Result;
    }
  ) {
    this.filesWithMultiSubscriptions = Object.keys(
      this.result.fileAnalysis
    ).length;
  }

  abstract generate(): this;

  openReport(): Promise<unknown> {
    return Promise.resolve();
  }

  protected get result() {
    return this.config.result;
  }

  protected getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }
}
