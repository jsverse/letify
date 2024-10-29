import { Reporter } from './reporter';
import { ListReporter } from './list-reporter';
import { JsonReporter } from './json-reporter';
import { HtmlReporter } from './html/html-reporter';
import { Options } from '../letify';

export type ReporterConstructor = new (
  options: ConstructorParameters<typeof Reporter>[0]
) => Reporter;
export const reporters: Record<Options['reporter'], ReporterConstructor> = {
  list: ListReporter,
  json: JsonReporter,
  html: HtmlReporter,
};
