import { Component, inject, ViewChildren, ElementRef, QueryList, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

type Role = 'customer' | 'doctor';
type Step = 'email' | 'otp';
type AlertType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.css',
})
export class LoginModalComponent implements OnDestroy {
  auth = inject(AuthService);

  step: Step = 'email';
  role: Role = 'customer';
  email = '';
  otp = ['', '', '', '', '', ''];
  countdown = 0;
  loading = false;

  alert: { message: string; type: AlertType } | null = null;
  private alertTimer: ReturnType<typeof setTimeout> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  // ── Validation ──────────────────────────────────────────
  get emailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  get otpValue(): string {
    return this.otp.join('');
  }

  get otpComplete(): boolean {
    return this.otpValue.length === 6 && this.otp.every(d => /^\d$/.test(d));
  }

  // ── Role tabs ────────────────────────────────────────────
  selectRole(r: Role): void {
    this.role = r;
    this.clearAlert();
  }

  // ── Step 1: send OTP ─────────────────────────────────────
  sendOtp(): void {
    if (!this.email.trim()) {
      this.showAlert('Please enter your email address.', 'error');
      return;
    }
    if (!this.emailValid) {
      this.showAlert('Please enter a valid email address.', 'error');
      return;
    }

    this.loading = true;
    this.clearAlert();

    this.auth.sendOtp(this.email.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.step = 'otp';
        this.otp = ['', '', '', '', '', ''];
        this.startCountdown();
        this.showAlert(res?.message || 'OTP sent to your email!', 'success');
        setTimeout(() => this.otpInputs?.toArray()[0]?.nativeElement.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.showAlert(err?.error?.message || 'Failed to send OTP. Please try again.', 'error');
      }
    });
  }

  // ── Step 2: verify OTP ───────────────────────────────────
  verifyOtp(): void {
    if (!this.otpComplete) {
      this.showAlert('Please enter all 6 digits of your OTP.', 'error');
      return;
    }

    this.loading = true;
    this.clearAlert();

    this.auth.verifyOtp(this.email.trim(), this.otpValue, this.role).subscribe({
      next: (res: any) => {
        this.loading = false;
        const token = res?.token;
        const email = res?.user?.email || this.email;
        const role  = res?.user?.role  || this.role;
        this.auth.setSession(token, email, role);
        this.showAlert(`Welcome! Logged in as ${role}.`, 'success');
        this.resetForm();
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || 'Invalid or expired OTP. Please try again.';
        this.showAlert(msg, 'error');
      }
    });
  }

  // ── Resend OTP ───────────────────────────────────────────
  resendOtp(): void {
    this.otp = ['', '', '', '', '', ''];
    this.clearAlert();
    this.loading = true;

    this.auth.sendOtp(this.email.trim()).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.startCountdown();
        this.showAlert(res?.message || 'OTP resent to your email!', 'success');
        setTimeout(() => this.otpInputs?.toArray()[0]?.nativeElement.focus(), 100);
      },
      error: (err: any) => {
        this.loading = false;
        this.showAlert(err?.error?.message || 'Failed to resend OTP.', 'error');
      }
    });
  }

  editEmail(): void {
    this.step = 'email';
    this.otp = ['', '', '', '', '', ''];
    this.clearAlert();
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  // ── OTP box helpers ──────────────────────────────────────
  onOtpInput(index: number): void {
    const val = this.otp[index];
    if (val && !/^\d$/.test(val)) {
      this.otp[index] = '';
      return;
    }
    if (val && index < 5) {
      setTimeout(() => this.otpInputs.toArray()[index + 1]?.nativeElement.focus());
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      this.otpInputs.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      event.preventDefault();
      digits.forEach((d, i) => { if (i < 6) this.otp[i] = d; });
      const next = Math.min(digits.length, 5);
      setTimeout(() => this.otpInputs.toArray()[next]?.nativeElement.focus());
    }
  }

  // ── Close ────────────────────────────────────────────────
  closePanel(): void {
    this.auth.closeLogin();
    this.resetForm();
  }

  // ── Internals ────────────────────────────────────────────
  private resetForm(): void {
    this.step = 'email';
    this.email = '';
    this.otp = ['', '', '', '', '', ''];
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private startCountdown(): void {
    this.countdown = 30;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.countdown > 0) { this.countdown--; }
      else { clearInterval(this.timer!); this.timer = null; }
    }, 1000);
  }

  showAlert(message: string, type: AlertType): void {
    this.alert = { message, type };
    if (this.alertTimer) clearTimeout(this.alertTimer);
    if (type !== 'error') {
      this.alertTimer = setTimeout(() => this.alert = null, 4000);
    }
  }

  clearAlert(): void {
    this.alert = null;
    if (this.alertTimer) clearTimeout(this.alertTimer);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.alertTimer) clearTimeout(this.alertTimer);
  }
}
