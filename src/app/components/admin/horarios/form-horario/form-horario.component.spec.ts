import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormHorarioComponent } from './form-horario.component';

describe('FormHorarioComponent', () => {
  let component: FormHorarioComponent;
  let fixture: ComponentFixture<FormHorarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormHorarioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormHorarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
