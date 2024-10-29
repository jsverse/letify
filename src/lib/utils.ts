import ora from 'ora';

export const loader = ora();
export const isCI = process.env.CI === 'true';

export function verifyStreamName(name: string) {
  return name.endsWith('$');
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index == 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+|_|-|\//g, '');
}
