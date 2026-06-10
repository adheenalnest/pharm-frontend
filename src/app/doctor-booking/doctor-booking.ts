import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DoctorService } from '../services/doctor.service';
import { AuthService } from '../services/auth.service';

interface DateOption {
  date: number;
  day: string;
  month: string;
  weekday: string;
  fullDate: Date;
}

interface SlotOption {
  display: string; // "9:00 AM"
  value: string;   // "09:00-09:30"  (format backend expects)
}

const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function formatSlotTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const m = mStr ?? '00';
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m} ${ampm}`;
}

@Component({
  selector: 'app-doctor-booking',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './doctor-booking.html',
  styleUrl: './doctor-booking.css',
})
export class DoctorBookingComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private doctorService = inject(DoctorService);
  private auth = inject(AuthService);

  doctor: any = null;
  loading      = true;
  slotsLoading = false;
  error        = '';

  // booking form state
  bookingLoading = false;
  bookingError   = '';

  dates: DateOption[] = [];
  selectedDateIdx = 0;
  selectedSlot: SlotOption | null = null;

  showMorning   = true;
  showAfternoon = true;
  showEvening   = true;
  showNight     = false;
  consultMode   = 'video';
  patientName   = '';
  contactNumber = '';
  age           = '';
  gender        = 'Male';
  symptoms      = '';

  morningSlots:   SlotOption[] = [];
  afternoonSlots: SlotOption[] = [];
  eveningSlots:   SlotOption[] = [];
  nightSlots:     SlotOption[] = [];

  ngOnInit(): void {
    this.buildDates();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No doctor selected. Please go back and choose a doctor.';
      this.loading = false;
      return;
    }

    const navDoctor = history.state?.doctor;
    if (navDoctor) {
      this.doctor = navDoctor;
      this.loading = false;
      this.slotsLoading = true;
    }

    this.doctorService.getDoctorDetail(+id).subscribe({
      next: (data) => {
        if (!data) {
          if (!this.doctor) this.error = 'Doctor not found.';
        } else {
          this.doctor = data;
          this.updateSlots();
        }
        this.loading = false;
        this.slotsLoading = false;
      },
      error: (err) => {
        console.error('Doctor detail API error:', err);
        if (!this.doctor) {
          this.error = err?.error?.message || 'Could not load doctor details.';
        }
        this.loading = false;
        this.slotsLoading = false;
      }
    });
  }

  private buildDates(): void {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.dates.push({
        date: d.getDate(),
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en', { weekday: 'short' }),
        month: d.toLocaleDateString('en', { month: 'short' }).toUpperCase(),
        weekday: WEEKDAY_NAMES[d.getDay()],
        fullDate: d,
      });
    }
  }

  selectDate(idx: number): void {
    this.selectedDateIdx = idx;
    this.selectedSlot = null;
    this.updateSlots();
  }

  private updateSlots(): void {
    if (!this.doctor?.weeklyAvailability) return;

    const weekday = this.dates[this.selectedDateIdx]?.weekday;
    const dayData = (this.doctor.weeklyAvailability as any[]).find(
      (w: any) => w.weekday === weekday
    );

    const slots: SlotOption[] = (dayData?.availableSlots ?? []).map(
      (s: any) => ({ display: formatSlotTime(s.start), value: `${s.start}-${s.end}` })
    );

    this.morningSlots   = slots.filter(s => { const h = this.slotHour(s.display); return h >= 0  && h < 12; });
    this.afternoonSlots = slots.filter(s => { const h = this.slotHour(s.display); return h >= 12 && h < 17; });
    this.eveningSlots   = slots.filter(s => { const h = this.slotHour(s.display); return h >= 17 && h < 20; });
    this.nightSlots     = slots.filter(s => { const h = this.slotHour(s.display); return h >= 20; });
  }

  private slotHour(display: string): number {
    const [timePart, ampm] = display.split(' ');
    let h = parseInt(timePart.split(':')[0], 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h;
  }

  get totalSlots(): number {
    return this.morningSlots.length + this.afternoonSlots.length +
           this.eveningSlots.length + this.nightSlots.length;
  }

  get currentMonth(): string { return this.dates[0]?.month ?? ''; }

  confirmBooking(): void {
    if (!this.selectedSlot || !this.doctor) return;

    // Must be logged in to book
    if (!this.auth.isLoggedIn()) {
      this.auth.loginPanelOpen.set(true);
      return;
    }

    if (!this.patientName.trim()) {
      this.bookingError = 'Please enter the patient name.';
      return;
    }
    if (!this.contactNumber.trim()) {
      this.bookingError = 'Please enter the contact number.';
      return;
    }

    const selectedDate = this.dates[this.selectedDateIdx];
    const payload = {
      doctorProfileId: this.doctor.doctorProfileId,
      timeSlot:        this.selectedSlot.value,
      appointmentDate: selectedDate.fullDate.toISOString(),
      patientName:     this.patientName.trim(),
      patientNumber:   this.contactNumber.trim(),
      age:             parseInt(this.age, 10) || 0,
      gender:          this.gender,
      prescriptionUpload: '',
      description:     this.symptoms.trim(),
      modeOfConsult:   this.consultMode,
    };

    this.bookingLoading = true;
    this.bookingError   = '';

    this.doctorService.checkoutBooking(payload).subscribe({
      next: (res) => {
        this.bookingLoading = false;
        // Save booking details so the order-success page can show them
        sessionStorage.setItem('booking_details', JSON.stringify({
          bookingSessionId: res.bookingSessionId,
          doctorName:       res.doctorName,
          timeSlot:         res.timeSlot,
          appointmentDate:  res.appointmentDate,
          patientName:      res.patientName,
          consultationFee:  res.consultationFee,
          modeOfConsult:    res.modeOfConsult,
        }));
        // Redirect to Razorpay (same tab — callback_url brings user to /booking-success)
        window.location.href = res.paymentLinkUrl;
      },
      error: (err) => {
        this.bookingLoading = false;
        this.bookingError = err?.error?.message || 'Booking failed. Please try again.';
      }
    });
  }

  goBack(): void { this.router.navigate(['/doctors']); }
}
