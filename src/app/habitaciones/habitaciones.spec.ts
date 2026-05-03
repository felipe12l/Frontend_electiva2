import { TestBed } from '@angular/core/testing';

import { Habitaciones } from './habitaciones';

describe('Habitaciones', () => {
  let service: Habitaciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Habitaciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
