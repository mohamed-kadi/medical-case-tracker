import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { I18nService } from './core/services/i18n.service';
import { LanguageSwitcherComponent } from './shared/language-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, LanguageSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    public readonly i18n: I18nService
  ) {}

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isAuthRoute(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.startsWith('/login') || currentUrl.startsWith('/register');
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
