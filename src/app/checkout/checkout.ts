import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../services/api.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent implements OnInit {
  private api     = inject(ApiService);
  private cdr     = inject(ChangeDetectorRef);
  cartSvc         = inject(CartService);
  auth            = inject(AuthService);

  selectedPayment     = 'upi';
  showDiscountBreakup = false;
  placing             = false;
  error               = '';

  readonly platformFee        = 12;
  readonly freeDeliverySaving = 99;

  ngOnInit(): void {
    this.cartSvc.loadCart();
  }

  get items(): any[] { return this.cartSvc.items(); }

  get totalMrp(): number {
    return this.items.reduce((s: number, i: any) => s + (i.product?.price ?? 0) * (i.quantity ?? 0), 0);
  }

  private itemSalePrice(item: any): number {
    const p = item.product;
    return p?.discountedPrice > 0 ? p.discountedPrice : (p?.price ?? 0);
  }

  get totalSalePrice(): number {
    return this.items.reduce((s: number, i: any) => s + this.itemSalePrice(i) * (i.quantity ?? 0), 0);
  }

  get mrpDiscount(): number   { return this.totalMrp - this.totalSalePrice; }
  get amountToPay(): number   { return this.totalSalePrice + this.platformFee; }
  get totalSaved(): number    { return Math.round(this.mrpDiscount + this.freeDeliverySaving); }
  get totalDiscount(): number { return this.mrpDiscount; }
  get discountedValue(): number { return this.totalSalePrice; }

  placeOrder(): void {
    if (this.placing || this.items.length === 0) return;
    this.placing = true;
    this.error   = '';
    this.cdr.markForCheck();

    sessionStorage.setItem('order_snapshot', JSON.stringify({
      items: this.items.map(i => ({
        name:     i.product?.name,
        category: i.product?.category?.categoryName,
        image:    i.product?.image,
        mrp:      i.product?.price,
        salePrice: this.itemSalePrice(i),
        quantity:  i.quantity,
      })),
      totalMrp:      this.totalMrp,
      totalSalePrice: this.totalSalePrice,
      amountPaid:    this.amountToPay,
      platformFee:   this.platformFee,
      mrpDiscount:   this.mrpDiscount,
      timestamp:     new Date().toISOString(),
    }));

    this.api.checkoutProducts().subscribe({
      next: (res: any) => {
        const url = res?.paymentLinkUrl ?? res?.paymentLink ?? res?.url ?? res?.short_url ?? '';
        if (url) {
          window.location.href = url;
        } else {
          this.error   = 'No payment link received. Please try again.';
          this.placing = false;
          this.cdr.markForCheck();
        }
      },
      error: (err: any) => {
        this.error   = err?.error?.detail ?? err?.error?.message ?? err?.error?.title ?? 'Checkout failed. Please try again.';
        this.placing = false;
        this.cdr.markForCheck();
      }
    });
  }
}
