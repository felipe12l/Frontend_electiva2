import { TestBed } from '@angular/core/testing';

import { TiposAlerta } from './tipos-alerta';

describe('TiposAlerta', () => {
  let service: TiposAlerta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiposAlerta);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
