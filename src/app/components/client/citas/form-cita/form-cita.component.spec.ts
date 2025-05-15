import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCitaComponent } from './form-cita.component';

describe('FormCitaComponent', () => {
  let component: FormCitaComponent;
  let fixture: ComponentFixture<FormCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormCitaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
