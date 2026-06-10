import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-healthcare',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './healthcare.html',
  styleUrl: './healthcare.css',
})
export class HealthcareComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  slides = [
    { img: '/assests/healthcare1.jpg', alt: 'Healthcare Banner 1' },
    { img: '/assests/healthcare2.jpg', alt: 'Healthcare Banner 2' },
    { img: '/assests/healthcare3.jpg', alt: 'Healthcare Banner 3' },
  ];

  currentSlide = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  get nextSlideIndex(): number {
    return (this.currentSlide + 1) % this.slides.length;
  }

  // Loaded from API
  categories: any[] = [];
  catsLoading = true;

  healthcareData:    any[] = [];
  healthFoodDrinks:  any[] = [];
  healthcareDevices: any[] = [];
  skincares:         any[] = [];
  sectionsLoading = true;

  ngOnInit(): void {
    this.timer = setInterval(() => { this.nextSlide(); this.cdr.markForCheck(); }, 4000);
    this.loadCategories();
    this.loadSections();
  }

  private loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
        this.catsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.catsLoading = false; this.cdr.markForCheck(); }
    });
  }

  catInitial(name: string): string {
    return name?.trim()[0]?.toUpperCase() ?? '?';
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private loadSections(): void {
    this.api.getHealthcareData(1, 8).subscribe({
      next: res => { this.healthcareData = res?.data ?? res ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.api.getHealthFoodDrinks(1, 8).subscribe({
      next: res => { this.healthFoodDrinks = res?.data ?? res ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.api.getHealthcareDevices(1, 8).subscribe({
      next: res => { this.healthcareDevices = res?.data ?? res ?? []; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.api.getSkincares(1, 8).subscribe({
      next: res => {
        this.skincares = res?.data ?? res ?? [];
        this.sectionsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.sectionsLoading = false; this.cdr.markForCheck(); }
    });
  }

  prevSlide(): void {
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.resetTimer();
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  goToSlide(i: number): void {
    this.currentSlide = i;
    this.resetTimer();
  }

  private resetTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => { this.nextSlide(); this.cdr.markForCheck(); }, 4000);
  }
}
