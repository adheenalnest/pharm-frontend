import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://localhost:8081';

  getProducts(page = 1, limit = 20, categoryId?: number, search?: string): Observable<any> {
    let url = `${this.base}/products?page=${page}&limit=${limit}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (search?.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
    return this.http.get<any>(url);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.base}/categories`).pipe(
      map(res => res?.data ?? res ?? []),
      catchError(() => of([]))
    );
  }

  getBlogs(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}/blogs?page=${page}&limit=${limit}`);
  }

  getHealthcareData(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}/healthcaredata?page=${page}&limit=${limit}`);
  }

  getHealthFoodDrinks(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}/HealthFoodandDrinks?page=${page}&limit=${limit}`);
  }

  getHealthcareDevices(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}/HealthcareDevices?page=${page}&limit=${limit}`);
  }

  getSkincares(page = 1, limit = 20): Observable<any> {
    return this.http.get<any>(`${this.base}/skincares?page=${page}&limit=${limit}`);
  }

  getProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/products/${id}`);
  }

  getCart(couponName?: string): Observable<any> {
    let url = `${this.base}/cart`;
    if (couponName?.trim()) url += `?couponName=${encodeURIComponent(couponName)}`;
    return this.http.get<any>(url);
  }

  addToCart(productId: number, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.base}/cart/add`, { productId, quantity });
  }

  removeFromCart(productId: number, quantity?: number): Observable<any> {
    const body: any = { productId };
    if (quantity !== undefined) body.quantity = quantity;
    return this.http.post<any>(`${this.base}/cart/remove`, body);
  }

  checkoutProducts(couponName?: string): Observable<any> {
    const body: any = {};
    if (couponName?.trim()) body.couponName = couponName;
    return this.http.post<any>(`${this.base}/checkout/products`, body);
  }

  getOrders(): Observable<any> {
    return this.http.get<any>(`${this.base}/orders`);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.base}/profile`);
  }

  completeProfile(name: string, phone: string): Observable<any> {
    return this.http.post<any>(`${this.base}/profile/complete-profile`, { name, phone });
  }

  uploadPrescription(file: File): Observable<{ imageUrl: string }> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<{ imageUrl: string }>(`${this.base}/images/upload`, form);
  }
}
