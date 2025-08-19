import { TestBed } from '@angular/core/testing';

import { EditTrackingService } from './edit-tracking.service';

describe('EditTrackingService', () => {
  let service: EditTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditTrackingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
