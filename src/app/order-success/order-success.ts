import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TitleCasePipe, DecimalPipe } from '@angular/common';
import { CartService } from '../services/cart.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, TitleCasePipe, DecimalPipe],
  templateUrl: './order-success.html',
  styleUrl: './order-success.css',
})
export class OrderSuccessComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private cartSvc = inject(CartService);
  private api     = inject(ApiService);
  private cdr     = inject(ChangeDetectorRef);

  booking: any       = null;
  orderSnapshot: any = null;
  // flat list of individual Order rows from the API (one per product)
  apiOrderRows: any[]  = [];
  apiLoading           = false;

  paymentId      = '';
  paymentStatus  = '';
  paymentLinkId  = '';

  get isBooking(): boolean { return !!this.booking; }
  get isPaid(): boolean    { return this.paymentStatus === 'paid'; }

  get appointmentDateFormatted(): string {
    if (!this.booking?.appointmentDate) return '';
    return new Date(this.booking.appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  /* ── Display getters — prefer API rows, fall back to sessionStorage ── */

  get displayOrderId(): string {
    // Show ID range if multiple rows, e.g.  #3 – #5
    if (this.apiOrderRows.length === 1) return '#' + this.apiOrderRows[0].id;
    if (this.apiOrderRows.length > 1) {
      const ids = this.apiOrderRows.map((o: any) => o.id);
      return '#' + Math.min(...ids) + ' – #' + Math.max(...ids);
    }
    return '';
  }

  get displayItems(): any[] {
    // API rows: each row IS one item (one product per Order record)
    if (this.apiOrderRows.length > 0) {
      return this.apiOrderRows.map((o: any) => ({
        name:      o.product?.name          ?? '',
        category:  o.product?.categoryName  ?? '',
        image:     o.product?.image         ?? '',
        mrp:       o.product?.price         ?? 0,
        salePrice: o.purchasePrice          ?? o.product?.discountedPrice ?? 0,
        quantity:  o.quantity               ?? 1,
      }));
    }
    // Fall back to sessionStorage snapshot
    return this.orderSnapshot?.items ?? [];
  }

  get displayAmountPaid(): number {
    if (this.apiOrderRows.length > 0) {
      return this.apiOrderRows.reduce((s: number, o: any) => s + (o.totalPrice ?? 0), 0);
    }
    return this.orderSnapshot?.amountPaid ?? 0;
  }

  get displayTotalMrp(): number {
    if (this.apiOrderRows.length > 0) {
      return this.apiOrderRows.reduce((s: number, o: any) => s + (o.product?.price ?? 0) * (o.quantity ?? 1), 0);
    }
    return this.orderSnapshot?.totalMrp ?? 0;
  }

  get displayMrpDiscount(): number { return this.orderSnapshot?.mrpDiscount ?? 0; }
  get displayPlatformFee(): number { return this.orderSnapshot?.platformFee ?? 12; }

  ngOnInit(): void {
    // Read doctor booking snapshot
    const bookingRaw = sessionStorage.getItem('booking_details');
    if (bookingRaw) {
      try { this.booking = JSON.parse(bookingRaw); sessionStorage.removeItem('booking_details'); } catch { /* */ }
    }

    // Read cart snapshot saved before redirect (product order fallback)
    const snapshotRaw = sessionStorage.getItem('order_snapshot');
    if (snapshotRaw) {
      try { this.orderSnapshot = JSON.parse(snapshotRaw); sessionStorage.removeItem('order_snapshot'); } catch { /* */ }
    }

    // Read Razorpay callback params
    this.route.queryParams.subscribe(params => {
      this.paymentId     = params['razorpay_payment_id']          ?? '';
      this.paymentStatus = params['razorpay_payment_link_status'] ?? '';
      this.paymentLinkId = params['razorpay_payment_link_id']     ?? '';

      if (this.isPaid) {
        this.cartSvc.clearCart();
        this.fetchOrders();
      }
    });
  }

  private fetchOrders(): void {
    this.apiLoading = true;
    this.cdr.markForCheck();

    // Small delay to allow the backend to finish processing
    setTimeout(() => {
      this.api.getOrders().subscribe({
        next: (res: any) => {
          // GET /orders returns paginated: { data: [...], total, page, totalPages }
          const allRows: any[] = res?.data ?? res?.orders ?? (Array.isArray(res) ? res : []);

          if (allRows.length === 0) {
            this.apiLoading = false;
            this.cdr.markForCheck();
            return;
          }

          // The most recent order row's createdAt
          const newest = new Date(allRows[0].createdAt).getTime();

          // Group all rows created within 60 seconds of the newest — these are from the same checkout
          this.apiOrderRows = allRows.filter((o: any) => {
            const diff = Math.abs(newest - new Date(o.createdAt).getTime());
            return diff < 60_000;
          });

          this.apiLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.apiLoading = false;
          this.cdr.markForCheck();
        }
      });
    }, 1500);
  }
}
