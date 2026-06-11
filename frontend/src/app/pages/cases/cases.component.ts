import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Case } from '../../models/models';

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [RouterLink, FormsModule, SlicePipe],
  template: `
    <div class="page-header">
      <h1 class="page-title">Cases</h1>
      <button class="btn btn-primary" (click)="showForm.set(!showForm())">+ New Case</button>
    </div>

    @if (showForm()) {
      <div class="card form-card">
        <div class="card-head">Create Case</div>
        <div class="form-body">
          <div class="field"><label>Name *</label><input class="input" [(ngModel)]="newName" placeholder="Case name" /></div>
          <div class="field"><label>Description</label><textarea class="input" [(ngModel)]="newDesc" rows="2" placeholder="Optional"></textarea></div>
          <div class="actions">
            <button class="btn btn-primary" (click)="create()" [disabled]="!newName || creating()">{{ creating() ? 'Creating…' : 'Create' }}</button>
            <button class="btn btn-ghost" (click)="showForm.set(false)">Cancel</button>
          </div>
        </div>
      </div>
    }

    @if (loading()) {
      <p class="text-muted">Loading…</p>
    } @else if (cases().length === 0) {
      <div class="empty-state">
        <p>&#128193;</p>
        <p class="text-muted">No cases yet. Create one to start scanning.</p>
      </div>
    } @else {
      <div class="cases-list">
        @for (c of cases(); track c.id) {
          <a [routerLink]="['/cases', c.id]" class="case-row">
            <div class="case-icon">&#128193;</div>
            <div class="case-info">
              <p class="case-name">{{ c.name }}</p>
              @if (c.description) { <p class="case-desc">{{ c.description }}</p> }
            </div>
            <div class="case-meta">
              <span class="badge {{ c.status }}">{{ c.status }}</span>
              <p class="case-date">{{ c.created_at | slice:0:10 }}</p>
            </div>
          </a>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-title { font-size: 16px; font-weight: 500; color: #c9d1d9; }
    .form-card { margin-bottom: 18px; }
    .form-body { padding: 16px; }
    .field { margin-bottom: 12px; label { display: block; font-size: 11px; color: #6b7c8f; margin-bottom: 5px; } }
    textarea.input { resize: none; }
    .actions { display: flex; gap: 8px; }
    .empty-state { text-align: center; padding: 60px 0; font-size: 32px; }
    .cases-list { display: flex; flex-direction: column; gap: 8px; }
    .case-row { display: flex; align-items: center; gap: 14px; background: #0d1117; border: 0.5px solid #1e2d42; border-radius: 10px; padding: 14px 16px; transition: border-color .15s; &:hover { border-color: #22d3ee; } }
    .case-icon { font-size: 20px; }
    .case-info { flex: 1; min-width: 0; }
    .case-name { color: #c9d1d9; font-size: 13px; font-weight: 500; }
    .case-desc { color: #4b5c70; font-size: 11px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .case-meta { text-align: right; }
    .case-date { color: #3d4f62; font-size: 10px; margin-top: 4px; }
  `]
})
export class CasesComponent implements OnInit {
  private api = inject(ApiService);

  cases = signal<Case[]>([]);
  loading = signal(true);
  showForm = signal(false);
  newName = '';
  newDesc = '';
  creating = signal(false);

  ngOnInit() {
    this.api.getCases().subscribe({ next: c => { this.cases.set(c); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  create() {
    if (!this.newName) return;
    this.creating.set(true);
    this.api.createCase(this.newName, this.newDesc || undefined).subscribe({
      next: c => { this.cases.update(list => [c, ...list]); this.newName = ''; this.newDesc = ''; this.showForm.set(false); this.creating.set(false); },
      error: () => this.creating.set(false),
    });
  }
}
