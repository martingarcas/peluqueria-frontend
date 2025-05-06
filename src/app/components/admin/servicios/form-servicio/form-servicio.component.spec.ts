import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormServicioComponent } from './form-servicio.component';

describe('FormServicioComponent', () => {
  let component: FormServicioComponent;
  let fixture: ComponentFixture<FormServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormServicioComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
