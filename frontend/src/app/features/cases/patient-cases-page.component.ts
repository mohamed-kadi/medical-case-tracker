import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap } from 'rxjs';

import { Patient } from '../../core/models/patient.model';
import { PatientService } from '../../core/services/patient.service';
import { ConfirmationService } from '../../shared/confirmation.service';
import { CaseService } from '../../core/services/case.service';
import { CaseStatus, CASE_STATUSES, MedicalCase } from '../../core/models/case.model';
import { ImageCategory, IMAGE_CATEGORIES, MedicalImage } from '../../core/models/image.model';
import { ImageService } from '../../core/services/image.service';
import { I18nService } from '../../core/services/i18n.service';
import { StatusLabelPipe } from '../../shared/status-label.pipe';
import { Prescription, PrescriptionItem, PrescriptionUpsertRequest } from '../../core/models/prescription.model';
import { PrescriptionService } from '../../core/services/prescription.service';
import { AuthService } from '../../core/services/auth.service';
import { LocalizedDatePipe } from '../../shared/localized-date.pipe';

@Component({
  selector: 'app-patient-cases-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StatusLabelPipe, LocalizedDatePipe],
  template: `
    <section class="cases-shell">
      <header class="cases-header">
        <div class="patient-identity" *ngIf="patient; else loadingIdentity">
          <span class="patient-avatar" aria-hidden="true">{{ patient.firstName.charAt(0) }}{{ patient.lastName.charAt(0) }}</span>
          <span class="patient-primary">
            <small>{{ i18n.t('cases.patient.label') }}</small>
            <strong>{{ patient.firstName }} {{ patient.lastName }}</strong>
          </span>
          <span class="patient-detail">
            <small>{{ i18n.t('cases.patient.number') }}</small>
            <strong>{{ patient.patientNumber || '-' }}</strong>
          </span>
          <span class="patient-detail">
            <small>{{ i18n.t('cases.patient.email') }}</small>
            <strong>{{ patient.email || i18n.t('cases.patient.notProvided') }}</strong>
          </span>
        </div>
        <ng-template #loadingIdentity><p class="loading">{{ i18n.t('cases.loading') }}</p></ng-template>
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
      </section>

      <p class="feedback error" *ngIf="errorMessage" role="alert">{{ errorMessage }}</p>
      <p class="feedback success" *ngIf="successMessage" role="status">{{ successMessage }}</p>
      <p class="loading" *ngIf="isLoadingPatient || isLoadingCases">{{ i18n.t('cases.loading') }}</p>

      <section class="panel case-navigation">
        <header class="section-header">
          <div>
            <h2>{{ i18n.t('cases.list.title') }}</h2>
            <p>{{ i18n.t('cases.list.help') }}</p>
          </div>
          <button type="button" class="secondary" (click)="createFormExpanded = !createFormExpanded" [attr.aria-expanded]="createFormExpanded">
            {{ createFormExpanded ? i18n.t('cases.create.collapse') : i18n.t('cases.create.open') }}
          </button>
        </header>
          <div class="case-list" *ngIf="cases.length > 0; else emptyCases">
            <button
              *ngFor="let medicalCase of cases; trackBy: trackByCaseId"
              type="button"
              class="case-item"
              [class.active]="medicalCase.id === selectedCaseId"
              [attr.aria-pressed]="medicalCase.id === selectedCaseId"
              (click)="selectCase(medicalCase.id)"
            >
              <strong>{{ medicalCase.title }}</strong>
              <small class="case-status">{{ medicalCase.status | statusLabel: 'cases' }}</small>
            </button>
          </div>
          <ng-template #emptyCases>
            <p>{{ i18n.t('cases.list.empty') }}</p>
          </ng-template>

          <form class="create-case-form" *ngIf="createFormExpanded" [formGroup]="createCaseForm" (ngSubmit)="createCase()" novalidate>
            <h3>{{ i18n.t('cases.create.title') }}</h3>
            <div class="create-fields">
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
            </div>
            <small *ngIf="isCreateControlInvalid('title')">{{ i18n.t('common.required') }}</small>
            <button type="submit" [disabled]="isCreatingCase">
              {{ isCreatingCase ? i18n.t('cases.create.saving') : i18n.t('cases.create.submit') }}
            </button>
          </form>
      </section>

        <article class="panel editor-panel">
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

            <section class="prescriptions-section">
              <header class="section-header">
                <div>
                  <h3>{{ i18n.t('cases.prescriptions.title') }}</h3>
                  <p>{{ i18n.t('cases.prescriptions.description') }}</p>
                </div>
                <button type="button" *ngIf="canCreatePrescription" (click)="startNewPrescription()">
                  {{ i18n.t('cases.prescriptions.new') }}
                </button>
              </header>

              <p class="feedback error" *ngIf="prescriptionErrorMessage" role="alert">{{ prescriptionErrorMessage }}</p>
              <p class="feedback success" *ngIf="prescriptionSuccessMessage" role="status">{{ prescriptionSuccessMessage }}</p>
              <p class="loading" *ngIf="isLoadingPrescriptions">{{ i18n.t('cases.prescriptions.loading') }}</p>

              <div class="prescription-list" *ngIf="prescriptions.length > 0; else noPrescriptions">
                <article class="prescription-card" *ngFor="let prescription of prescriptions; trackBy: trackByPrescriptionId">
                  <header>
                    <div>
                      <strong>{{ prescription.prescriptionNumber || i18n.t('cases.prescriptions.draftNumber') }}</strong>
                      <small>{{ (prescription.issuedAt || prescription.createdAt) | localizedDate: 'medium' }}</small>
                    </div>
                    <span class="prescription-status" [class]="'prescription-status ' + prescription.status.toLowerCase()">
                      {{ prescription.status | statusLabel: 'prescriptions' }}
                    </span>
                  </header>
                  <p>{{ prescription.items.length }} {{ i18n.t('cases.prescriptions.medications') }}</p>
                  <small class="medication-summary">{{ prescription.items[0].medicationName || '-' }}</small>
                  <div class="prescription-actions">
                    <button type="button" class="secondary" (click)="viewPrescription(prescription)">
                      {{ i18n.t('cases.prescriptions.view') }}
                    </button>
                    <button type="button" class="secondary" *ngIf="prescription.status === 'DRAFT'" (click)="editPrescriptionDraft(prescription)">
                      {{ i18n.t('cases.prescriptions.editDraft') }}
                    </button>
                    <button type="button" class="secondary" *ngIf="prescription.status === 'DRAFT'" (click)="deletePrescriptionDraft(prescription.id)">
                      {{ i18n.t('cases.prescriptions.deleteDraft') }}
                    </button>
                    <button type="button" class="secondary" *ngIf="prescription.status === 'ISSUED'" (click)="printPrescription(prescription)" [disabled]="isPrintingPrescriptionId === prescription.id">
                      {{ isPrintingPrescriptionId === prescription.id ? i18n.t('cases.prescriptions.printing') : i18n.t('cases.prescriptions.print') }}
                    </button>
                    <button type="button" class="secondary" *ngIf="prescription.status === 'ISSUED'" (click)="beginVoidPrescription(prescription.id)">
                      {{ i18n.t('cases.prescriptions.void') }}
                    </button>
                  </div>
                  <div class="void-form" *ngIf="voidingPrescriptionId === prescription.id">
                    <label>
                      {{ i18n.t('cases.prescriptions.voidReason') }}
                      <input type="text" [value]="voidReason" (input)="voidReason = $any($event.target).value" />
                    </label>
                    <button type="button" (click)="voidPrescription(prescription.id)" [disabled]="!voidReason.trim()">
                      {{ i18n.t('cases.prescriptions.confirmVoid') }}
                    </button>
                    <button type="button" class="secondary" (click)="cancelVoidPrescription()">{{ i18n.t('cases.prescriptions.cancel') }}</button>
                  </div>
                  <p class="void-reason" *ngIf="prescription.status === 'VOIDED'">
                    {{ i18n.t('cases.prescriptions.voidReason') }}: {{ prescription.voidReason }}
                  </p>
                </article>
              </div>
              <ng-template #noPrescriptions>
                <p *ngIf="!isLoadingPrescriptions">{{ i18n.t('cases.prescriptions.empty') }}</p>
              </ng-template>

              <form class="prescription-editor" *ngIf="prescriptionEditorOpen" [formGroup]="prescriptionForm" (ngSubmit)="savePrescriptionDraft()" novalidate>
                <header class="section-header">
                  <div>
                    <h3>{{ activePrescription ? i18n.t('cases.prescriptions.editTitle') : i18n.t('cases.prescriptions.createTitle') }}</h3>
                    <p>{{ i18n.t('cases.prescriptions.headerHelp') }}</p>
                  </div>
                  <button type="button" class="secondary" (click)="prescriptionEditorOpen = false">{{ i18n.t('cases.prescriptions.cancel') }}</button>
                </header>

                <fieldset class="prescriber-fields">
                  <legend>{{ i18n.t('cases.prescriptions.prescriber') }}</legend>
                  <label>
                    {{ i18n.t('cases.prescriptions.prescriberName') }}
                    <input type="text" formControlName="prescriberName" [attr.aria-invalid]="isPrescriptionControlInvalid('prescriberName')" />
                    <small class="form-error" *ngIf="isPrescriptionControlInvalid('prescriberName')">{{ i18n.t('common.required') }}</small>
                  </label>
                  <label>
                    {{ i18n.t('cases.prescriptions.prescriberTitle') }}
                    <input type="text" formControlName="prescriberTitle" [attr.aria-invalid]="isPrescriptionControlInvalid('prescriberTitle')" />
                    <small class="form-error" *ngIf="isPrescriptionControlInvalid('prescriberTitle')">{{ i18n.t('common.required') }}</small>
                  </label>
                  <label>{{ i18n.t('cases.prescriptions.professionalId') }}<input type="text" formControlName="professionalId" /></label>
                  <label>{{ i18n.t('cases.prescriptions.practiceName') }}<input type="text" formControlName="practiceName" /></label>
                  <label class="wide-field">
                    {{ i18n.t('cases.prescriptions.practiceAddress') }}
                    <input type="text" formControlName="practiceAddress" [attr.aria-invalid]="isPrescriptionControlInvalid('practiceAddress')" />
                    <small class="form-error" *ngIf="isPrescriptionControlInvalid('practiceAddress')">{{ i18n.t('common.required') }}</small>
                  </label>
                  <label>{{ i18n.t('cases.prescriptions.practicePhone') }}<input type="text" formControlName="practicePhone" /></label>
                </fieldset>

                <fieldset formArrayName="items" class="medication-lines">
                  <legend>{{ i18n.t('cases.prescriptions.medicationLines') }}</legend>
                  <article class="medication-line" *ngFor="let item of prescriptionItems.controls; let index = index" [formGroupName]="index">
                    <header>
                      <strong>{{ i18n.t('cases.prescriptions.medication') }} {{ index + 1 }}</strong>
                      <button type="button" class="secondary" (click)="removePrescriptionItem(index)" [disabled]="prescriptionItems.length === 1">
                        {{ i18n.t('cases.prescriptions.removeMedication') }}
                      </button>
                    </header>
                    <div class="medication-grid">
                      <label class="wide-field">
                        {{ i18n.t('cases.prescriptions.medicationName') }}
                        <input type="text" formControlName="medicationName" [attr.aria-invalid]="isPrescriptionItemNameInvalid(index)" />
                        <small class="form-error" *ngIf="isPrescriptionItemNameInvalid(index)">{{ i18n.t('common.required') }}</small>
                      </label>
                      <label>{{ i18n.t('cases.prescriptions.strength') }}<input type="text" formControlName="strength" /></label>
                      <label>{{ i18n.t('cases.prescriptions.form') }}<input type="text" formControlName="pharmaceuticalForm" /></label>
                      <label>{{ i18n.t('cases.prescriptions.dose') }}<input type="text" formControlName="dose" /></label>
                      <label>{{ i18n.t('cases.prescriptions.route') }}<input type="text" formControlName="route" /></label>
                      <label>{{ i18n.t('cases.prescriptions.frequency') }}<input type="text" formControlName="frequency" /></label>
                      <label>{{ i18n.t('cases.prescriptions.duration') }}<input type="text" formControlName="duration" /></label>
                      <label>{{ i18n.t('cases.prescriptions.quantity') }}<input type="text" formControlName="quantity" /></label>
                      <label class="wide-field">{{ i18n.t('cases.prescriptions.instructions') }}<input type="text" formControlName="instructions" /></label>
                    </div>
                  </article>
                  <button type="button" class="secondary" (click)="addPrescriptionItem()">{{ i18n.t('cases.prescriptions.addMedication') }}</button>
                </fieldset>

                <label>
                  {{ i18n.t('cases.prescriptions.generalInstructions') }}
                  <textarea rows="3" formControlName="generalInstructions"></textarea>
                </label>
                <p class="required-help">{{ i18n.t('cases.prescriptions.requiredHelp') }}</p>
                <div class="editor-actions">
                  <button type="submit" [disabled]="isSavingPrescription">
                    {{ isSavingPrescription ? i18n.t('cases.prescriptions.saving') : i18n.t('cases.prescriptions.saveDraft') }}
                  </button>
                  <button type="button" class="issue-action" (click)="issuePrescription()" [disabled]="isSavingPrescription">
                    {{ i18n.t('cases.prescriptions.issueAndPrint') }}
                  </button>
                </div>
              </form>

              <details class="prescription-history" *ngIf="previousPrescriptionHistory.length > 0">
                <summary>{{ i18n.t('cases.prescriptions.patientHistory') }} ({{ previousPrescriptionHistory.length }})</summary>
                <article *ngFor="let prescription of previousPrescriptionHistory; trackBy: trackByPrescriptionId">
                  <span><strong>{{ prescription.prescriptionNumber }}</strong> · {{ prescription.caseTitle }}</span>
                  <span>{{ prescription.issuedAt | localizedDate: 'date' }} · {{ prescription.status | statusLabel: 'prescriptions' }}</span>
                  <span class="history-actions">
                    <button type="button" class="secondary" (click)="viewPrescription(prescription)">{{ i18n.t('cases.prescriptions.view') }}</button>
                    <button type="button" class="secondary" *ngIf="prescription.status === 'ISSUED'" (click)="printPrescription(prescription)">{{ i18n.t('cases.prescriptions.print') }}</button>
                  </span>
                </article>
              </details>

              <section class="prescription-detail" *ngIf="viewingPrescription as prescription" aria-labelledby="prescription-detail-title">
                <header class="section-header">
                  <div>
                    <h3 id="prescription-detail-title">{{ prescription.prescriptionNumber || i18n.t('cases.prescriptions.draftNumber') }}</h3>
                    <p>{{ prescription.caseTitle }} · {{ (prescription.issuedAt || prescription.createdAt) | localizedDate: 'medium' }}</p>
                  </div>
                  <span class="prescription-status" [class]="'prescription-status ' + prescription.status.toLowerCase()">
                    {{ prescription.status | statusLabel: 'prescriptions' }}
                  </span>
                </header>
                <div class="prescription-detail-meta">
                  <span><small>{{ i18n.t('cases.patient.label') }}</small><strong>{{ prescription.patientName }}</strong></span>
                  <span><small>{{ i18n.t('cases.prescriptions.prescriberName') }}</small><strong>{{ prescription.prescriberName }}</strong></span>
                  <span><small>{{ i18n.t('cases.prescriptions.practiceName') }}</small><strong>{{ prescription.practiceName || '-' }}</strong></span>
                </div>
                <ol class="prescription-detail-items">
                  <li *ngFor="let item of prescription.items">
                    <strong>{{ item.medicationName }}<span *ngIf="item.strength"> — {{ item.strength }}</span><span *ngIf="item.pharmaceuticalForm">, {{ item.pharmaceuticalForm }}</span></strong>
                    <span>{{ item.dose || '-' }}<span *ngIf="item.route"> · {{ item.route }}</span><span *ngIf="item.frequency"> · {{ item.frequency }}</span><span *ngIf="item.duration"> · {{ item.duration }}</span></span>
                    <span *ngIf="item.quantity">{{ i18n.t('cases.prescriptions.quantity') }}: {{ item.quantity }}</span>
                    <span *ngIf="item.instructions">{{ item.instructions }}</span>
                  </li>
                </ol>
                <p *ngIf="prescription.generalInstructions"><strong>{{ i18n.t('cases.prescriptions.generalInstructions') }}:</strong> {{ prescription.generalInstructions }}</p>
                <p class="void-reason" *ngIf="prescription.status === 'VOIDED'"><strong>{{ i18n.t('cases.prescriptions.voidReason') }}:</strong> {{ prescription.voidReason }}</p>
                <div class="prescription-actions">
                  <button type="button" *ngIf="prescription.status === 'ISSUED'" (click)="printPrescription(prescription)">{{ i18n.t('cases.prescriptions.print') }}</button>
                  <button type="button" class="secondary" (click)="viewingPrescription = null">{{ i18n.t('cases.prescriptions.closeDetails') }}</button>
                </div>
              </section>
            </section>

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

        <article class="prescription-print-sheet" *ngIf="prescriptionForPrint as prescription" aria-hidden="true">
          <header>
            <div>
              <h1>{{ prescription.practiceName || prescription.prescriberName }}</h1>
              <strong>{{ prescription.prescriberName }}</strong>
              <p>{{ prescription.prescriberTitle }}<span *ngIf="prescription.professionalId"> · {{ prescription.professionalId }}</span></p>
              <p>{{ prescription.practiceAddress }}</p>
              <p *ngIf="prescription.practicePhone">{{ prescription.practicePhone }}</p>
            </div>
            <div class="print-reference">
              <strong>{{ i18n.t('cases.prescriptions.printTitle') }}</strong>
              <span>{{ prescription.prescriptionNumber }}</span>
              <span>{{ prescription.issuedAt | localizedDate: 'date' }}</span>
            </div>
          </header>
          <section class="print-patient">
            <span><b>{{ i18n.t('cases.patient.label') }}:</b> {{ prescription.patientName }}</span>
            <span><b>{{ i18n.t('cases.patient.number') }}:</b> {{ prescription.patientNumber || '-' }}</span>
            <span><b>{{ i18n.t('patientWorkspace.summary.dob') }}:</b> {{ prescription.patientDateOfBirth ? (prescription.patientDateOfBirth | localizedDate: 'date') : '-' }}</span>
          </section>
          <h2>℞</h2>
          <ol>
            <li *ngFor="let item of prescription.items">
              <strong>{{ item.medicationName }}<span *ngIf="item.strength"> — {{ item.strength }}</span><span *ngIf="item.pharmaceuticalForm">, {{ item.pharmaceuticalForm }}</span></strong>
              <p>{{ item.dose }}<span *ngIf="item.route"> · {{ item.route }}</span><span *ngIf="item.frequency"> · {{ item.frequency }}</span><span *ngIf="item.duration"> · {{ item.duration }}</span></p>
              <p *ngIf="item.quantity">{{ i18n.t('cases.prescriptions.quantity') }}: {{ item.quantity }}</p>
              <p *ngIf="item.instructions">{{ item.instructions }}</p>
            </li>
          </ol>
          <p class="print-instructions" *ngIf="prescription.generalInstructions">{{ prescription.generalInstructions }}</p>
          <footer>
            <span>{{ i18n.t('cases.prescriptions.signatureStamp') }}</span>
          </footer>
        </article>
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
      align-items: center;
      gap: 1rem;
    }

    h2,
    h3 {
      margin: 0;
    }

    .patient-identity {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.7rem 0.85rem;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--surface-strong));
      border-radius: 0.85rem;
      background: color-mix(in srgb, var(--accent) 7%, var(--surface-elevated));
      box-shadow: var(--elevation-soft);
    }

    .patient-avatar {
      width: 2.6rem;
      height: 2.6rem;
      flex: 0 0 2.6rem;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 18%, var(--surface));
      color: var(--accent);
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .patient-primary,
    .patient-detail {
      min-width: 0;
      display: grid;
      gap: 0.12rem;
    }

    .patient-primary {
      padding-right: 1rem;
      border-right: 1px solid var(--surface-strong);
    }

    .patient-primary strong {
      font-size: 1.05rem;
    }

    .patient-identity small,
    .patient-detail small {
      color: var(--muted);
      font-size: 0.69rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .patient-detail strong {
      max-width: 19rem;
      overflow: hidden;
      font-size: 0.84rem;
      text-overflow: ellipsis;
      white-space: nowrap;
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

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .section-header p {
      margin: 0.25rem 0 0;
      color: var(--muted);
      font-size: 0.8rem;
    }

    .case-list {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding: 0.1rem 0 0.35rem;
      scroll-snap-type: x proximity;
    }

    .case-item {
      flex: 0 0 auto;
      min-width: 12rem;
      max-width: 18rem;
      text-align: left;
      padding: 0.65rem 0.75rem;
      border-radius: 0.6rem;
      border: 1px solid var(--surface-strong);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.7rem;
      scroll-snap-align: start;
    }

    .case-item.active {
      border-color: color-mix(in srgb, var(--accent) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    }

    .case-item strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .case-status {
      flex: 0 0 auto;
      padding: 0.2rem 0.4rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated));
      color: var(--muted);
      font-size: 0.72rem;
    }

    .create-case-form {
      padding-top: 0.8rem;
      border-top: 1px solid var(--surface-strong);
    }

    .create-fields {
      display: grid;
      grid-template-columns: minmax(12rem, 0.75fr) repeat(2, minmax(15rem, 1fr));
      gap: 0.65rem;
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

    input[aria-invalid='true'] {
      border-color: var(--danger);
    }

    .form-error {
      color: var(--danger);
      font-weight: 700;
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

    .prescriptions-section {
      display: grid;
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .prescription-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: 0.6rem;
    }

    .prescription-card {
      display: grid;
      gap: 0.45rem;
      padding: 0.75rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.75rem;
      background: var(--surface);
    }

    .prescription-card > header,
    .medication-line > header {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .prescription-card > header > div {
      display: grid;
      gap: 0.12rem;
    }

    .prescription-card p {
      margin: 0;
    }

    .medication-summary,
    .prescription-card header small,
    .void-reason,
    .required-help {
      color: var(--muted);
    }

    .prescription-status {
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      background: var(--surface-elevated);
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .prescription-status.issued {
      background: color-mix(in srgb, var(--success) 16%, var(--surface));
      color: var(--success);
    }

    .prescription-status.voided {
      background: color-mix(in srgb, var(--danger) 12%, var(--surface));
      color: var(--danger);
    }

    .prescription-actions,
    .editor-actions,
    .void-form {
      display: flex;
      align-items: end;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .void-form label {
      flex: 1 1 14rem;
    }

    .prescription-editor {
      padding: 0.9rem;
      border: 1px solid color-mix(in srgb, var(--accent) 40%, var(--surface-strong));
      border-radius: 0.8rem;
      background: color-mix(in srgb, var(--accent) 5%, var(--surface));
    }

    fieldset {
      min-width: 0;
      margin: 0;
      padding: 0.75rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.7rem;
    }

    legend {
      padding: 0 0.35rem;
      color: var(--ink);
      font-size: 0.84rem;
      font-weight: 800;
    }

    .prescriber-fields,
    .medication-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
    }

    .wide-field {
      grid-column: span 2;
    }

    .medication-lines,
    .medication-line {
      display: grid;
      gap: 0.65rem;
    }

    .medication-line {
      padding: 0.65rem;
      border-radius: 0.6rem;
      background: var(--surface-elevated);
    }

    .issue-action {
      border-color: color-mix(in srgb, var(--success) 55%, var(--surface-strong));
      background: color-mix(in srgb, var(--success) 15%, var(--surface));
    }

    .prescription-history {
      border-top: 1px solid var(--surface-strong);
      padding-top: 0.7rem;
    }

    .prescription-history summary {
      cursor: pointer;
      font-weight: 700;
    }

    .prescription-history article {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 0.7rem;
      margin-top: 0.45rem;
      padding: 0.55rem;
      border: 1px solid var(--surface-strong);
      border-radius: 0.55rem;
      background: var(--surface);
      font-size: 0.8rem;
    }

    .history-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .prescription-detail {
      display: grid;
      gap: 0.75rem;
      padding: 0.85rem;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--surface-strong));
      border-radius: 0.75rem;
      background: var(--surface);
    }

    .prescription-detail-meta {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
    }

    .prescription-detail-meta span,
    .prescription-detail-items li {
      display: grid;
      gap: 0.18rem;
    }

    .prescription-detail-meta small,
    .prescription-detail-items span {
      color: var(--muted);
    }

    .prescription-detail-items {
      display: grid;
      gap: 0.55rem;
      margin: 0;
      padding-left: 1.4rem;
    }

    .prescription-print-sheet {
      display: none;
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
      .create-fields {
        grid-template-columns: 1fr;
      }

      .prescriber-fields,
      .medication-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .cases-header {
        align-items: start;
        flex-direction: column;
      }

      .patient-identity {
        width: 100%;
        flex-wrap: wrap;
      }

      .patient-primary {
        border-right: 0;
      }

      .section-header {
        align-items: start;
        flex-direction: column;
      }

      .case-item {
        min-width: min(15rem, 82vw);
      }

      .prescriber-fields,
      .medication-grid {
        grid-template-columns: 1fr;
      }

      .wide-field {
        grid-column: auto;
      }

      .prescription-history article {
        grid-template-columns: 1fr;
      }

      .prescription-detail-meta {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      @page {
        size: A4;
        margin: 14mm;
      }

      .prescription-print-sheet {
        position: fixed;
        inset: 0;
        z-index: 100000;
        display: grid !important;
        grid-template-rows: auto auto auto 1fr auto;
        gap: 1rem;
        min-height: 100vh;
        padding: 12mm;
        background: #fff;
        color: #111;
        font-family: Arial, sans-serif;
      }

      .prescription-print-sheet > header {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        padding-bottom: 0.8rem;
        border-bottom: 2px solid #111;
      }

      .prescription-print-sheet h1,
      .prescription-print-sheet p {
        margin: 0.15rem 0;
      }

      .print-reference {
        display: grid;
        align-content: start;
        justify-items: end;
        gap: 0.2rem;
      }

      .print-patient {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1.5rem;
        padding: 0.7rem;
        border: 1px solid #999;
      }

      .prescription-print-sheet h2 {
        font-size: 2rem;
      }

      .prescription-print-sheet ol {
        display: grid;
        align-content: start;
        gap: 1rem;
        margin: 0;
        padding-left: 1.6rem;
      }

      .prescription-print-sheet li {
        padding-left: 0.4rem;
      }

      .print-instructions {
        padding: 0.7rem;
        border: 1px solid #bbb;
      }

      .prescription-print-sheet footer {
        display: flex;
        min-height: 35mm;
        align-items: end;
        justify-content: end;
        border-top: 1px solid #aaa;
        font-weight: 700;
      }
    }
  `
})
export class PatientCasesPageComponent implements OnInit, OnDestroy {
  patient: Patient | null = null;
  cases: MedicalCase[] = [];
  images: MedicalImage[] = [];
  prescriptions: Prescription[] = [];
  patientPrescriptionHistory: Prescription[] = [];
  activePrescription: Prescription | null = null;
  viewingPrescription: Prescription | null = null;
  prescriptionForPrint: Prescription | null = null;
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
  createFormExpanded = false;
  prescriptionEditorOpen = false;
  isLoadingPrescriptions = false;
  isSavingPrescription = false;
  isPrintingPrescriptionId: number | null = null;
  voidingPrescriptionId: number | null = null;
  voidReason = '';
  prescriptionErrorMessage = '';
  prescriptionSuccessMessage = '';

