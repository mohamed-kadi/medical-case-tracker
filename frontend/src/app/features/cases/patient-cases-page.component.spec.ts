import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PatientCasesPageComponent } from './patient-cases-page.component';
import { PatientService } from '../../core/services/patient.service';
import { CaseService } from '../../core/services/case.service';
import { ImageService } from '../../core/services/image.service';
import { I18nService } from '../../core/services/i18n.service';
import { ConfirmationService } from '../../shared/confirmation.service';
import { PrescriptionService } from '../../core/services/prescription.service';
import { AuthService } from '../../core/services/auth.service';

describe('PatientCasesPageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let caseServiceSpy: jasmine.SpyObj<CaseService>;
  let imageServiceSpy: jasmine.SpyObj<ImageService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;
  let confirmationSpy: jasmine.SpyObj<ConfirmationService>;
  let prescriptionServiceSpy: jasmine.SpyObj<PrescriptionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const activatedRouteMock = {
    snapshot: {
      paramMap: convertToParamMap({ id: '20' })
    }
  };

  beforeEach(async () => {
    patientServiceSpy = jasmine.createSpyObj<PatientService>('PatientService', ['getPatientById']);
    caseServiceSpy = jasmine.createSpyObj<CaseService>('CaseService', [
      'getCasesByPatientId',
      'createCase',
      'updateCase',
      'updateCaseStatus'
    ]);
    imageServiceSpy = jasmine.createSpyObj<ImageService>('ImageService', [
      'getImagesByCase',
      'uploadImage',
      'deleteImage',
      'downloadImage'
    ]);
    i18nServiceSpy = jasmine.createSpyObj<I18nService>('I18nService', ['t']);
    confirmationSpy = jasmine.createSpyObj<ConfirmationService>('ConfirmationService', ['confirm']);
    prescriptionServiceSpy = jasmine.createSpyObj<PrescriptionService>('PrescriptionService', [
      'getByCaseId',
      'getByPatientId',
      'createDraft',
      'updateDraft',
      'issue',
      'recordPrint',
      'voidPrescription',
      'deleteDraft'
    ]);
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getCurrentUsername']);

    i18nServiceSpy.t.and.callFake((key: string) => key);
    confirmationSpy.confirm.and.returnValue(Promise.resolve(true));
    authServiceSpy.getCurrentUsername.and.returnValue('doctorOne');
    prescriptionServiceSpy.getByCaseId.and.returnValue(of([]));
    prescriptionServiceSpy.getByPatientId.and.returnValue(of([]));
    patientServiceSpy.getPatientById.and.returnValue(
      of({
        id: 20,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@clinic.com',
        status: 'ACTIVE'
      })
    );
    caseServiceSpy.getCasesByPatientId.and.returnValue(
      of([
        {
          id: 501,
          title: 'Initial assessment',
          description: 'Baseline',
          treatmentPlan: 'Observe',
          status: 'OPEN'
        }
      ])
    );
    caseServiceSpy.createCase.and.returnValue(
      of({
        id: 502,
        title: 'Follow-up',
        description: null,
        treatmentPlan: null,
        status: 'OPEN'
      })
    );
    caseServiceSpy.updateCase.and.returnValue(
      of({
        id: 501,
        title: 'Initial assessment updated',
        description: 'Updated',
        treatmentPlan: 'Plan',
        status: 'IN_PROGRESS'
      })
    );
    caseServiceSpy.updateCaseStatus.and.returnValue(
      of({
        id: 501,
        title: 'Initial assessment updated',
        description: 'Updated',
        treatmentPlan: 'Plan',
        status: 'IN_PROGRESS'
      })
    );
    imageServiceSpy.getImagesByCase.and.returnValue(of([]));
    imageServiceSpy.uploadImage.and.returnValue(
      of({
        id: 301,
        fileName: 'before.jpg',
        contentType: 'image/jpeg',
        category: 'BEFORE_TREATMENT',
        mimeType: 'image/jpeg',
        size: 10,
        uploadedBy: 'doctorOne'
      })
    );
    imageServiceSpy.deleteImage.and.returnValue(of(void 0));
    imageServiceSpy.downloadImage.and.returnValue(of(new Blob(['abc'], { type: 'image/jpeg' })));

    await TestBed.configureTestingModule({
      imports: [PatientCasesPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: PatientService, useValue: patientServiceSpy },
        { provide: CaseService, useValue: caseServiceSpy },
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: PrescriptionService, useValue: prescriptionServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: I18nService, useValue: i18nServiceSpy },
        { provide: ConfirmationService, useValue: confirmationSpy }
      ]
    }).compileComponents();
  });

  it('loads patient and cases on init', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(patientServiceSpy.getPatientById).toHaveBeenCalledWith(20);
    expect(caseServiceSpy.getCasesByPatientId).toHaveBeenCalledWith(20);
    expect(component.selectedCaseId).toBe(501);
    expect(imageServiceSpy.getImagesByCase).toHaveBeenCalledWith(501, 'ALL');
    expect(prescriptionServiceSpy.getByCaseId).toHaveBeenCalledWith(501);
    expect(prescriptionServiceSpy.getByPatientId).toHaveBeenCalledWith(20);
    expect(fixture.nativeElement.querySelector('.patient-identity').textContent).toContain('John Doe');
    expect(fixture.nativeElement.querySelector('.case-list')).not.toBeNull();
  });

  it('creates case for the current patient', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.createCaseForm.patchValue({
      title: 'Follow-up',
      description: '',
      treatmentPlan: ''
    });
    component.createCase();

    expect(caseServiceSpy.createCase).toHaveBeenCalledWith(20, {
      title: 'Follow-up',
      description: null,
      treatmentPlan: null
    });
    expect(component.selectedCaseId).toBe(502);
  });

  it('updates selected case and status', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.caseEditorForm.patchValue({
      title: 'Initial assessment updated',
      description: 'Updated',
      treatmentPlan: 'Plan',
      status: 'IN_PROGRESS'
    });
    component.saveSelectedCase();

    expect(caseServiceSpy.updateCase).toHaveBeenCalledWith(501, {
      title: 'Initial assessment updated',
      description: 'Updated',
      treatmentPlan: 'Plan',
      status: 'IN_PROGRESS'
    });
    expect(caseServiceSpy.updateCaseStatus).not.toHaveBeenCalled();
    expect(component.selectedCase?.status).toBe('IN_PROGRESS');
  });

  it('creates a structured prescription draft for the selected open case', () => {
    prescriptionServiceSpy.createDraft.and.returnValue(of({
      id: 701,
      caseId: 501,
      caseTitle: 'Initial assessment',
      prescriptionNumber: null,
      type: 'MEDICATION',
      status: 'DRAFT',
      prescriberName: 'Dr. Test',
      prescriberTitle: 'Doctor',
      practiceAddress: '1 Clinic Street',
      patientName: 'John Doe',
      patientNumber: 'MT-20',
      createdBy: 'doctorOne',
      createdAt: '2026-09-06T10:00:00',
      updatedAt: '2026-09-06T10:00:00',
      items: [{ position: 0, medicationName: 'Amoxicillin', strength: '500 mg' }]
    }));

    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.startNewPrescription();
    component.prescriptionForm.patchValue({
      prescriberName: 'Dr. Test',
      prescriberTitle: 'Doctor',
      practiceAddress: '1 Clinic Street'
    });
    component.prescriptionItems.at(0).patchValue({ medicationName: 'Amoxicillin', strength: '500 mg' });

    component.savePrescriptionDraft();

    expect(prescriptionServiceSpy.createDraft).toHaveBeenCalledWith(501, jasmine.objectContaining({
      prescriberName: 'Dr. Test',
      practiceAddress: '1 Clinic Street',
      items: [jasmine.objectContaining({ medicationName: 'Amoxicillin', strength: '500 mg' })]
    }));
    expect(component.prescriptions[0].status).toBe('DRAFT');
  });

  it('opens a prescription in the in-app history detail view', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const prescription = {
      id: 701,
      caseId: 501,
      caseTitle: 'Initial assessment',
      prescriptionNumber: 'RX-2026-000701',
      type: 'MEDICATION' as const,
      status: 'ISSUED' as const,
      prescriberName: 'Dr. Test',
      prescriberTitle: 'Doctor',
      practiceAddress: '1 Clinic Street',
      patientName: 'John Doe',
      createdBy: 'doctorOne',
      issuedAt: '2026-09-06T10:05:00',
      createdAt: '2026-09-06T10:00:00',
      updatedAt: '2026-09-06T10:05:00',
      items: [{ position: 0, medicationName: 'Amoxicillin', strength: '500 mg' }]
    };

    component.viewPrescription(prescription);
    fixture.detectChanges();

    expect(component.viewingPrescription).toBe(prescription);
    expect(fixture.nativeElement.querySelector('.prescription-detail').textContent).toContain('Amoxicillin');
  });

  it('uploads image for selected case', () => {
    imageServiceSpy.getImagesByCase.and.returnValues(
      of([]),
      of([
        {
          id: 301,
          fileName: 'before.jpg',
          contentType: 'image/jpeg',
          category: 'BEFORE_TREATMENT',
          mimeType: 'image/jpeg',
          size: 10,
          uploadedBy: 'doctorOne'
        }
      ])
    );

    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const file = new File(['abc'], 'before.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: {
          item: (_index: number) => file
        }
      }
    } as unknown as Event;

    component.onFileSelected(event);
    component.imageUploadForm.patchValue({
      category: 'BEFORE_TREATMENT',
      description: 'Before treatment'
    });
    component.uploadImage();

    expect(imageServiceSpy.uploadImage).toHaveBeenCalledWith(file, 501, 'BEFORE_TREATMENT', 'Before treatment');
    expect(imageServiceSpy.getImagesByCase).toHaveBeenCalledWith(501, 'ALL');
    expect(component.images.length).toBe(1);
  });

  it('shows backend error details when image upload fails', () => {
    imageServiceSpy.uploadImage.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, error: { message: 'Invalid image file' } }))
    );

    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    const file = new File(['abc'], 'before.jpg', { type: 'image/jpeg' });
    const event = {
      target: {
        files: {
          item: (_index: number) => file
        }
      }
    } as unknown as Event;

    component.onFileSelected(event);
    component.uploadImage();

    expect(component.imageErrorMessage).toBe('Invalid image file');
  });

  it('reloads images when category filter changes', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.setImageCategoryFilter('MRI');

    expect(imageServiceSpy.getImagesByCase).toHaveBeenCalledWith(501, 'MRI');
    expect(component.imageCategoryFilter).toBe('MRI');
  });

  it('deletes a medical image only after confirmation', async () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();

    await fixture.componentInstance.deleteImage(301);

    expect(confirmationSpy.confirm).toHaveBeenCalled();
    expect(imageServiceSpy.deleteImage).toHaveBeenCalledWith(301);
  });

  it('keeps a medical image when deletion is not confirmed', async () => {
    confirmationSpy.confirm.and.returnValue(Promise.resolve(false));
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();

    await fixture.componentInstance.deleteImage(301);

    expect(imageServiceSpy.deleteImage).not.toHaveBeenCalled();
  });
});
