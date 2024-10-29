import { Reporter } from '../reporter';
import { load } from 'cheerio';
import { writeFileSync } from 'node:fs';
import open from 'open';
import { fileActions, htmlReportBase } from './html-report-base';

const reportName = 'letify-report.html';

export class HtmlReporter extends Reporter {
  openReport() {
    console.log(`Opening report HTML report in your browser...`);
    return open(reportName);
  }

  generate() {
    const $ = load(htmlReportBase());
    const main = $('main');
    const h3 = $('<h3 class="text-center mb-4"></h3>');
    if (this.filesWithMultiSubscriptions === 0) {
      h3.text(
        `${this.result.filesScanned.toLocaleString()} files were scanned, and no duplicate subscriptions were found ✨`
      );
      main.append(h3);
      writeFileSync(reportName, $.html());

      return this;
    } else {
      h3.text(
        `${this.filesWithMultiSubscriptions.toLocaleString()} out of ${this.result.filesScanned.toLocaleString()} files had duplicate subscriptions`
      );
    }

    main.append(h3);

    if (this.result.templatesRequiringReview.length > 0) {
      const templatesSection = $(`<details>
        <summary>⚠️ Some templates might require manual review (${this.result.templatesRequiringReview.length})</summary>
</details>`);
      const detailsContent = $(`<div class="details-content">
<p class="mb-4">In the following templates we detected the async pipe usage, but the extracted count and actual count are different. Feel free to open an issue if necessary.</p>
</div>`);

      for (const reviewFile of this.result.templatesRequiringReview) {
        let relativePath = this.getRelativePath(reviewFile.file);
        const sections = relativePath.split('/');
        if (sections.length > 3) {
          relativePath = `.../${sections.slice(-3).join('/')}`;
        }
        const breakdown = $(`<details>
          <summary class="file-name">File: ${relativePath}${fileActions(
          reviewFile.file,
          $
        )}</summary>
          <ul>
            <li>Pipes count: ${reviewFile.pipeCount}</li>
            <li>Extracted count: ${reviewFile.extractedCount}</li>
          </ul>
        </details>`);
        detailsContent.append(breakdown);
      }
      templatesSection.append(detailsContent);
      main.append(templatesSection);
    }

    main.append(`<div class="flex justify-between mb-4">
    <h2>Subscriptions Breakdown</h2>
    <div class="flex gap-2">
    <button class="sm" id="expand-all">Expand</button>
    <button class="sm" id="collapse-all">Collapse</button>
</div>
</div>`);

    const breakdownSection = $('<div id="breakdown"></div>');
    for (const [filePath, occurrences] of Object.entries(
      this.result.fileAnalysis
    )) {
      const relativeFilePath = this.getRelativePath(filePath);
      const fileSection = $('<details open></details>');
      fileSection.append(`<summary class="file-name">
    File: ${relativeFilePath}
      ${fileActions(filePath, $)}
</summary>`);

      const detailsContent = $('<div class="details-content"></div>');

      const hasNonCompliantNames = occurrences.some((s) => !s.isCompliant);
      if (hasNonCompliantNames) {
        detailsContent.append(
          '<p class="warning">⚠️ Some stream names in this file didn\'t match the convention</p>'
        );
      }

      const table = $(`
        <table>
          <thead>
            <tr>
              ${this.config.cmd === 'fix' ? `<th>Variable Name</th>` : ''}
              <th>Stream Name</th>
              <th>Subscriptions</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      `);

      for (const occurrence of occurrences) {
        const row = $(`
          <tr>
            ${
              this.config.cmd === 'fix'
                ? `<td>${occurrence.variableName}</td>`
                : ''
            }
            <td class="${occurrence.isCompliant ? '' : 'warning'}">${
          occurrence.name
        }</td>
            <td>${occurrence.count}</td>
          </tr>
        `);
        table.find('tbody').append(row);
      }
      detailsContent.append(table);

      fileSection.append(detailsContent);
      breakdownSection.append(fileSection);
    }
    main.append(breakdownSection);

    $('head').append(`
        <script>
        function toggleDetails(isOpen) {
          return () => {
           document.querySelector('#breakdown').querySelectorAll('details').forEach((details) => {
            details.open = isOpen
          });
          }
        }
        document.addEventListener('DOMContentLoaded', () => {
          document.querySelector('#expand-all').addEventListener('click', toggleDetails(true));
          document.querySelector('#collapse-all').addEventListener('click', toggleDetails(false));
        });
      </script>
    `);

    writeFileSync(reportName, $.html());

    return this;
  }
}
