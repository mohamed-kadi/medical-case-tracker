import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ImageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load images by case id', () => {
    service.getImagesByCase(15).subscribe((images) => {
      expect(images.length).toBe(1);
      expect(images[0].id).toBe(2);
    });

    const request = httpMock.expectOne('http://localhost:8080/api/images/case/15');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 2,
        fileName: 'case-before.jpg',
        contentType: 'image/jpeg',
        category: 'BEFORE_TREATMENT',
        mimeType: 'image/jpeg',
        size: 12000,
        uploadedBy: 'doctorOne'
      }
    ]);
  });

  it('should load images by case id and category filter', () => {
    service.getImagesByCase(15, 'MRI').subscribe((images) => {
      expect(images.length).toBe(1);
      expect(images[0].category).toBe('MRI');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/images/case/15/category?category=MRI');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 4,
        fileName: 'mri.jpg',
        contentType: 'image/jpeg',
        category: 'MRI',
        mimeType: 'image/jpeg',
        size: 1000,
        uploadedBy: 'doctorOne'
      }
    ]);
  });

  it('should upload image with multipart form data', () => {
    const file = new File(['abc'], 'before.jpg', { type: 'image/jpeg' });

    service.uploadImage(file, 15, 'BEFORE_TREATMENT', 'Before session').subscribe((image) => {
      expect(image.id).toBe(3);
      expect(image.category).toBe('BEFORE_TREATMENT');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/images/upload');
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();

    const formData = request.request.body as FormData;
    expect(formData.get('caseId')).toBe('15');
    expect(formData.get('category')).toBe('BEFORE_TREATMENT');
    expect(formData.get('description')).toBe('Before session');
    expect((formData.get('file') as File).name).toBe('before.jpg');

    request.flush({
      id: 3,
      fileName: 'before.jpg',
      contentType: 'image/jpeg',
      category: 'BEFORE_TREATMENT',
      mimeType: 'image/jpeg',
      size: 3,
      uploadedBy: 'doctorOne'
    });
  });

  it('should delete image', () => {
    service.deleteImage(6).subscribe(() => undefined);

    const request = httpMock.expectOne('http://localhost:8080/api/images/6');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('should download image as blob', () => {
    service.downloadImage(6).subscribe((blob) => {
      expect(blob.size).toBe(3);
      expect(blob.type).toBe('image/jpeg');
    });

    const request = httpMock.expectOne('http://localhost:8080/api/images/download/6');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['abc'], { type: 'image/jpeg' }));
  });
});
