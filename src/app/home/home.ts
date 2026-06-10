import { Component, ViewChild, ElementRef, signal, OnInit, OnDestroy, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

interface Category {
  id: number; name: string; offer: string; offerColor: string; bg: string; icon: string;
}
interface Banner {
  id: number; tag: string; tagBg: string; bg: string;
  offer: string; title: string; subtitle: string; cta: string; ctaClass: string; light: boolean;
}
interface LabTest {
  id: number; name: string; bg: string; icon: string;
}
interface Step {
  num: number; text: string;
}
interface ShopCategory {
  id: number; categoryName: string; image?: string;
}
interface NewLaunch {
  id: number; name: string; mrp: number; price: number; disc: number; icon: string; image?: string;
}
interface WellnessProduct {
  id: number; name: string; mrp: number; price: number; disc: number; icon: string; image?: string;
}
interface FeaturedBrand {
  id: number; name: string; bg: string; icon: string;
}
interface ReviewCard {
  id: number; name: string; date: string; text: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly api    = inject(ApiService);
  private readonly cdr    = inject(ChangeDetectorRef);
  private bannerTimer: ReturnType<typeof setInterval> | null = null;

  productsLoading = true;

  // Prescription upload state
  prescUploading  = false;
  prescSuccess    = false;
  prescError      = '';
  prescImageUrl   = '';
  prescFileName   = '';

  @ViewChild('prescFileInput') prescFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('categoryTrack') categoryTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('bannersTrack')  bannersTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('labTrack')      labTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('shopCatTrack')  shopCatTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('nlTrack')       nlTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('wellnessTrack') wellnessTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('brandsTrack')   brandsTrackRef!: ElementRef<HTMLDivElement>;
  @ViewChild('reviewsTrack')  reviewsTrackRef!: ElementRef<HTMLDivElement>;

  activeDot = signal(0);

  categories: Category[] = [
    { id: 1, name: 'Medicine',           offer: 'SAVE 27%',      offerColor: '#f97316', bg: '#fff5ee', icon: '💊' },
    { id: 2, name: 'Lab Tests',          offer: 'BUY 1 GET 1',   offerColor: '#7c3aed', bg: '#f5f0ff', icon: '🔬' },
    { id: 3, name: 'Doctor Consult',     offer: 'FROM ₹199',     offerColor: '#f97316', bg: '#f0f7ff', icon: '👨‍⚕️' },
    { id: 4, name: 'Branded Substitute', offer: 'UPTO 50% OFF',  offerColor: '#f97316', bg: '#f0fff9', icon: '💰' },
    { id: 5, name: 'Healthcare',         offer: 'UPTO 60% OFF',  offerColor: '#f97316', bg: '#fff0f0', icon: '🏥' },
    { id: 6, name: 'Health Blogs',       offer: '',              offerColor: '',        bg: '#fff0f5', icon: '❤️' },
    { id: 7, name: 'PLUS',               offer: 'Save 5% Extra', offerColor: '#f97316', bg: '#f5f0ff', icon: '⭐' },
    { id: 8, name: 'Offers',             offer: '',              offerColor: '',        bg: '#fffbf0', icon: '🎁' },
  ];

  banners: Banner[] = [
    { id: 1, tag: '', tagBg: '', bg: 'linear-gradient(135deg,#00c8a8,#009e85 55%,#007a65)', offer: 'UPTO 70% OFF', title: 'Stay Fresh, Protected\n& Hydrated this Season.', subtitle: 'on Summer Essential products', cta: 'Explore Now', ctaClass: 'cta-white', light: true },
    { id: 2, tag: 'NOW AVAILABLE', tagBg: '#7c3aed', bg: 'linear-gradient(135deg,#fdf6ec,#f8e0be)', offer: 'CANCER CARE', title: 'Affordable Cancer\nMedicines', subtitle: 'Access life-saving treatments at the best prices.', cta: 'SHOP NOW', ctaClass: 'cta-dark', light: false },
    { id: 3, tag: 'NEW LAUNCH', tagBg: '#10b981', bg: 'linear-gradient(135deg,#1b3d5f,#0d2840)', offer: '', title: 'Trusted Devices for\nEveryday use\nby PharmEasy', subtitle: 'BP Monitors, Thermometers,\nWeighing Scales and more.', cta: 'Explore now', ctaClass: 'cta-yellow', light: true },
    { id: 4, tag: 'INTRODUCING', tagBg: '#00b09b', bg: 'linear-gradient(135deg,#1e6b4a,#0e3d28)', offer: 'UPTO 40% OFF', title: 'Stressed? Tired?\nTry Himalaya\nAshwagandha', subtitle: 'on Himalaya wellness range.', cta: 'Shop Now', ctaClass: 'cta-white', light: true },
    { id: 5, tag: 'EXCLUSIVE', tagBg: '#f59e0b', bg: 'linear-gradient(135deg,#4c1d95,#2e1065)', offer: 'Save 5% Extra', title: 'PharmEasy PLUS\nMembership', subtitle: 'On every order, every time.', cta: 'Join Now', ctaClass: 'cta-white', light: true },
  ];

  labTests: LabTest[] = [
    { id: 1, name: 'Full Body\nCheckups', bg: '#e6f4ee', icon: '🩺' },
    { id: 2, name: 'Vitamins',            bg: '#fff8e1', icon: '🍊' },
    { id: 3, name: 'Diabetes',            bg: '#e3f5fb', icon: '💉' },
    { id: 4, name: 'Women Care',          bg: '#fde8f0', icon: '👩‍⚕️' },
    { id: 5, name: 'Fever &\nInfection',  bg: '#dff0f7', icon: '🌡️' },
    { id: 6, name: 'Thyroid',             bg: '#ede8fb', icon: '🦋' },
    { id: 7, name: 'Heart',               bg: '#fde8e8', icon: '❤️' },
    { id: 8, name: 'Kidney',              bg: '#e8edfb', icon: '🫘' },
    { id: 9, name: 'Liver',               bg: '#fef3e2', icon: '🧬' },
  ];

  shopCategories: ShopCategory[] = [];
  shopCatLoading = true;

  newLaunches: NewLaunch[] = [];
  wellnessProducts: WellnessProduct[] = [];

  private readonly PRODUCT_ICONS = ['💊','🌿','🧴','🩺','💉','☀️','🫧','💪','🍋','⚡','🌟','🔵'];
  private readonly PRODUCT_BGS   = ['#fff5ee','#f0f9ff','#f0fdf4','#fff0f0','#f5f0ff','#fffbf0'];

  featuredBrands: FeaturedBrand[] = [
    { id: 1,  name: 'Dulcoflex', bg: '#fef9c3', icon: '💊' },
    { id: 2,  name: 'Lactacyd', bg: '#fce7f3', icon: '🌸' },
    { id: 3,  name: 'Diataal',  bg: '#fef3c7', icon: '🌿' },
    { id: 4,  name: 'Cetafresh', bg: '#ede9fe', icon: '💧' },
    { id: 5,  name: 'Aptivate', bg: '#d1fae5', icon: '🍃' },
    { id: 6,  name: 'Cetaphil', bg: '#dbeafe', icon: '🧴' },
    { id: 7,  name: 'Cipla',    bg: '#fce7f3', icon: '💊' },
    { id: 8,  name: 'Himalaya', bg: '#dcfce7', icon: '🌱' },
    { id: 9,  name: 'Sun Pharma', bg: '#fef9c3', icon: '☀️' },
    { id: 10, name: 'Abbott',   bg: '#dbeafe', icon: '🔬' },
  ];

  reviews: ReviewCard[] = [
    { id: 1, name: 'Niti Rohan',    date: 'December 11, 2024', text: "I ordered my dad's heart medication through the app late in the evening and to my surprise, it was delivered the next morning. The process was really smooth, and I even got a good discount. Making repeat orders is even more convenient." },
    { id: 2, name: 'Yogesh Shukla', date: 'January 10, 2025',  text: "I had mistakenly ordered the wrong strip of tablets and thought I'd have to go through a lot of hassle to return it, but the customer support made it super easy. They arranged a return pickup and my refund was processed in just 2 days." },
    { id: 3, name: 'Anuj Kumar',    date: 'March 12, 2025',    text: 'PharmEasy is the best application for ordering medicines and lab tests. I have been using it for the last 5 years. The customer support is also good.' },
    { id: 4, name: 'Meha Jain',     date: 'April 3, 2025',     text: 'Excellent app for checking up on your health. Gives you access to a wide range of generic medicines from trusted manufacturers. Helps save a lot of money. Loved it!' },
    { id: 5, name: 'Priya Sharma',  date: 'May 2, 2025',       text: 'Super fast delivery and great prices. The app is very easy to use and I love the reminders for medicine refills. Highly recommended for regular medicine needs.' },
    { id: 6, name: 'Ravi Patel',    date: 'May 18, 2025',      text: 'Best pharmacy app I have used. The lab test booking is very convenient and the reports come on time. Customer support is responsive and helpful.' },
  ];

  steps: Step[] = [
    { num: 1, text: 'Upload a photo of your prescription' },
    { num: 2, text: 'Add delivery address and place the order' },
    { num: 3, text: 'We will call you to confirm the medicines' },
    { num: 4, text: 'Now, sit back! your medicines will get delivered at your doorstep' },
  ];

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.shopCategories = cats;
        this.shopCatLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.shopCatLoading = false; this.cdr.markForCheck(); }
    });

    this.api.getProducts(1, 20).subscribe({
      next: (res) => {
        const items: any[] = res?.data ?? [];
        this.newLaunches = items.slice(0, 10).map((p, i) => ({
          id:    p.id,
          name:  p.name,
          mrp:   p.price,
          price: p.discountedPrice > 0 ? p.discountedPrice : p.price,
          disc:  p.discountedPrice > 0 ? Math.round((1 - p.discountedPrice / p.price) * 100) : 0,
          icon:  this.PRODUCT_ICONS[i % this.PRODUCT_ICONS.length],
          image: p.image,
        }));
        this.wellnessProducts = items.slice(0, 12).map((p, i) => ({
          id:    p.id,
          name:  p.name,
          mrp:   p.price,
          price: p.discountedPrice > 0 ? p.discountedPrice : p.price,
          disc:  p.discountedPrice > 0 ? Math.round((1 - p.discountedPrice / p.price) * 100) : 0,
          icon:  this.PRODUCT_ICONS[i % this.PRODUCT_ICONS.length],
          image: p.image,
        }));
        this.productsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.productsLoading = false; this.cdr.markForCheck(); }
    });
  }

  goToCategory(name: string): void {
    const map: Record<string, string> = {
      'Medicine':           '/medicine',
      'Doctor Consult':     '/doctor-consult',
      'Healthcare':         '/healthcare',
      'Health Blogs':       '/health-insights',
      'PLUS':               '/plus',
      'Branded Substitute': '/medicine',
      'Offers':             '/medicine',
      'Lab Tests':          '/',
    };
    this.router.navigateByUrl(map[name] ?? '/');
  }

  shopCatRoute(name: string): string {
    const clean = name.trim().toLowerCase().replace(/[\s\n\-]+/g, '-');
    const special: Record<string, string> = {
      'must-haves':             '/medicine',
      'health-food-and-drinks': '/healthcare/health-food-and-drinks',
      'health-food-drinks':     '/healthcare/health-food-and-drinks',
    };
    return special[clean] ?? `/healthcare/${clean}`;
  }

  shopCatInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  shopCatBg(index: number): string {
    const bgs = ['#fff5ee','#f0f8f0','#fff0f5','#f0f5ff','#f5fff0','#fff8f0','#f0fff5','#f0f5ff','#fff5f5','#f5f0ff'];
    return bgs[index % bgs.length];
  }

  triggerPrescUpload(): void {
    this.prescFileInputRef.nativeElement.value = '';
    this.prescFileInputRef.nativeElement.click();
  }

  onPrescFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.prescUploading = true;
    this.prescSuccess   = false;
    this.prescError     = '';
    this.prescFileName  = file.name;
    this.cdr.markForCheck();

    this.api.uploadPrescription(file).subscribe({
      next: (res) => {
        this.prescImageUrl  = res.imageUrl.startsWith('http')
          ? res.imageUrl
          : `http://localhost:8081${res.imageUrl}`;
        this.prescUploading = false;
        this.prescSuccess   = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.prescError     = 'Upload failed. Please try a JPG, PNG or PDF file under 10 MB.';
        this.prescUploading = false;
        this.cdr.markForCheck();
      }
    });
  }

  resetPrescUpload(): void {
    this.prescSuccess   = false;
    this.prescError     = '';
    this.prescImageUrl  = '';
    this.prescFileName  = '';
    this.cdr.markForCheck();
  }

  scrollCategories(): void {
    this.categoryTrackRef.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }

  scrollShopCategories(): void {
    this.shopCatTrackRef.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  scrollNewLaunches(): void {
    this.nlTrackRef.nativeElement.scrollBy({ left: 440, behavior: 'smooth' });
  }

  scrollWellness(): void {
    const el = this.wellnessTrackRef.nativeElement;
    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
  }

  scrollBrands(): void {
    this.brandsTrackRef.nativeElement.scrollBy({ left: 440, behavior: 'smooth' });
  }

  scrollReviews(): void {
    this.reviewsTrackRef.nativeElement.scrollBy({ left: 440, behavior: 'smooth' });
  }

  scrollLabTests(): void {
    this.labTrackRef.nativeElement.scrollBy({ left: 400, behavior: 'smooth' });
  }

  ngAfterViewInit(): void {
    this.startBannerTimer();
  }

  ngOnDestroy(): void {
    this.stopBannerTimer();
  }

  private startBannerTimer(): void {
    this.bannerTimer = setInterval(() => this.autoAdvanceBanner(), 3500);
  }

  private stopBannerTimer(): void {
    if (this.bannerTimer) { clearInterval(this.bannerTimer); this.bannerTimer = null; }
  }

  private resetBannerTimer(): void {
    this.stopBannerTimer();
    this.startBannerTimer();
  }

  private autoAdvanceBanner(): void {
    const el = this.bannersTrackRef.nativeElement;
    const gap = 16;
    const cardWidth = (el.clientWidth - 2 * gap) / 3;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (el.scrollLeft >= maxScroll - 4) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      setTimeout(() => this.syncDot(), 420);
    } else {
      el.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
      setTimeout(() => this.syncDot(), 420);
    }
  }

  scrollBanners(dir: 'prev' | 'next'): void {
    const el = this.bannersTrackRef.nativeElement;
    const gap = 16;
    const cardWidth = (el.clientWidth - 2 * gap) / 3;
    el.scrollBy({ left: dir === 'next' ? cardWidth + gap : -(cardWidth + gap), behavior: 'smooth' });
    setTimeout(() => this.syncDot(), 420);
    this.resetBannerTimer();
  }

  onBannersScroll(): void { this.syncDot(); }

  goToDot(i: number): void {
    const el = this.bannersTrackRef.nativeElement;
    const gap = 16;
    const cardWidth = (el.clientWidth - 2 * gap) / 3;
    el.scrollTo({ left: i * (cardWidth + gap), behavior: 'smooth' });
    this.activeDot.set(i);
    this.resetBannerTimer();
  }

  private syncDot(): void {
    const el = this.bannersTrackRef.nativeElement;
    const gap = 16;
    const cardWidth = (el.clientWidth - 2 * gap) / 3;
    const dot = Math.round(el.scrollLeft / (cardWidth + gap));
    this.activeDot.set(Math.max(0, Math.min(dot, this.banners.length - 1)));
  }
}
