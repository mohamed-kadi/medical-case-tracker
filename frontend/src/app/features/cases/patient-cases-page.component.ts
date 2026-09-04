import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';

import { Patient } from '../../core/models/patient.model';
import { PatientService } from '../../core/services/patient.service';
import { ConfirmationService } from '../../shared/confirmation.service';
import { CaseService } from '../../core/services/case.service';
import { CaseStatus, CASE_STATUSES, MedicalCase } from '../../core/models/case.model';
import { ImageCategory, IMAGE_CATEGORIES, MedicalImage } from '../../core/models/image.model';
import { ImageService } from '../../core/services/image.service';
import { I18nService } from '../../core/services/i18n.service';
import { StatusLabelPipe } from '../../shared/status-label.pipe';

@Component({
  selector: 'app-patient-cases-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusLabelPipe],
  template: `
    <section class="cases-shell">
      <header class="cases-header">
        <div>
          <h1>{{ patient ? (patient.firstName + ' ' + patient.lastName) : i18n.t('cases.title') }}</h1>
          <p *ngIf="patient">{{ patient.patientNumber || '-' }} · {{ patient.email }}</p>
        </div>
        <a class="back-link" [routerLink]="patient ? ['/patients', patient.id] : ['/patients']">
          {{ i18n.t('cases.backToPatient') }}
        </a>
      </header>

      <section class="overview">
        <article class="overview-card">
          <span>{{ i18n.t('cases.overview.totalCases') }}</span>
          <strong>{{ cases.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('cases.overview.images') }}</span>
          <strong>{{ images.length }}</strong>
        </article>
        <article class="overview-card">
          <span>{{ i18n.t('cases.overview.selectedStatus') }}</span>
          <strong>{{ selectedCase ? (selectedCase.status | statusLabel: 'cases') : '-' }}</strong>
        </article>
      </section>

      <p class="feedback error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="feedback success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="loading" *ngIf="isLoadingPatient || isLoadingCases">{{ i18n.t('cases.loading') }}</p>

      <section class="panel-grid">
        <article class="panel">
          <h2>{{ i18n.t('cases.list.title') }}</h2>
          <div class="case-list" *ngIf="cases.length > 0; else emptyCases">
            <button
              *ngFor="let medicalCase of cases; trackBy: trackByCaseId"
              type="button"
              class="case-item"
              [class.active]="medicalCase.id === selectedCaseId"
              (click)="selectCase(medicalCase.id)"
            >
              <strong>{{ medicalCase.title }}</strong>
              <small>{{ medicalCase.status | statusLabel: 'cases' }}</small>
            </button>
          </div>
          <ng-template #emptyCases>
            <p>{{ i18n.t('cases.list.empty') }}</p>
          </ng-template>

          <hr />

          <h3>{{ i18n.t('cases.create.title') }}</h3>
          <form [formGroup]="createCaseForm" (ngSubmit)="createCase()" novalidate>
            <label>
              {{ i18n.t('cases.create.titleField') }}
              <input type="text" formControlName="title" />
            </label>
            <label>
              {{ i18n.t('cases.create.descriptionField') }}
              <textarea rows="3" formControlName="description"></textarea>
            </label>
            <label>
              {{ i18n.t('cases.create.planField') }}
              <textarea rows="3" formControlName="treatmentPlan"></textarea>
            </label>
            <small *ngIf="isCreateControlInvalid('title')">{{ i18n.t('common.required') }}</small>
            <button type="submit" [disabled]="isCreatingCase">
              {{ isCreatingCase ? i18n.t('cases.create.saving') : i18n.t('cases.create.submit') }}
            </button>
          </form>
        </article>

        <article class="panel">
          <h2>{{ i18n.t('cases.editor.title') }}</h2>
          <ng-container *ngIf="selectedCase; else noSelection">
            <form [formGroup]="caseEditorForm" (ngSubmit)="saveSelectedCase()" novalidate>
              <label>
                {{ i18n.t('cases.create.titleField') }}
                <input type="text" formControlName="title" />
              </label>
              <label>
                {{ i18n.t('cases.create.descriptionField') }}
                <textarea rows="3" formControlName="description"></textarea>
              </label>
              <label>
                {{ i18n.t('cases.create.planField') }}
                <textarea rows="3" formControlName="treatmentPlan"></textarea>
              </label>
              <label>
                {{ i18n.t('cases.editor.statusLabel') }}
                <select formControlName="status">
                  <option *ngFor="let status of caseStatuses" [ngValue]="status">
                    {{ status | statusLabel: 'cases' }}
                  </option>
                </select>
              </label>
              <small *ngIf="isEditorControlInvalid('title')">{{ i18n.t('common.required') }}</small>
              <button type="submit" [disabled]="isSavingCase">
                {{ isSavingCase ? i18n.t('cases.editor.saving') : i18n.t('cases.editor.save') }}
              </button>
            </form>

            <hr />

            <h3>{{ i18n.t('cases.images.title') }}</h3>
            <label class="image-filter">
              {{ i18n.t('cases.images.filter') }}
              <select [value]="imageCategoryFilter" (change)="setImageCategoryFilter($any($event.target).value)">
                <option value="ALL">{{ i18n.t('cases.images.filter.all') }}</option>
                <option *ngFor="let category of imageCategories" [value]="category">
                  {{ categoryLabel(category) }}
                </option>
              </select>
            </label>
            <p class="loading" *ngIf="isLoadingImages">{{ i18n.t('cases.images.loading') }}</p>
            <p class="feedback error" *ngIf="imageErrorMessage">{{ imageErrorMessage }}</p>
            <p class="feedback success" *ngIf="imageSuccessMessage">{{ imageSuccessMessage }}</p>

            <form [formGroup]="imageUploadForm" (ngSubmit)="uploadImage()" novalidate>
              <label>
                {{ i18n.t('cases.images.category') }}
                <select formControlName="category">
                  <option *ngFor="let category of imageCategories" [ngValue]="category">
                    {{ categoryLabel(category) }}
                  </option>
                </select>
              </label>
              <label>
                {{ i18n.t('cases.images.description') }}
                <input type="text" formControlName="description" />
              </label>
              <label>
                {{ i18n.t('cases.images.file') }}
                <input type="file" (change)="onFileSelected($event)" accept="image/*" />
              </label>
              <small>{{ selectedFileName || i18n.t('cases.images.noFile') }}</small>
              <button type="submit" [disabled]="isUploadingImage || !selectedUploadFile">
                {{ isUploadingImage ? i18n.t('cases.images.uploading') : i18n.t('cases.images.upload') }}
              </button>
            </form>

            <div class="image-list" *ngIf="images.length > 0; else noImages">
              <article class="image-item" *ngFor="let image of images; trackBy: trackByImageId">
                <div>
                  <strong>{{ image.fileName }}</strong>
                  <small>{{ categoryLabel(image.category) }} · {{ image.uploadedBy }}</small>
                </div>
                <div class="image-actions">
                  <button type="button" class="secondary" (click)="previewImage(image)">
                    {{ i18n.t('cases.images.preview') }}
                  </button>
                  <button type="button" class="secondary" (click)="downloadImage(image)" [disabled]="isDownloadingImageId === image.id">
                    {{
                      isDownloadingImageId === image.id
                        ? i18n.t('cases.images.downloading')
                        : i18n.t('cases.images.download')
                    }}
                  </button>
                  <button type="button" class="secondary" (click)="deleteImage(image.id)">
                    {{ i18n.t('cases.images.delete') }}
                  </button>
                </div>
              </article>
            </div>
            <ng-template #noImages>
              <p>{{ i18n.t('cases.images.empty') }}</p>
            </ng-template>

            <p class="loading" *ngIf="isPreviewLoading">{{ i18n.t('cases.images.previewLoading') }}</p>
            <figure class="preview-panel" *ngIf="previewImageUrl">
              <figcaption>
                <strong>{{ i18n.t('cases.images.previewTitle') }}</strong>
                <span>{{ previewImageName }}</span>
                <button type="button" class="secondary" (click)="closePreview()">
                  {{ i18n.t('cases.images.closePreview') }}
                </button>
              </figcaption>
              <img [src]="previewImageUrl" [alt]="previewImageName" loading="lazy" />
            </figure>
          </ng-container>
          <ng-template #noSelection>
            <p>{{ i18n.t('cases.editor.empty') }}</p>
          </ng-template>
        </article>
      </section>
    </section>
  `,
  styles: `
    .cases-shell {
      width: min(86rem, 100%);
      display: grid;
      gap: 1rem;
    }

    .cases-header {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 1rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.7rem, 2.2vw, 2.3rem);
      line-height: 1.1;
    }

    h2,
    h3 {
      margin: 0;
    }

    .cases-header p {
      margin: 0.35rem 0 0;
      color: var(--muted);
    }

    .back-link {
      border: 1px solid var(--surface-strong);
      background: var(--surface);
      color: var(--ink);
      border-radius: 0.55rem;
      padding: 0.45rem 0.65rem;
      text-decoration: none;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 0.7rem;
    }

    .overview-card {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.85rem;
      padding: 0.8rem 0.9rem;
      display: grid;
      gap: 0.2rem;
    }

    .overview-card span {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .overview-card strong {
      font-size: 1.3rem;
      line-height: 1.1;
    }

    .panel-grid {
      display: grid;
      grid-template-columns: minmax(16rem, 22rem) minmax(0, 1fr);
      gap: 1rem;
      align-items: start;
    }

    .panel {
      border: 1px solid var(--surface-strong);
      background: var(--surface-elevated);
      border-radius: 0.95rem;
      padding: 1rem;
      box-shadow: var(--elevation-soft);
      display: grid;
      gap: 0.65rem;
      min-width: 0;
    }

    .case-list {
      display: grid;
      gap: 0.5rem;
      max-height: 22rem;
      overflow: auto;
    }

    .case-item {
      text-align: left;
      padding: 0.55rem 0.6rem;
      border-radius: 0.6rem;
      border: 1px solid var(--surface-strong);
      background: var(--surface);
      display: grid;
      gap: 0.2rem;
    }

    .case-item.active {
      border-color: color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    }

    .case-item small {
      color: var(--muted);
    }

    form {
      display: grid;
      gap: 0.5rem;
    }

    label {
      display: grid;
      gap: 0.3rem;
      color: var(--muted);
      font-size: 0.83rem;
    }

    input,
    select,
    textarea,
    button {
      border: 1px solid var(--surface-strong);
      border-radius: 0.5rem;
      background: var(--surface);
      color: var(--ink);
      font-family: inherit;
    }

    input,
    select,
    textarea {
      width: 100%;
      min-width: 0;
      padding: 0.5rem 0.55rem;
      font-size: 0.88rem;
    }

    textarea {
      resize: vertical;
      min-height: 4rem;
    }

    button {
      width: fit-content;
      padding: 0.45rem 0.65rem;
      font-size: 0.84rem;
      cursor: pointer;
    }

    button.secondary {
      background: transparent;
    }

    button:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .image-list {
      display: grid;
      gap: 0.5rem;
    }

    .image-filter {
      max-width: 18rem;
    }

    .image-item {
      border: 1px solid var(--surface-strong);
      border-radius: 0.65rem;
      padding: 0.55rem 0.65rem;
      background: var(--surface);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .image-item small {
      display: block;
      color: var(--muted);
      margin-top: 0.15rem;
      font-size: 0.77rem;
    }

    .image-actions {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      justify-content: end;
    }

    .preview-panel {
      margin: 0.25rem 0 0;
      padding: 0.7rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.75rem;
      background: var(--surface);
      display: grid;
      gap: 0.6rem;
    }

    .preview-panel figcaption {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      flex-wrap: wrap;
    }

    .preview-panel figcaption span {
      color: var(--muted);
      font-size: 0.83rem;
    }

    .preview-panel img {
      width: 100%;
      border-radius: 0.55rem;
      border: 1px solid var(--surface-strong);
      max-height: 28rem;
      object-fit: contain;
      background: color-mix(in srgb, var(--surface) 82%, #ffffff08);
    }

    .feedback {
      margin: 0;
      font-weight: 600;
    }

    .feedback.error {
      color: var(--danger);
    }

    .feedback.success {
      color: var(--success);
    }

    .loading {
      margin: 0;
      color: var(--muted);
    }

    hr {
      border: 0;
      border-top: 1px solid var(--surface-strong);
      margin: 0.2rem 0;
    }

    @media (max-width: 1040px) {
      .panel-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 860px) {
      .cases-header {
        align-items: start;
        flex-direction: column;
      }
    }
  `
})
export class PatientCasesPageComponent implements OnInit, OnDestroy {
  patient: Patient | null = null;
  cases: MedicalCase[] = [];
  images: MedicalImage[] = [];
  selectedCaseId: number | null = null;
  selectedUploadFile: File | null = null;
  selectedFileName = '';
  imageCategoryFilter: ImageCategory | 'ALL' = 'ALL';
  previewImageUrl: string | null = null;
  previewImageName = '';

