import { Injectable, inject, signal, effect } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  items    = signal<any[]>([]);
  total    = signal<number>(0);
  mrpTotal = signal<number>(0);
  loading  = signal<boolean>(false);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) this.loadCart();
      else this.items.set([]);
    });
  }

  get count(): number {
    return this.items().reduce((s: number, i: any) => s + (i.quantity ?? 0), 0);
  }

  isInCart(productId: number): boolean {
    return this.items().some((i: any) => (i.productId ?? i.product?.id) === productId);
  }

  quantityFor(productId: number): number {
    return this.items().find((i: any) => (i.productId ?? i.product?.id) === productId)?.quantity ?? 0;
  }

  loadCart(): void {
    if (!this.auth.isLoggedIn()) { this.items.set([]); return; }
    this.loading.set(true);
    this.api.getCart().subscribe({
      next: (res: any) => {
        const items = res?.items ?? res?.cartItems ?? [];
        this.items.set(items);
        this.total.set(res?.total ?? res?.totalPrice ?? this.calcTotal(items));
        this.mrpTotal.set(res?.mrpTotal ?? res?.totalMrp ?? this.calcMrp(items));
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  addItem(productId: number, quantity = 1): void {
    if (!this.auth.isLoggedIn()) return;
    this.api.addToCart(productId, quantity).subscribe({
      next: () => this.loadCart(),
      error: () => {}
    });
  }

  removeItem(productId: number, quantity?: number): void {
    this.api.removeFromCart(productId, quantity).subscribe({
      next: () => this.loadCart(),
      error: () => {}
    });
  }

  clearCart(): void {
    this.items.set([]);
    this.total.set(0);
    this.mrpTotal.set(0);
  }

  private calcTotal(items: any[]): number {
    return items.reduce((s: number, i: any) => {
      const p = i.product;
      const price = p?.discountedPrice > 0 ? p.discountedPrice : (p?.price ?? 0);
      return s + price * (i.quantity ?? 0);
    }, 0);
  }

  private calcMrp(items: any[]): number {
    return items.reduce((s: number, i: any) => s + (i.product?.price ?? 0) * (i.quantity ?? 0), 0);
  }
}
