import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-instructions',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-header">
      <div>
        <span class="eyebrow">Operator guide</span>
        <h1>How to use Bulk Extractor</h1>
        <p>Organise evidence into cases, run scans, and review extracted forensic artefacts.</p>
      </div>
      <a class="btn btn-primary" routerLink="/cases">Open Cases</a>
    </div>

    <div class="notice">
      <strong>Before you scan</strong>
      <span>The application currently accepts a server-side file path, not a browser upload. The evidence must already be available to the Bulk Extractor worker.</span>
    </div>

    @for (step of steps; track step.number) {
      <section>
        <div class="section-head">
          <span class="step-number">{{ step.number }}</span>
          <div><h2>{{ step.title }}</h2><p>{{ step.summary }}</p></div>
        </div>
        <div class="instruction-card">
          <ol>
            @for (instruction of step.instructions; track instruction) {
              <li>{{ instruction }}</li>
            }
          </ol>
        </div>
      </section>
    }

    <section>
      <div class="section-head">
        <span class="step-number">04</span>
        <div><h2>Understand the result tabs</h2><p>Each view answers a different investigative question.</p></div>
      </div>
      <div class="result-grid">
        @for (result of results; track result.name) {
          <article class="result-card">
            <span>{{ result.code }}</span>
            <h3>{{ result.name }}</h3>
            <p>{{ result.description }}</p>
          </article>
        }
      </div>
    </section>

    <section class="reference-section">
      <div class="section-head">
        <span class="step-number">05</span>
        <div><h2>What the software does</h2><p>A detailed reference for the engine and this application.</p></div>
      </div>
      <div class="explanation-card">
        <p>
          Bulk Extractor reads evidence as blocks of raw data and searches those blocks for recognisable
          forensic patterns. It does not depend on opening files through the source filesystem. Recursive
          scanners can unpack supported compressed or container data and scan the recovered content again.
        </p>
        <div class="process-flow">
          @for (stage of process; track stage.code) {
            <div class="process-stage">
              <span>{{ stage.code }}</span>
              <div><strong>{{ stage.name }}</strong><p>{{ stage.description }}</p></div>
            </div>
          }
        </div>
      </div>
    </section>

    <section>
      <div class="section-head">
        <span class="step-number">06</span>
        <div><h2>Application features</h2><p>What each part of this web application provides.</p></div>
      </div>
      <div class="feature-grid">
        @for (feature of applicationFeatures; track feature.name) {
          <article class="feature-card">
            <h3>{{ feature.name }}</h3>
            <p>{{ feature.description }}</p>
          </article>
        }
      </div>
    </section>

    <section>
      <div class="section-head">
        <span class="step-number">07</span>
        <div><h2>Evidence you can ingest</h2><p>Examples of source material that can be submitted for scanning.</p></div>
      </div>
      <div class="evidence-grid">
        @for (evidence of evidenceExamples; track evidence.name) {
          <article class="feature-card">
            <code>{{ evidence.example }}</code>
            <h3>{{ evidence.name }}</h3>
            <p>{{ evidence.description }}</p>
          </article>
        }
      </div>
      <div class="notice evidence-note">
        <strong>Current input rule</strong>
        <span>Submit the complete path to one accessible file. This version does not provide browser upload, folder ingestion, live-device acquisition, or E01 image support.</span>
      </div>
    </section>

    <section>
      <div class="section-head">
        <span class="step-number">08</span>
        <div><h2>Common extracted feature types</h2><p>The feature types displayed depend on what the enabled scanners find.</p></div>
      </div>
      <div class="definition-table">
        @for (feature of extractedFeatures; track feature.name) {
          <div class="definition-row">
            <code>{{ feature.name }}</code>
            <span>{{ feature.description }}</span>
          </div>
        }
      </div>
    </section>

    <section>
      <div class="section-head">
        <span class="step-number">09</span>
        <div><h2>Understanding result fields</h2><p>How to interpret the information shown for each finding.</p></div>
      </div>
      <div class="definition-table">
        @for (field of resultFields; track field.name) {
          <div class="definition-row">
            <strong>{{ field.name }}</strong>
            <span>{{ field.description }}</span>
          </div>
        }
      </div>
    </section>

    <section>
      <div class="section-head">
        <span class="step-number">10</span>
        <div><h2>Current scope and limitations</h2><p>Capabilities that are and are not available in this version.</p></div>
      </div>
      <div class="scope-grid">
        <div class="scope-card available">
          <h3>Available now</h3>
          <ul>@for (item of availableNow; track item) { <li>{{ item }}</li> }</ul>
        </div>
        <div class="scope-card unavailable">
          <h3>Not currently provided</h3>
          <ul>@for (item of notProvided; track item) { <li>{{ item }}</li> }</ul>
        </div>
      </div>
    </section>

    <div class="notice caution">
      <strong>Investigative caution</strong>
      <span>Extracted values and alerts are leads, not automatic proof. Validate findings against the original evidence and preserve your investigative record.</span>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 22px; }
    .eyebrow { color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin-top: 6px; color: var(--text); font-size: 26px; font-weight: 600; }
    .page-header p, .section-head p, .result-card p { color: var(--muted); font-size: 14px; line-height: 1.6; }
    .page-header p { margin-top: 7px; }
    .notice { display: grid; grid-template-columns: 160px 1fr; gap: 16px; padding: 15px 17px; border: 1px solid rgba(125, 211, 252, .3); border-radius: 10px; background: rgba(125, 211, 252, .1); color: var(--muted); font-size: 14px; line-height: 1.6; }
    .notice strong { color: var(--accent-2); }
    .notice.caution { margin-top: 28px; border-color: rgba(77, 212, 198, .3); background: rgba(77, 212, 198, .08); }
    .notice.caution strong { color: var(--accent); }
    section { margin-top: 30px; }
    .section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 11px; }
    .section-head h2 { color: var(--text); font-size: 17px; font-weight: 600; }
    .step-number { width: 38px; height: 38px; flex: 0 0 38px; display: grid; place-items: center; border: 1px solid rgba(77, 212, 198, .34); border-radius: 9px; background: rgba(77, 212, 198, .1); color: var(--accent); font-size: 12px; font-weight: 700; }
    .instruction-card, .result-card, .explanation-card, .feature-card, .definition-table, .scope-card { border: 1px solid var(--border); border-radius: 10px; background: var(--panel); box-shadow: var(--shadow); }
    .instruction-card { padding: 18px 22px; }
    ol, ul { padding-left: 20px; color: var(--muted); font-size: 14px; line-height: 1.9; }
    li::marker { color: var(--accent); font-weight: 600; }
    .result-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 11px; }
    .result-card { padding: 16px; }
    .result-card > span { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 7px; background: rgba(125, 211, 252, .1); color: var(--accent-2); font-size: 11px; font-weight: 700; }
    .result-card h3 { margin: 12px 0 5px; color: var(--text); font-size: 14px; font-weight: 600; }
    .explanation-card { padding: 20px; }
    .explanation-card > p { color: var(--muted); font-size: 14px; line-height: 1.7; }
    .process-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 18px; }
    .process-stage { display: flex; gap: 10px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: rgba(2, 6, 23, .28); }
    .process-stage > span { color: var(--accent); font-size: 11px; font-weight: 700; }
    .process-stage strong, .feature-card h3, .scope-card h3 { display: block; color: var(--text); font-size: 14px; }
    .process-stage p, .feature-card p { margin-top: 5px; color: var(--muted); font-size: 13px; line-height: 1.55; }
    .feature-grid, .evidence-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .feature-card { padding: 16px; }
    .feature-card code { display: inline-block; margin-bottom: 12px; }
    .evidence-note { margin-top: 12px; }
    .definition-table { overflow: hidden; }
    .definition-row { display: grid; grid-template-columns: 180px 1fr; gap: 20px; padding: 13px 16px; border-bottom: 1px solid var(--border); color: var(--muted); font-size: 14px; line-height: 1.55; }
    .definition-row:last-child { border-bottom: 0; }
    .definition-row strong { color: var(--text); }
    code { width: max-content; padding: 2px 7px; border: 1px solid rgba(125, 211, 252, .24); border-radius: 5px; background: rgba(125, 211, 252, .08); color: var(--accent-2); font-size: 12px; }
    .scope-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .scope-card { padding: 17px; }
    .scope-card.available { border-color: rgba(52, 211, 153, .3); }
    .scope-card.unavailable { border-color: rgba(251, 113, 133, .25); }
    .scope-card h3 { margin-bottom: 8px; }
    @media (max-width: 1000px) { .process-flow, .feature-grid, .evidence-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 900px) { .result-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 680px) {
      .page-header, .notice { display: block; }
      .page-header .btn { margin-top: 14px; }
      .notice strong { display: block; margin-bottom: 4px; }
      .result-grid, .process-flow, .feature-grid, .evidence-grid, .scope-grid { grid-template-columns: 1fr; }
      .definition-row { grid-template-columns: 1fr; gap: 5px; }
    }
  `],
})
export class InstructionsComponent {
  steps = [
    {
      number: '01',
      title: 'Create a case',
      summary: 'Use a case to group related evidence and scans.',
      instructions: ['Open Cases from the left rail.', 'Select New Case.', 'Enter a clear case name and optional description.', 'Select Create, then open the case.'],
    },
    {
      number: '02',
      title: 'Start a scan',
      summary: 'Submit a file or forensic image that the worker can access.',
      instructions: ['Inside a case, select New Scan.', 'Enter the complete server-side evidence path, for example /data/evidence/disk.img.', 'Select Start Scan.', 'Wait for the status to move from queued to running and then complete.'],
    },
    {
      number: '03',
      title: 'Review findings',
      summary: 'Open a completed scan and investigate the extracted artefacts.',
      instructions: ['Use Summary to see feature totals.', 'Filter and search individual values under Features.', 'Use Histograms to identify frequently occurring values.', 'Review Alerts as indicators requiring closer investigation.'],
    },
  ];

  results = [
    { code: 'SM', name: 'Summary', description: 'Totals by feature type and the most common categories.' },
    { code: 'FT', name: 'Features', description: 'Searchable individual values with offsets and context.' },
    { code: 'HG', name: 'Histograms', description: 'Frequently occurring values for a selected feature type.' },
    { code: 'AL', name: 'Alerts', description: 'Values flagged by Bulk Extractor for closer review.' },
  ];

  process = [
    { code: '01', name: 'Queue', description: 'The API records the scan and sends it to the background worker.' },
    { code: '02', name: 'Scan', description: 'The engine reads raw blocks and runs enabled scanners against them.' },
    { code: '03', name: 'Import', description: 'Feature files, histograms, alerts, and report metadata are imported into PostgreSQL.' },
    { code: '04', name: 'Review', description: 'The web interface presents searchable findings and scan statistics.' },
  ];

  applicationFeatures = [
    { name: 'Dashboard', description: 'Shows case totals, scan statuses, and the most recent scans.' },
    { name: 'Cases', description: 'Groups related scans under an investigation name and description.' },
    { name: 'Background scanning', description: 'Runs scans asynchronously so the interface remains available while evidence is processed.' },
    { name: 'Live progress', description: 'Displays scan percentage and elapsed time received from the worker.' },
    { name: 'Feature search', description: 'Filters by feature type and searches extracted values stored in the database.' },
    { name: 'Metadata capture', description: 'Records the evidence SHA-1 hash, total bytes, and elapsed scan time when reported by the engine.' },
  ];

  evidenceExamples = [
    { example: '/data/disk.raw', name: 'Raw disk images', description: 'Sector-by-sector RAW or DD images acquired from computers, removable drives, or other storage media.' },
    { example: '/data/phone.bin', name: 'Binary device images', description: 'Binary dumps or images acquired from supported devices and storage sources.' },
    { example: '/data/mailbox.pst', name: 'Mailbox and data files', description: 'Individual application-data files that may contain emails, domains, URLs, contacts, and other artefacts.' },
    { example: '/data/archive.zip', name: 'Archives and compressed files', description: 'ZIP, GZIP, and other recognised compressed content that recursive scanners can unpack and inspect.' },
    { example: '/data/report.pdf', name: 'Documents', description: 'Individual PDFs and other document files that may contain embedded text, metadata, URLs, or email addresses.' },
    { example: '/data/photo.jpg', name: 'Images and media files', description: 'Individual images or media files that may contain EXIF metadata, GPS information, or embedded artefacts.' },
    { example: '/data/memory.dump', name: 'Memory and system dumps', description: 'Memory, swap, pagefile, hibernation, or similar raw system-data files containing recoverable patterns.' },
    { example: '/data/network.pcap', name: 'Network captures', description: 'Packet-capture or network-data files that may expose IP addresses, domains, URLs, and Ethernet values.' },
    { example: '/data/unallocated.bin', name: 'Carved or unallocated data', description: 'Recovered fragments, unallocated-space exports, and other files without a usable filesystem structure.' },
  ];

  extractedFeatures = [
    { name: 'email', description: 'Email-address-like patterns found in the evidence.' },
    { name: 'domain', description: 'Internet domain names identified by the email and related scanners.' },
    { name: 'url', description: 'Web addresses and URL-like values.' },
    { name: 'ip', description: 'IP-address-like network artefacts.' },
    { name: 'ether', description: 'Ethernet or MAC-address-like values.' },
    { name: 'telephone', description: 'Telephone-number-like patterns.' },
    { name: 'ccn', description: 'Credit-card-number-like patterns; these require careful validation because false positives are possible.' },
    { name: 'gps', description: 'GPS-coordinate-like values and location artefacts.' },
    { name: 'exif', description: 'Metadata recovered from supported image content.' },
    { name: 'rfc822', description: 'Email-message header and RFC 822 artefacts.' },
  ];

  resultFields = [
    { name: 'Feature type', description: 'The category assigned by the scanner that recognised the value.' },
    { name: 'Value', description: 'The extracted forensic artefact, truncated only when it exceeds the application storage limit.' },
    { name: 'Offset', description: 'The numeric byte position at the start of the forensic path, when one is available.' },
    { name: 'Forensic path', description: 'The engine location describing where the value was found, including recursive container paths such as ZIP content.' },
    { name: 'Context', description: 'Nearby data emitted by the scanner to help an investigator understand the finding.' },
    { name: 'Histogram', description: 'A frequency count showing how often a particular value occurred.' },
    { name: 'Alert', description: 'A value written to the engine alert output and presented for additional review.' },
  ];

  availableNow = [
    'Server-side path submission for files and forensic images',
    'Asynchronous scans with progress reporting',
    'Cases, feature summaries, searchable findings, histograms, and alerts',
    'Automatic import of scan results into PostgreSQL',
  ];

  notProvided = [
    'Browser-based evidence upload',
    'Built-in result export or report generation',
    'Automatic conclusions, attribution, or evidential validation',
    'Filesystem browsing or a traditional file-tree view',
  ];
}