  errorMessage = '';
  successMessage = '';
  imageErrorMessage = '';
  imageSuccessMessage = '';

  readonly caseStatuses = CASE_STATUSES;
  readonly imageCategories = IMAGE_CATEGORIES;

  readonly createCaseForm;
  readonly caseEditorForm;
  readonly imageUploadForm;
  readonly prescriptionForm;

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
    private readonly prescriptionService: PrescriptionService,
    private readonly authService: AuthService,
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

    this.prescriptionForm = this.formBuilder.nonNullable.group({
      prescriberName: [this.authService.getCurrentUsername(), Validators.required],
      prescriberTitle: ['Doctor', Validators.required],
      professionalId: [''],
      practiceName: [''],
      practiceAddress: ['', Validators.required],
      practicePhone: [''],
      generalInstructions: [''],
      items: this.formBuilder.array([this.createPrescriptionItemGroup()])
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

  trackByPrescriptionId(_index: number, prescription: Prescription): number {
    return prescription.id;
  }

  isCreateControlInvalid(controlName: 'title'): boolean {
    const control = this.createCaseForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isEditorControlInvalid(controlName: 'title'): boolean {
    const control = this.caseEditorForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isPrescriptionControlInvalid(
    controlName: 'prescriberName' | 'prescriberTitle' | 'practiceAddress'
  ): boolean {
    const control = this.prescriptionForm.controls[controlName];
    return control.invalid && control.touched;
  }

  isPrescriptionItemNameInvalid(index: number): boolean {
    const control = this.prescriptionItems.at(index)?.controls.medicationName;
    return Boolean(control?.invalid && control.touched);
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
    this.loadPrescriptions(caseId);
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
          this.createFormExpanded = false;
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
    this.caseService
      .updateCase(medicalCase.id, {
        title: payload.title.trim(),
        description: this.normalizeOptionalValue(payload.description),
        treatmentPlan: this.normalizeOptionalValue(payload.treatmentPlan),
        status: payload.status
      })
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

  get prescriptionItems() {
    return this.prescriptionForm.controls.items;
  }

  get canCreatePrescription(): boolean {
    return this.selectedCase?.status === 'OPEN' || this.selectedCase?.status === 'IN_PROGRESS';
  }

  get previousPrescriptionHistory(): Prescription[] {
    return this.patientPrescriptionHistory.filter(
      (prescription) => prescription.caseId !== this.selectedCaseId && prescription.status !== 'DRAFT'
    );
  }

  startNewPrescription(): void {
    if (!this.canCreatePrescription) {
      return;
    }
    this.activePrescription = null;
    const previous = this.prescriptions[0] ?? this.patientPrescriptionHistory[0] ?? null;
    this.prescriptionForm.reset({
      prescriberName: previous?.prescriberName || this.authService.getCurrentUsername(),
      prescriberTitle: previous?.prescriberTitle || 'Doctor',
      professionalId: previous?.professionalId || '',
      practiceName: previous?.practiceName || '',
      practiceAddress: previous?.practiceAddress || '',
      practicePhone: previous?.practicePhone || '',
      generalInstructions: ''
    });
    this.prescriptionItems.clear();
    this.prescriptionItems.push(this.createPrescriptionItemGroup());
    this.prescriptionEditorOpen = true;
    this.prescriptionErrorMessage = '';
    this.prescriptionSuccessMessage = '';
  }

  editPrescriptionDraft(prescription: Prescription): void {
    if (prescription.status !== 'DRAFT') {
      return;
    }
    this.activePrescription = prescription;
    this.prescriptionForm.patchValue({
      prescriberName: prescription.prescriberName,
      prescriberTitle: prescription.prescriberTitle,
      professionalId: prescription.professionalId ?? '',
      practiceName: prescription.practiceName ?? '',
      practiceAddress: prescription.practiceAddress,
      practicePhone: prescription.practicePhone ?? '',
      generalInstructions: prescription.generalInstructions ?? ''
    });
    this.prescriptionItems.clear();
    prescription.items.forEach((item) => this.prescriptionItems.push(this.createPrescriptionItemGroup(item)));
    if (this.prescriptionItems.length === 0) {
      this.prescriptionItems.push(this.createPrescriptionItemGroup());
    }
    this.prescriptionEditorOpen = true;
    this.prescriptionErrorMessage = '';
    this.prescriptionSuccessMessage = '';
  }

  viewPrescription(prescription: Prescription): void {
    this.viewingPrescription = prescription;
  }

  addPrescriptionItem(): void {
    this.prescriptionItems.push(this.createPrescriptionItemGroup());
  }

  removePrescriptionItem(index: number): void {
    if (this.prescriptionItems.length === 1) {
      return;
    }
    this.prescriptionItems.removeAt(index);
  }

  savePrescriptionDraft(issueAfterSave = false): void {
    if (this.selectedCaseId == null || this.prescriptionForm.invalid) {
      this.prescriptionForm.markAllAsTouched();
      return;
    }
    this.isSavingPrescription = true;
    this.prescriptionErrorMessage = '';
    this.prescriptionSuccessMessage = '';
    const request = this.prescriptionRequest();
    const draftRequest: Observable<Prescription> = this.activePrescription
      ? this.prescriptionService.updateDraft(this.activePrescription.id, request)
      : this.prescriptionService.createDraft(this.selectedCaseId, request);

    draftRequest.pipe(
      switchMap((saved) => issueAfterSave ? this.prescriptionService.issue(saved.id) : of(saved))
    ).subscribe({
      next: (saved) => {
        this.replacePrescription(saved);
        this.activePrescription = saved.status === 'DRAFT' ? saved : null;
        this.prescriptionEditorOpen = saved.status === 'DRAFT';
        this.isSavingPrescription = false;
        this.prescriptionSuccessMessage = this.i18n.t(
          issueAfterSave ? 'cases.prescriptions.feedback.issued' : 'cases.prescriptions.feedback.saved'
        );
        this.loadPatientPrescriptionHistory();
        if (issueAfterSave) {
          this.printPrescription(saved);
        }
      },
      error: (error: unknown) => {
        this.isSavingPrescription = false;
        this.prescriptionErrorMessage = this.resolveErrorMessage(error, 'cases.prescriptions.feedback.saveError');
      }
    });
  }

  async issuePrescription(): Promise<void> {
    if (this.prescriptionForm.invalid) {
      this.prescriptionForm.markAllAsTouched();
      return;
    }
    const confirmed = await this.confirmation.confirm('cases.prescriptions.issueConfirm', {
      titleKey: 'cases.prescriptions.issueTitle',
      confirmKey: 'cases.prescriptions.issueAndPrint'
    });
    if (confirmed) {
      this.savePrescriptionDraft(true);
    }
  }

  printPrescription(prescription: Prescription): void {
    if (prescription.status !== 'ISSUED' || this.isPrintingPrescriptionId != null) {
      return;
    }
    this.isPrintingPrescriptionId = prescription.id;
    this.prescriptionService.recordPrint(prescription.id).subscribe({
      next: (printable) => {
        this.prescriptionForPrint = printable;
        this.isPrintingPrescriptionId = null;
        window.setTimeout(() => window.print(), 0);
      },
      error: (error: unknown) => {
        this.isPrintingPrescriptionId = null;
        this.prescriptionErrorMessage = this.resolveErrorMessage(error, 'cases.prescriptions.feedback.printError');
      }
    });
  }

  beginVoidPrescription(prescriptionId: number): void {
    this.voidingPrescriptionId = prescriptionId;
    this.voidReason = '';
  }

  cancelVoidPrescription(): void {
    this.voidingPrescriptionId = null;
    this.voidReason = '';
  }

  voidPrescription(prescriptionId: number): void {
    const reason = this.voidReason.trim();
    if (!reason) {
      return;
    }
    this.prescriptionService.voidPrescription(prescriptionId, reason).subscribe({
      next: (voided) => {
        this.replacePrescription(voided);
        if (this.viewingPrescription?.id === voided.id) {
          this.viewingPrescription = voided;
        }
        this.cancelVoidPrescription();
        this.loadPatientPrescriptionHistory();
        this.prescriptionSuccessMessage = this.i18n.t('cases.prescriptions.feedback.voided');
      },
      error: (error: unknown) => {
        this.prescriptionErrorMessage = this.resolveErrorMessage(error, 'cases.prescriptions.feedback.voidError');
      }
    });
  }

  async deletePrescriptionDraft(prescriptionId: number): Promise<void> {
    const confirmed = await this.confirmation.confirm('cases.prescriptions.deleteConfirm', {
      titleKey: 'cases.prescriptions.deleteTitle',
      confirmKey: 'cases.prescriptions.deleteDraft',
      tone: 'danger'
    });
    if (!confirmed) {
      return;
    }
    this.prescriptionService.deleteDraft(prescriptionId).subscribe({
      next: () => {
        this.prescriptions = this.prescriptions.filter((item) => item.id !== prescriptionId);
        if (this.activePrescription?.id === prescriptionId) {
          this.activePrescription = null;
          this.prescriptionEditorOpen = false;
        }
      },
      error: (error: unknown) => {
        this.prescriptionErrorMessage = this.resolveErrorMessage(error, 'cases.prescriptions.feedback.deleteError');
      }
    });
  }

  @HostListener('window:afterprint')
  clearPrintedPrescription(): void {
    this.prescriptionForPrint = null;
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

  async deleteImage(imageId: number): Promise<void> {
    const confirmed = await this.confirmation.confirm('cases.images.deleteConfirm', {
      titleKey: 'cases.images.deleteTitle',
      confirmKey: 'cases.images.delete',
      tone: 'danger'
    });
    if (!confirmed) {
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
        this.loadPatientPrescriptionHistory();
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

  private loadPrescriptions(caseId: number): void {
    this.isLoadingPrescriptions = true;
    this.prescriptionErrorMessage = '';
    this.prescriptionService.getByCaseId(caseId).subscribe({
      next: (prescriptions) => {
        this.prescriptions = prescriptions;
        this.activePrescription = null;
        this.viewingPrescription = null;
        this.prescriptionEditorOpen = false;
        this.isLoadingPrescriptions = false;
      },
      error: (error: unknown) => {
        this.prescriptions = [];
        this.isLoadingPrescriptions = false;
        this.prescriptionErrorMessage = this.resolveErrorMessage(
          error,
          'cases.prescriptions.feedback.loadError'
        );
      }
    });
  }

  private loadPatientPrescriptionHistory(): void {
    if (this.patientId == null) {
      return;
    }
    this.prescriptionService.getByPatientId(this.patientId).subscribe({
      next: (prescriptions) => {
        this.patientPrescriptionHistory = prescriptions;
      },
      error: () => {
        this.patientPrescriptionHistory = [];
      }
    });
  }

  private createPrescriptionItemGroup(item?: PrescriptionItem) {
    return this.formBuilder.nonNullable.group({
      medicationName: [item?.medicationName ?? '', Validators.required],
      strength: [item?.strength ?? ''],
      pharmaceuticalForm: [item?.pharmaceuticalForm ?? ''],
      dose: [item?.dose ?? ''],
      route: [item?.route ?? ''],
      frequency: [item?.frequency ?? ''],
      duration: [item?.duration ?? ''],
      quantity: [item?.quantity ?? ''],
      instructions: [item?.instructions ?? '']
    });
  }

  private prescriptionRequest(): PrescriptionUpsertRequest {
    const value = this.prescriptionForm.getRawValue();
    return {
      type: 'MEDICATION',
      prescriberName: value.prescriberName.trim(),
      prescriberTitle: value.prescriberTitle.trim(),
      professionalId: this.normalizeOptionalValue(value.professionalId),
      practiceName: this.normalizeOptionalValue(value.practiceName),
      practiceAddress: value.practiceAddress.trim(),
      practicePhone: this.normalizeOptionalValue(value.practicePhone),
      generalInstructions: this.normalizeOptionalValue(value.generalInstructions),
      items: value.items.map((item) => ({
        medicationName: item.medicationName.trim(),
        strength: this.normalizeOptionalValue(item.strength),
        pharmaceuticalForm: this.normalizeOptionalValue(item.pharmaceuticalForm),
        dose: this.normalizeOptionalValue(item.dose),
        route: this.normalizeOptionalValue(item.route),
        frequency: this.normalizeOptionalValue(item.frequency),
        duration: this.normalizeOptionalValue(item.duration),
        quantity: this.normalizeOptionalValue(item.quantity),
        instructions: this.normalizeOptionalValue(item.instructions)
      }))
    };
  }

  private replacePrescription(updated: Prescription): void {
    const exists = this.prescriptions.some((prescription) => prescription.id === updated.id);
    this.prescriptions = exists
      ? this.prescriptions.map((prescription) => prescription.id === updated.id ? updated : prescription)
      : [updated, ...this.prescriptions];
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
