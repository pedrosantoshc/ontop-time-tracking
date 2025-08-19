import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProofViewerModalComponent } from './proof-viewer-modal.component';

describe('ProofViewerModalComponent', () => {
  let component: ProofViewerModalComponent;
  let fixture: ComponentFixture<ProofViewerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProofViewerModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProofViewerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
