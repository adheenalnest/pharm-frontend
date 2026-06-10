import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  cartSvc = inject(CartService);
  auth    = inject(AuthService);

  showDiscountBreakup = false;
  addressPanelOpen    = false;
  addressSaved        = false;

  readonly platformFee        = 12;
  readonly freeDeliverySaving = 99;

  deliverTo   = '';
  mobileNo    = '';
  pincode     = '';
  houseNo     = '';
  streetName  = '';
  addressType = 'home';

  savedAddress = { deliverTo: '', mobileNo: '', pincode: '', houseNo: '', streetName: '', addressType: 'home' };

  ngOnInit(): void {
    this.cartSvc.loadCart();
  }

  get items(): any[] { return this.cartSvc.items(); }

  get totalMrp(): number {
    return this.items.reduce((s: number, i: any) => s + (i.product?.price ?? 0) * (i.quantity ?? 0), 0);
  }

  itemSalePrice(item: any): number {
    const p = item.product;
    return p?.discountedPrice > 0 ? p.discountedPrice : (p?.price ?? 0);
  }

  itemDiscPct(item: any): number {
    const p = item.product;
    if (!p?.discountedPrice || p.discountedPrice >= p.price) return 0;
    return Math.round((1 - p.discountedPrice / p.price) * 100);
  }

  get totalSalePrice(): number {
    return this.items.reduce((s: number, i: any) => s + this.itemSalePrice(i) * (i.quantity ?? 0), 0);
  }

  get mrpDiscount(): number  { return this.totalMrp - this.totalSalePrice; }
  get amountToPay(): number  { return this.totalSalePrice + this.platformFee; }
  get totalSaved(): number   { return Math.round(this.mrpDiscount + this.freeDeliverySaving); }

  get addrFormValid(): boolean {
    return !!(this.deliverTo && this.mobileNo && this.pincode && this.houseNo);
  }

  get addrTypeLabel(): string {
    return this.savedAddress.addressType.charAt(0).toUpperCase() + this.savedAddress.addressType.slice(1);
  }

  itemProductId(item: any): number { return item.productId ?? item.product?.id; }

  onQtyChange(item: any, newQty: number): void {
    const delta = +newQty - item.quantity;
    if (delta > 0) this.cartSvc.addItem(this.itemProductId(item), delta);
    else if (delta < 0) this.cartSvc.removeItem(this.itemProductId(item), -delta);
  }

  removeItem(item: any): void {
    this.cartSvc.removeItem(this.itemProductId(item));
  }

  saveAddress(): void {
    if (!this.addrFormValid) return;
    this.savedAddress = {
      deliverTo: this.deliverTo, mobileNo: this.mobileNo,
      pincode: this.pincode, houseNo: this.houseNo,
      streetName: this.streetName, addressType: this.addressType,
    };
    this.addressSaved    = true;
    this.addressPanelOpen = false;
  }

  openChangeAddress(): void { this.addressPanelOpen = true; }
}
