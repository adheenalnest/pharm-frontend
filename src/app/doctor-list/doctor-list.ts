import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { DoctorService } from '../services/doctor.service';

const AVATAR_BG = ['#e8f0fb','#e8f7ee','#fce8f3','#f3e8fc','#e8f5fc','#fcf3e8','#fce8e8'];
const AVATAR_EMOJI = ['👨‍⚕️','👩‍⚕️','🩺'];

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.css',
})
export class DoctorListComponent implements OnInit {
  @ViewChild('quickTrack') quickTrackRef!: ElementRef<HTMLDivElement>;
  private router = inject(Router);
  private doctorService = inject(DoctorService);

  doctors: any[] = [];
  loading = true;
  error = '';

  // quick-connect strip uses first 3 doctors
  get quickDocs(): any[] { return this.doctors.slice(0, 3); }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.getCustomerDoctors().subscribe({
      next: (data) => {
        this.doctors = data.map((d: any, i: number) => ({
          ...d,
          avatarBg: AVATAR_BG[i % AVATAR_BG.length],
          avatar: AVATAR_EMOJI[i % AVATAR_EMOJI.length],
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load doctors. Please check if the server is running.';
        this.loading = false;
      }
    });
  }

  scrollQuick(dir: 'prev' | 'next'): void {
    this.quickTrackRef?.nativeElement.scrollBy({ left: dir === 'next' ? 260 : -260, behavior: 'smooth' });
  }

  goToBooking(doc?: any): void {
    const target = doc ?? this.doctors[0];
    if (target?.doctorProfileId) {
      this.router.navigate(['/doctor-booking', target.doctorProfileId], { state: { doctor: target } });
    }
  }
}
