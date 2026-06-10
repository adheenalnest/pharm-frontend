import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8081';

  // Simple in-memory cache — avoids re-fetching on every navigation
  private listCache: any[] | null = null;
  private detailCache = new Map<number, any>();

  // GET /doctors/customer — list of active doctors (no auth)
  getCustomerDoctors(page = 1, limit = 100): Observable<any[]> {
    if (this.listCache) {
      return of(this.listCache);
    }
    return this.http.get<any>(`${this.baseUrl}/doctors/customer?page=${page}&limit=${limit}`).pipe(
      map(res => res?.data ?? res),
      tap(data => { this.listCache = data; })
    );
  }

  // GET /doctors/customer/{id} — full profile + weekly availability slots
  getDoctorDetail(id: number): Observable<any> {
    if (this.detailCache.has(id)) {
      return of(this.detailCache.get(id));
    }
    return this.http.get<any>(`${this.baseUrl}/doctors/customer/${id}`).pipe(
      tap(data => { if (data) this.detailCache.set(id, data); })
    );
  }

  // POST /checkout/booking — initiate booking + get Razorpay payment link (requires auth)
  checkoutBooking(data: {
    doctorProfileId: number;
    timeSlot: string;
    appointmentDate: string;
    patientName: string;
    patientNumber: string;
    age: number;
    gender: string;
    prescriptionUpload: string;
    description: string;
    modeOfConsult: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/checkout/booking`, data);
  }

  clearCache(): void {
    this.listCache = null;
    this.detailCache.clear();
  }
}
