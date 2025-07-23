import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerTrackingComponent } from './worker-tracking.component';

describe('WorkerTrackingComponent', () => {
  let component: WorkerTrackingComponent;
  let fixture: ComponentFixture<WorkerTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerTrackingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
