import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvancedReportsComponent } from './advanced-reports.component';

describe('AdvancedReportsComponent', () => {
  let component: AdvancedReportsComponent;
  let fixture: ComponentFixture<AdvancedReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvancedReportsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvancedReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
