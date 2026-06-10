import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DoctorService } from '../services/doctor.service';
import { ApiService } from '../services/api.service';

interface Speciality { name: string; issues: string; avatar: string; bg: string; }
interface CompareRow { feature: string; online: string; inPerson: string; }
interface WhyCard { icon: string; title: string; desc: string; bg: string; }
interface HowStep { num: number; icon: string; title: string; desc: string; }

const AVATAR_BG    = ['#e8f0fb','#e8f7ee','#fce8f3','#f3e8fc','#e8f5fc','#fcf3e8','#fce8e8'];
const AVATAR_EMOJI = ['👨‍⚕️','👩‍⚕️','🩺'];

@Component({
  selector: 'app-doctor-consult',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './doctor-consult.html',
  styleUrl: './doctor-consult.css',
})
export class DoctorConsultComponent implements OnInit {
  @ViewChild('specTrack')   specTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('doctorTrack') doctorTrackRef!: ElementRef<HTMLDivElement>;

  private doctorService = inject(DoctorService);
  private api           = inject(ApiService);
  private router        = inject(Router);

  // API-loaded doctors
  doctors: any[] = [];
  doctorsLoading = true;
  doctorsError = '';

  // First active doctor ID for the hero CTA button
  get firstDoctorId(): number | null {
    return this.doctors[0]?.doctorProfileId ?? null;
  }

  specialities: Speciality[] = [];
  specLoading = true;

  compareRows: CompareRow[] = [
    { feature: 'Convenience',           online: 'Attend from home, no travel, flexible scheduling',                    inPerson: 'Requires travel, fixed timing' },
    { feature: 'Waiting Time',          online: 'Usually short, instant or same-day slots available',                  inPerson: 'Often longer wait due to clinic queues' },
    { feature: 'Best For',              online: 'Routine issues, follow-ups, mild symptoms, second opinions',          inPerson: 'Conditions needing physical exam, procedures, emergencies' },
    { feature: 'Privacy',               online: 'High — consult happens from your private space',                      inPerson: 'Moderate; clinic setting involves staff movement' },
    { feature: 'Access to Specialists', online: 'Wide choice regardless of location',                                  inPerson: 'Limited to specialists available locally' },
    { feature: 'Documentation',         online: 'Digital prescriptions, easy record storage',                          inPerson: 'Paper files, user must organise manually' },
    { feature: 'Examination Limits',    online: 'Visual assessment only, relies on photos or patient description',     inPerson: 'Full physical exam and diagnostic tools available' },
  ];

  whyCards: WhyCard[] = [
    { icon: '📞', title: 'FREE Follow-Up Consultation', desc: 'Connect with your doctor again within 7 days',              bg: '#fff8f0' },
    { icon: '💊', title: 'Pocket-Friendly Care',        desc: 'Affordable consultations that fit your budget',            bg: '#f0f8ff' },
    { icon: '👨‍⚕️', title: 'Access to 16+ Specialists', desc: 'Expert care for your health concerns',                     bg: '#f0fff8' },
    { icon: '💰', title: '100% Refund if Referred Offline', desc: 'Applicable when your doctor recommends in-person care', bg: '#f8f8ff' },
    { icon: '🔒', title: '100% Private and Confidential', desc: 'A safe space to ask questions without hesitation',       bg: '#f8f8ff' },
  ];

  howSteps: HowStep[] = [
    { num: 1, icon: '🔍', title: 'Select your health concern',  desc: 'Choose a speciality that best suits your needs' },
    { num: 2, icon: '👨‍⚕️', title: 'Choose the doctor',          desc: 'Choose a doctor from our list of specialists.' },
    { num: 3, icon: '📅', title: 'Select your preferred slot',  desc: 'Choose a time that works best for you' },
    { num: 4, icon: '📱', title: 'Connect via video/audio call', desc: 'Join the consultation easily from your device.' },
    { num: 5, icon: '📄', title: 'Get e-prescription instantly', desc: 'Receive your prescription right after the call.' },
  ];

  ngOnInit(): void {
    this.loadSpecialities();
    this.loadDoctors();
  }

  private loadSpecialities(): void {
    this.api.getSkincares(1, 100).subscribe({
      next: (res) => {
        const items: any[] = res?.data ?? res ?? [];
        this.specialities = items.map((d, i) => ({
          name:   d.title,
          issues: `Starting at ₹${d.price}`,
          avatar: d.image ?? AVATAR_EMOJI[i % AVATAR_EMOJI.length],
          bg:     AVATAR_BG[i % AVATAR_BG.length],
        }));
        this.specLoading = false;
      },
      error: () => { this.specLoading = false; }
    });
  }

  loadDoctors(): void {
    this.doctorsLoading = true;
    this.doctorsError = '';
    this.doctorService.getCustomerDoctors(1, 10).subscribe({
      next: (data) => {
        this.doctors = data.map((d: any, i: number) => ({
          ...d,
          avatarBg:   AVATAR_BG[i % AVATAR_BG.length],
          avatar:     AVATAR_EMOJI[i % AVATAR_EMOJI.length],
        }));
        this.doctorsLoading = false;
      },
      error: (err) => {
        this.doctorsError = err?.error?.message || 'Could not load doctors.';
        this.doctorsLoading = false;
      }
    });
  }

  consultDoctor(id: number, doc?: any): void {
    this.router.navigate(['/doctor-booking', id], doc ? { state: { doctor: doc } } : {});
  }

  scrollSpec(dir: 'prev' | 'next'): void {
    this.specTrackRef.nativeElement.scrollBy({ left: dir === 'next' ? 380 : -380, behavior: 'smooth' });
  }

  scrollDoctors(dir: 'prev' | 'next'): void {
    this.doctorTrackRef.nativeElement.scrollBy({ left: dir === 'next' ? 280 : -280, behavior: 'smooth' });
  }
}
