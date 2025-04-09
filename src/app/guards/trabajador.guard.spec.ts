import { TestBed } from '@angular/core/testing';

import { TrabajadorGuard } from './trabajador.guard';

describe('TrabajadorGuard', () => {
  let guard: TrabajadorGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TrabajadorGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
