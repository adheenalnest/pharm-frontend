import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [RouterLink, TitleCasePipe],
  templateUrl: './booking-success.html',
  styleUrl: './booking-success.css',
})
export class BookingSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);

  booking: any = null;
  paymentId     = '';
  paymentStatus = '';

  get isPaid(): boolean { return this.paymentStatus === 'paid'; }

  get appointmentDateFormatted(): string {
    if (!this.booking?.appointmentDate) return '';
    return new Date(this.booking.appointmentDate).toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.paymentId     = params['razorpay_payment_id']          ?? '';
      this.paymentStatus = params['razorpay_payment_link_status'] ?? '';
    });

    const raw = sessionStorage.getItem('booking_details');
    if (raw) {
      try { this.booking = JSON.parse(raw); } catch { /* ignore */ }
      sessionStorage.removeItem('booking_details');
    }
  }
}
