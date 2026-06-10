import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../services/api.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private api   = inject(ApiService);
  private cdr   = inject(ChangeDetectorRef);

  pageTitle = 'All Products';
  backLink  = '/';

  loading   = true;
  error     = '';
  products: any[]   = [];
  categories: any[] = [];

  currentPage  = 1;
  totalPages   = 1;
  totalCount   = 0;
  readonly pageSize = 12;

  sortBy           = 'popularity';
  selectedCategory = 0;

  private routeCategorySlug = '';
  private _searchQuery      = '';
  private searchSubject     = new Subject<string>();
  private destroy$          = new Subject<void>();

  get searchQuery(): string { return this._searchQuery; }
  set searchQuery(v: string) {
    this._searchQuery = v;
    this.searchSubject.next(v);
  }

  get activeCategoryName(): string {
    if (this.selectedCategory === 0) return '';
    return this.categories.find(c => c.id === this.selectedCategory)?.categoryName ?? '';
  }

  ngOnInit(): void {
    // read route param
    const catSlug = this.route.snapshot.paramMap.get('category');
    if (catSlug) {
      this.routeCategorySlug = catSlug;
      this.pageTitle = catSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      this.backLink  = '/healthcare';
    } else {
      const path = this.route.snapshot.url[0]?.path;
      if (path === 'medicine') { this.pageTitle = 'Medicine'; this.backLink = '/'; }
    }

    // debounced search
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadProducts();
    });

    // load categories first, then match slug → ID and load products
    this.api.getCategories().subscribe(cats => {
      this.categories = cats;
      if (this.routeCategorySlug) {
        const matched = cats.find((c: any) =>
          c.categoryName.toLowerCase().replace(/[\s&]+/g, '-') === this.routeCategorySlug
        );
        if (matched) this.selectedCategory = matched.id;
      }
      this.cdr.markForCheck();
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProducts(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.markForCheck();

    const catId  = this.selectedCategory > 0 ? this.selectedCategory : undefined;
    const search = this._searchQuery.trim() || undefined;

    this.api.getProducts(this.currentPage, this.pageSize, catId, search).subscribe({
      next: (res) => {
        this.products   = res?.data ?? [];
        this.totalCount = res?.total ?? 0;
        this.totalPages = res?.totalPages ?? 1;
        this.loading    = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Could not load products. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onCategoryChange(id: number): void {
    this.selectedCategory = id;
    this.currentPage = 1;
    this.loadProducts();
  }

  clearCategory(): void {
    this.selectedCategory = 0;
    this.currentPage = 1;
    this.loadProducts();
  }

  categoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.categoryName ?? '';
  }

  discPct(p: any): number {
    if (!p.discountedPrice || p.discountedPrice >= p.price) return 0;
    return Math.round((1 - p.discountedPrice / p.price) * 100);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
