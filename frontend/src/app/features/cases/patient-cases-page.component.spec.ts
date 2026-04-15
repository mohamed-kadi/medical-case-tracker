import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { PatientCasesPageComponent } from './patient-cases-page.component';
import { PatientService } from '../../core/services/patient.service';
import { CaseService } from '../../core/services/case.service';
import { ImageService } from '../../core/services/image.service';
import { I18nService } from '../../core/services/i18n.service';

describe('PatientCasesPageComponent', () => {
  let patientServiceSpy: jasmine.SpyObj<PatientService>;
  let caseServiceSpy: jasmine.SpyObj<CaseService>;
  let imageServiceSpy: jasmine.SpyObj<ImageService>;
  let i18nServiceSpy: jasmine.SpyObj<I18nService>;

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

    i18nServiceSpy.t.and.callFake((key: string) => key);
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
        status: 'OPEN'
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
        { provide: I18nService, useValue: i18nServiceSpy }
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
    expect(caseServiceSpy.updateCaseStatus).toHaveBeenCalledWith(501, 'IN_PROGRESS');
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

  it('reloads images when category filter changes', () => {
    const fixture = TestBed.createComponent(PatientCasesPageComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.setImageCategoryFilter('MRI');

    expect(imageServiceSpy.getImagesByCase).toHaveBeenCalledWith(501, 'MRI');
    expect(component.imageCategoryFilter).toBe('MRI');
  });
});
