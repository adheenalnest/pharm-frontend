import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetailComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private api     = inject(ApiService);
  private cdr     = inject(ChangeDetectorRef);
  private cartSvc = inject(CartService);
  auth            = inject(AuthService);

  loading  = true;
  error    = '';
  product: any = null;

  selectedImage = 0;
  activeTab     = 'description';

  tabs = [
    { key: 'description',     label: 'Description' },
    { key: 'uses',            label: 'Uses' },
    { key: 'sideEffects',     label: 'Side Effects' },
    { key: 'directionForUse', label: 'Direction For Use' },
    { key: 'dosage',          label: 'Dosage' },
    { key: 'modeOfAction',    label: 'Mode of Action' },
    { key: 'quickTips',       label: 'Quick Tips' },
    { key: 'storageDisposal', label: 'Storage & Disposal' },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'Invalid product ID.'; this.loading = false; return; }
    this.api.getProductById(id).subscribe({
      next: (p) => {
        this.product  = p;
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error   = 'Product not found or could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get inCart(): boolean  { return !!this.product && this.cartSvc.isInCart(this.product.id); }
  get quantity(): number { return this.product ? this.cartSvc.quantityFor(this.product.id) : 0; }

  get discPct(): number {
    if (!this.product) return 0;
    const { price, discountedPrice } = this.product;
    if (!discountedPrice || discountedPrice >= price) return 0;
    return Math.round((1 - discountedPrice / price) * 100);
  }

  get salePrice(): number {
    if (!this.product) return 0;
    return this.product.discountedPrice > 0 ? this.product.discountedPrice : this.product.price;
  }

  get activeTabLabel(): string {
    return this.tabs.find(t => t.key === this.activeTab)?.label ?? '';
  }

  get activeTabContent(): string {
    return this.product?.[this.activeTab] ?? '';
  }

  addToCart(): void {
    if (!this.auth.isLoggedIn()) { this.auth.openLogin(); return; }
    if (this.product) this.cartSvc.addItem(this.product.id);
  }

  increase(): void { if (this.product) this.cartSvc.addItem(this.product.id); }

  decrease(): void {
    if (!this.product) return;
    if (this.quantity > 1) this.cartSvc.removeItem(this.product.id, 1);
    else this.cartSvc.removeItem(this.product.id);
  }
}
