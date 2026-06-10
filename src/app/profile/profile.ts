import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading  = false;
  saving   = false;
  error    = '';
  saveMsg  = '';
  editMode = false;

  profile: any = null;

  // form fields
  nameInput  = '';
  phoneInput = '';

  get user(): any        { return this.profile?.user ?? null; }
  get initials(): string {
    const n = this.user?.name;
    if (n) return n.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    return (this.user?.email?.[0] ?? '?').toUpperCase();
  }
  get memberSince(): string {
    if (!this.user?.createdAt) return '';
    return new Date(this.user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
  get isNew(): boolean    { return !!this.user?.isNew; }
  get isAdmin(): boolean  { return this.user?.role === 'Admin'; }

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) {
      this.auth.openLogin();
      this.router.navigate(['/']);
      return;
    }
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error   = '';
    this.api.getProfile().subscribe({
      next: (res) => {
        this.profile    = res;
        this.nameInput  = res.user?.name  ?? '';
        this.phoneInput = res.user?.phone ?? '';
        this.loading    = false;
      },
      error: (err: any) => {
        if (err?.status === 401) {
          this.auth.logout();
          this.auth.openLogin();
          this.router.navigate(['/']);
        } else {
          this.error = err?.error?.message
            ?? 'Could not load profile. Make sure the server is running.';
        }
        this.loading = false;
      }
    });
  }

  openEdit(): void {
    this.nameInput  = this.user?.name  ?? '';
    this.phoneInput = this.user?.phone ?? '';
    this.editMode   = true;
    this.saveMsg    = '';
    this.error      = '';
  }

  cancelEdit(): void { this.editMode = false; }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  save(): void {
    if (!this.nameInput.trim()) { this.error = 'Name is required.'; return; }
    if (!this.phoneInput.trim()) { this.error = 'Phone number is required.'; return; }
    this.saving = true;
    this.error  = '';
    this.api.completeProfile(this.nameInput.trim(), this.phoneInput.trim()).subscribe({
      next: (res) => {
        // Update stored profile
        if (this.profile?.user) {
          this.profile.user.name  = this.nameInput.trim();
          this.profile.user.phone = this.phoneInput.trim();
          this.profile.user.isNew = false;
        }
        this.saving   = false;
        this.editMode = false;
        this.saveMsg  = 'Profile updated successfully!';
        setTimeout(() => this.saveMsg = '', 3500);
      },
      error: (err) => {
        this.error  = err?.error?.detail ?? err?.error?.message ?? 'Failed to save. Try again.';
        this.saving = false;
      }
    });
  }
}
