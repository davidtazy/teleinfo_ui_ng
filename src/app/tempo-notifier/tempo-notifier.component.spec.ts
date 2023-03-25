import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TempoNotifierComponent } from './tempo-notifier.component';

describe('TempoNotifierComponent', () => {
  let component: TempoNotifierComponent;
  let fixture: ComponentFixture<TempoNotifierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TempoNotifierComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TempoNotifierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
