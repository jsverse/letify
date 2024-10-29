<div align="center">
  <img width="300px" src="./logo-gradient.svg" alt="Letify Logo">
</div>

<h3 align="center">It sounds like a spell and works like a charm ✨</h3>

<div align="center">
  <a href="https://www.npmjs.com/package/@jsverse/letify">
    <img src="https://img.shields.io/npm/v/@jsverse/letify.svg?style=flat-square" alt="npm version">
  </a>
  <a href="https://github.com/jsverse/letify/actions/workflows/ci.yml">
    <img src="https://github.com/jsverse/letify/workflows/CI/badge.svg" alt="build status">
  </a>
  <a href="https://www.npmjs.com/package/@jsverse/letify">
    <img src="https://img.shields.io/npm/dt/@jsverse/letify.svg?style=flat-square" alt="npm downloads">
  </a>
  <a href="https://github.com/jsverse/letify/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/jsverse/letify.svg?style=flat-square" alt="license">
  </a>
</div>

--------------------

Letify CLI helps Angular developers optimize their templates by scanning your files and detecting multiple async subscriptions to the same stream.

### Usage
To get started, install Letify CLI:

```bash
npm i -D @jsverse/letify
```

Then, run the command:
```bash
npx letify [analyze|fix] 'a/b.html' 'c/**/*.html' ...
```

* `analyze`: Identifies duplicate subscriptions in the specified files and generates a report.
* `fix`: Identifies duplicate subscriptions and replace duplications with a single `@let` declaration at the beginning of the template.

#### CI / Lint-
Letify will return an error exit code if any duplicate subscriptions are detected in the specified files.
It can be seamlessly integrated into your [lint-staged](https://github.com/lint-staged/lint-staged) or CI workflows to
prevent duplicate subscriptions from being committed.

#### Usage notes
* Letify ignores commented code and does not analyze it.
* Keyed reads (`data[prop] | async`) and function calls with arguments (`myMethod(value, ...) | async`) are currently not supported.
* You'll need Angular `>=18.1` to use the `@let` syntax, if you are using an older version, run the `analyze` command and
use alternatives to reuse your subscriptions.

### Options

* `-r, --reporter <type>`: Specifies the report format:
  * `html` (default): Generates an HTML report.
  * `list`: Outputs a simple list of suggestions.
  * `json`: Provides a JSON report for programmatic use.
* `-o, --open`: Automatically opens the HTML report once generated (default `true`.
* `--verify-convention` (default: `false`): Checks that stream names (observables) in the templates follow the convention of ending with a `$` sign.
* `--variable-suffix` (default: `value`): Adds a suffix to the declared variable in `fix` mode, mainly to avoid collisions.

### Debugging

You can extend the default logs by setting the `DEBUG` environment variable:
```bash
DEBUG=letify:* npx letify ...
```
Supported namespaces: `letify:*|letify:fix`.
