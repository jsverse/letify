import { Options } from './letify';
import { AstPipeCollector } from '@jsverse/utils';

type FilePath = string;

interface SubscriptionOccurrence {
  name: string;
  count: number;
  isCompliant: boolean;
  variableName?: string;
}

interface ReviewFile {
  file: string;
  pipeCount: number;
  extractedCount: number;
}

export interface Result {
  filesScanned: number;
  templatesRequiringReview: ReviewFile[];
  fileAnalysis: Record<FilePath, SubscriptionOccurrence[]>;
}

export interface CmdConfig {
  cmd: 'analyze' | 'fix';
  options: Options;
  templateFiles: string[];
}

type MapValue<T> = T extends Map<unknown, infer I> ? I : never;
export type AnalysisResult = Record<
  string,
  {
    pipes: MapValue<AstPipeCollector['pipes']>;
    count: number;
  }
>;
