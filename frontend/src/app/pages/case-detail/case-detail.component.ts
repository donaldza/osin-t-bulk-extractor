import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { Case, Scan } from '../../models/models';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <a routerLink="/cases" class="back-link">&#8592; Cases</a>

    <div class="page-header">
      <h1 class="page-title">{{ caseData()?.name ?? '…' }}</h1>
      <button class="btn btn-primary" (click)="showForm.set(!showForm())">&#9654; New Scan</button>
    </div>

    @if (caseData()?.description) {
      <p class="case-desc">{{ caseData()!.description }}</p>
    }

    @if (showForm()) {
      <div class="card form-card">
        <div class="card-head">New Scan</div>
        <div class="form-body">
          <div class="field">
            <label>Image / file path</label>
            <input class="input" [(ngModel)]="imagePath" placeholder="/data/disk.img" />
          </div>
          <div class="actions">
            <button class="btn btn-primary" (click)="startScan()" [disabled]="!imagePath || submitting()">{{ submitting() ? 'Submitting…' : 'Start Scan' }}</button>
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    }

    <div class="card">
      <div class="card-head">Scans <span class="text-dim">&nbsp;·&nbsp;auto-refreshes</span></div>
      @if (scans().length === 0) {
        <p class="empty">No scans yet.</p>
      } @else {
        <table class="be-table">
          <thead><tr><th>Image</th><th>Status</th><th>Size</th><th>Duration</th><th>Started</th><th></th></tr></thead>
          <tbody>
            @for (scan of scans(); track scan.id) {
              <tr>
                <td style="color:var(--text); font-size:11px; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ scan.image_path }}</td>
                <td><span class="badge {{ scan.status }}">{{ scan.status }}</span></td>
                <td>{{ scan.total_bytes ? (scan.total_bytes / 1e6).toFixed(0) + ' MB' : '—' }}</td>
                <td>{{ scan.elapsed_seconds ? scan.elapsed_seconds.toFixed(1) + 's' : '—' }}</td>
                <td style="font-size:11px; color:var(--muted)">{{ fmtDate(scan.started_at) }}</td>
                <td><a [routerLink]="['/scans', scan.id]" class="text-cyan">View</a></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .back-link { font-size: 12px; color: var(--muted); display: inline-block; margin-bottom: 6px; &:hover { color: var(--text); } }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .page-title { font-size: 16px; font-weight: 500; color: var(--text); }
    .case-desc { color: var(--muted); font-size: 12px; margin-bottom: 18px; }
    .form-card { margin-bottom: 18px; margin-top: 14px; }
    .form-body { padding: 16px; }
    .field { margin-bottom: 12px; label { display: block; font-size: 11px; color: var(--muted); margin-bottom: 5px; } }
    .actions { display: flex; gap: 8px; }
    .empty { padding: 16px; color: var(--muted); font-size: 12px; }
  `]
})
export class CaseDetailComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private pollSub?: Subscription;

  caseId = 0;
  caseData = signal<Case | null>(null);
  scans = signal<Scan[]>([]);
  showForm = signal(false);
  imagePath = '';
  submitting = signal(false);

  ngOnInit() {
    this.caseId = Number(this.route.snapshot.paramMap.get('caseId'));
    this.api.getCase(this.caseId).subscribe(c => this.caseData.set(c));
    this.pollSub = interval(0).pipe(switchMap(() => this.api.getScans(this.caseId))).subscribe(s => this.scans.set(s));
    this.pollSub = interval(5000).pipe(switchMap(() => this.api.getScans(this.caseId))).subscribe(s => this.scans.set(s));
  }

  ngOnDestroy() { this.pollSub?.unsubscribe(); }

  fmtDate(d?: string): string { return d ? d.slice(0, 16).replace('T', ' ') : '—'; }

  startScan() {
    if (!this.imagePath) return;
    this.submitting.set(true);
    this.api.createScan(this.caseId, this.imagePath).subscribe({
      next: s => { this.scans.update(list => [s, ...list]); this.imagePath = ''; this.showForm.set(false); this.submitting.set(false); },
      error: () => this.submitting.set(false),
    });
  }
}
