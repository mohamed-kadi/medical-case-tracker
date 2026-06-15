import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  function setRouterUrl(url: string): void {
    const router = TestBed.inject(Router);
    Object.defineProperty(router, 'url', {
      configurable: true,
      get: () => url
    });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('does not keep Patients prefix active on the exact New patient route', () => {
    setRouterUrl('/patients/new');

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.isRoutePrefix('/patients')).toBeFalse();
  });

  it('keeps Patients prefix active for patient workspace routes', () => {
    setRouterUrl('/patients/25');

    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    expect(app.isRoutePrefix('/patients')).toBeTrue();
  });
});