  isLoadingPatient = false;
  isLoadingCases = false;
  isLoadingImages = false;
  isCreatingCase = false;
  isSavingCase = false;
  isUploadingImage = false;
  isPreviewLoading = false;
  isDownloadingImageId: number | null = null;

  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  imageSuccessMessage = '';

  readonly caseStatuses = CASE_STATUSES;
  readonly imageCategories = IMAGE_CATEGORIES;

  readonly createCaseForm;
  readonly caseEditorForm;
  readonly imageUploadForm;

  private patientId: number | null = null;
  private preferredCaseId: number | null = null;
  private previewObjectUrl: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly formBuilder: FormBuilder,
    private readonly patientService: PatientService,
    private readonly caseService: CaseService,
    private readonly imageService: ImageService,
    private readonly confirmation: ConfirmationService,
    public readonly i18n: I18nService
  ) {
    this.createCaseForm = this.formBuilder.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      treatmentPlan: ['']
    });

    this.caseEditorForm = this.formBuilder.nonNullable.group({
      title: ['', Validators.required],
      description: [''],
      treatmentPlan: [''],
      status: ['OPEN' as CaseStatus, Validators.required]
    });

    this.imageUploadForm = this.formBuilder.nonNullable.group({
      category: ['BEFORE_TREATMENT' as ImageCategory, Validators.required],
      description: ['']
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedPatientId = idParam == null ? Number.NaN : Number(idParam);
    if (!Number.isFinite(parsedPatientId)) {
      void this.router.navigateByUrl('/patients');
      return;
    }

    this.patientId = parsedPatientId;
    this.preferredCaseId = this.parsePreferredCaseId(this.route.snapshot.queryParamMap?.get('caseId') ?? null);
    this.loadPatient(parsedPatientId);
    this.loadCases(parsedPatientId);
  }

  ngOnDestroy(): void {
    this.releasePreviewObjectUrl();
  }

  get selectedCase(): MedicalCase | null {
    if (this.selectedCaseId == null) {
      return null;
    }
    return this.cases.find((medicalCase) => medicalCase.id === this.selectedCaseId) ?? null;
  }

  trackByCaseId(_index: number, medicalCase: MedicalCase): number {
    return medicalCase.id;
  }

  trackByImageId(_index: number, image: MedicalImage): number {
    return image.id;
  }

  isCreateControlInvalid(controlName: 'title'): boolean {
    const control = this.createCaseForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isEditorControlInvalid(controlName: 'title'): boolean {
    const control = this.caseEditorForm.controls[controlName];
    return control.invalid && control.touched;
  }

  selectCase(caseId: number): void {
    this.selectedCaseId = caseId;
    const medicalCase = this.selectedCase;
    if (!medicalCase) {
      this.images = [];
      this.closePreview();
      return;
    }

    this.caseEditorForm.patchValue({
      title: medicalCase.title,
      description: medicalCase.description ?? '',
      treatmentPlan: medicalCase.treatmentPlan ?? '',
      status: medicalCase.status
    });

    this.closePreview();
    this.loadImages(caseId);
  }

  setImageCategoryFilter(filterValue: string): void {
    this.imageCategoryFilter = this.normalizeImageCategoryFilter(filterValue);
    if (this.selectedCaseId == null) {
      this.images = [];
      this.closePreview();
      return;
    }
    this.loadImages(this.selectedCaseId);
  }

  createCase(): void {
    if (this.patientId == null) {
      return;
    }
    if (this.createCaseForm.invalid) {
      this.createCaseForm.markAllAsTouched();
      return;
    }

    this.isCreatingCase = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.createCaseForm.getRawValue();
    this.caseService
      .createCase(this.patientId, {
        title: payload.title.trim(),
        description: this.normalizeOptionalValue(payload.description),
        treatmentPlan: this.normalizeOptionalValue(payload.treatmentPlan)
      })
      .subscribe({
        next: (createdCase) => {
          this.cases = [createdCase, ...this.cases];
          this.createCaseForm.reset({
            title: '',
            description: '',
            treatmentPlan: ''
          });
          this.selectCase(createdCase.id);
          this.successMessage = this.i18n.t('cases.feedback.createSuccess');
          this.isCreatingCase = false;
        },
        error: () => {
          this.errorMessage = this.i18n.t('cases.feedback.createError');
          this.isCreatingCase = false;
        }
      });
  }

  saveSelectedCase(): void {
    if (this.caseEditorForm.invalid) {
      this.caseEditorForm.markAllAsTouched();
      return;
    }
    const medicalCase = this.selectedCase;
    if (!medicalCase) {
      return;
    }

    this.isSavingCase = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = this.caseEditorForm.getRawValue();
    const nextStatus = payload.status;
    const shouldUpdateStatus = medicalCase.status !== nextStatus;

    this.caseService
      .updateCase(medicalCase.id, {
        title: payload.title.trim(),
        description: this.normalizeOptionalValue(payload.description),
        treatmentPlan: this.normalizeOptionalValue(payload.treatmentPlan),
        status: nextStatus
      })
      .pipe(
        switchMap((updatedCase) => {
          if (!shouldUpdateStatus) {
            return of(updatedCase);
          }
          return this.caseService.updateCaseStatus(medicalCase.id, nextStatus);
        })
      )
      .subscribe({
        next: (updatedCase) => {
          this.replaceCase(updatedCase);
          this.caseEditorForm.patchValue({
            title: updatedCase.title,
            description: updatedCase.description ?? '',
            treatmentPlan: updatedCase.treatmentPlan ?? '',
            status: updatedCase.status
          });
          this.successMessage = this.i18n.t('cases.feedback.updateSuccess');
          this.isSavingCase = false;
        },
        error: () => {
          this.errorMessage = this.i18n.t('cases.feedback.updateError');
          this.isSavingCase = false;
        }
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.item(0) ?? null;
    this.selectedUploadFile = file;
    this.selectedFileName = file?.name ?? '';
  }

  uploadImage(): void {
    if (this.selectedCaseId == null || this.selectedUploadFile == null) {
      return;
    }

    this.isUploadingImage = true;
    this.imageErrorMessage = '';
    this.imageSuccessMessage = '';

    const payload = this.imageUploadForm.getRawValue();
    this.imageService
      .uploadImage(
        this.selectedUploadFile,
        this.selectedCaseId,
        payload.category,
        this.normalizeOptionalValue(payload.description)
      )
      .subscribe({
        next: () => {
          this.selectedUploadFile = null;
          this.selectedFileName = '';
          this.imageUploadForm.patchValue({ description: '' });
          this.imageSuccessMessage = this.i18n.t('cases.feedback.uploadSuccess');
          this.loadImages(this.selectedCaseId!);
          this.isUploadingImage = false;
        },
        error: (error) => {
          this.imageErrorMessage = this.resolveErrorMessage(error, 'cases.feedback.uploadError');
          this.isUploadingImage = false;
        }
      });
  }

  deleteImage(imageId: number): void {
    if (!this.confirmation.confirm('cases.images.deleteConfirm')) {
      return;
    }
    this.imageErrorMessage = '';
    this.imageSuccessMessage = '';
    this.imageService.deleteImage(imageId).subscribe({
      next: () => {
        this.images = this.images.filter((image) => image.id !== imageId);
        if (this.images.length === 0) {
          this.closePreview();
        }
      },
      error: () => {
        this.imageErrorMessage = this.i18n.t('cases.feedback.deleteError');
      }
    });
  }

  previewImage(image: MedicalImage): void {
    this.isPreviewLoading = true;
    this.imageErrorMessage = '';

    this.imageService.downloadImage(image.id).subscribe({
      next: (blob) => {
        this.assignPreviewObjectUrl(blob);
        this.previewImageName = image.fileName;
        this.isPreviewLoading = false;
      },
      error: () => {
        this.imageErrorMessage = this.i18n.t('cases.feedback.previewError');
        this.isPreviewLoading = false;
      }
    });
  }

  downloadImage(image: MedicalImage): void {
    this.isDownloadingImageId = image.id;
    this.imageErrorMessage = '';

    this.imageService.downloadImage(image.id).subscribe({
      next: (blob) => {
        this.triggerBrowserDownload(blob, image.fileName);
        this.isDownloadingImageId = null;
      },
      error: () => {
        this.imageErrorMessage = this.i18n.t('cases.feedback.downloadError');
        this.isDownloadingImageId = null;
      }
    });
  }

  closePreview(): void {
    this.releasePreviewObjectUrl();
    this.previewImageName = '';
  }

  categoryLabel(category: ImageCategory): string {
    const key = `cases.categories.${category}`;
    const translated = this.i18n.t(key);
    return translated === key ? category : translated;
  }

  private loadPatient(patientId: number): void {
    this.isLoadingPatient = true;
    this.patientService.getPatientById(patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoadingPatient = false;
      },
      error: () => {
        this.errorMessage = this.i18n.t('cases.feedback.patientError');
        this.isLoadingPatient = false;
      }
    });
  }

  private loadCases(patientId: number): void {
    this.isLoadingCases = true;
    this.errorMessage = '';
    this.caseService.getCasesByPatientId(patientId).subscribe({
      next: (cases) => {
        this.cases = [...cases];
        const selectedCaseId = this.resolveNextSelectedCaseId();
        this.isLoadingCases = false;

        if (selectedCaseId != null) {
          this.selectCase(selectedCaseId);
        } else {
          this.images = [];
        }
      },
      error: () => {
        this.errorMessage = this.i18n.t('cases.feedback.loadCasesError');
        this.isLoadingCases = false;
      }
    });
  }

  private resolveNextSelectedCaseId(): number | null {
    if (this.preferredCaseId != null && this.cases.some((medicalCase) => medicalCase.id === this.preferredCaseId)) {
      const nextCaseId = this.preferredCaseId;
      this.preferredCaseId = null;
      return nextCaseId;
    }
    return this.selectedCaseId ?? this.cases[0]?.id ?? null;
  }

  private loadImages(caseId: number): void {
    this.isLoadingImages = true;
    this.imageErrorMessage = '';

    this.imageService.getImagesByCase(caseId, this.imageCategoryFilter).subscribe({
      next: (images) => {
        this.images = images;
        if (images.length === 0) {
          this.closePreview();
        }
        this.isLoadingImages = false;
      },
      error: (error) => {
        this.images = [];
        this.closePreview();
        this.imageErrorMessage = this.resolveErrorMessage(error, 'cases.feedback.loadImagesError');
        this.isLoadingImages = false;
      }
    });
  }

  private replaceCase(updatedCase: MedicalCase): void {
    this.cases = this.cases.map((medicalCase) => (medicalCase.id === updatedCase.id ? updatedCase : medicalCase));
  }

  private normalizeOptionalValue(value: string): string | null {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private parsePreferredCaseId(value: string | null): number | null {
    if (value == null || value.trim().length === 0) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeImageCategoryFilter(value: string): ImageCategory | 'ALL' {
    if (value === 'ALL') {
      return 'ALL';
    }
    return this.imageCategories.includes(value as ImageCategory) ? (value as ImageCategory) : 'ALL';
  }

  private assignPreviewObjectUrl(blob: Blob): void {
    this.releasePreviewObjectUrl();
    this.previewObjectUrl = URL.createObjectURL(blob);
    this.previewImageUrl = this.previewObjectUrl;
  }

  private releasePreviewObjectUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    this.previewImageUrl = null;
  }

  private triggerBrowserDownload(blob: Blob, fileName: string): void {
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
  }

  private resolveErrorMessage(error: unknown, fallbackKey: string): string {
    const fallback = this.i18n.t(fallbackKey);
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (typeof error.error === 'string' && error.error.trim().length > 0) {
      return error.error;
    }

    if (error.error && typeof error.error === 'object') {
      const message = (error.error as { message?: unknown; error?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }

      const genericError = (error.error as { message?: unknown; error?: unknown }).error;
      if (typeof genericError === 'string' && genericError.trim().length > 0) {
        return genericError;
      }
    }

    return fallback;
  }
}
