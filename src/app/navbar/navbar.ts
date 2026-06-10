import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  auth           = inject(AuthService);
  cart           = inject(CartService);
  private router = inject(Router);
  mobileMenuOpen = false;

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }

  goToProfile(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/profile']);
    } else {
      this.auth.openLogin();
    }
  }
}
