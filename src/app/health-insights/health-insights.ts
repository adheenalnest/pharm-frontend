import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-health-insights',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './health-insights.html',
  styleUrl: './health-insights.css',
})
export class HealthInsightsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  blogs: any[] = [];
  loading = true;
  error   = '';
  page    = 1;
  totalPages = 1;

  ngOnInit(): void { this.loadBlogs(); }

  loadBlogs(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.getBlogs(this.page, 12).subscribe({
      next: (res) => {
        this.blogs      = res?.data ?? [];
        this.totalPages = res?.totalPages ?? 1;
        this.loading    = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Could not load blogs. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadMore(): void {
    if (this.page >= this.totalPages) return;
    this.page++;
    this.api.getBlogs(this.page, 12).subscribe({
      next: (res) => {
        this.blogs = [...this.blogs, ...(res?.data ?? [])];
        this.totalPages = res?.totalPages ?? 1;
        this.cdr.markForCheck();
      }
    });
  }

  excerpt(content: string, max = 120): string {
    if (!content) return '';
    return content.length > max ? content.slice(0, max) + '…' : content;
  }

  blogBg(index: number): string {
    const bgs = ['#e0f2fe','#dcfce7','#fef9c3','#fce7f3','#ede9fe','#fff7ed'];
    return bgs[index % bgs.length];
  }
}
