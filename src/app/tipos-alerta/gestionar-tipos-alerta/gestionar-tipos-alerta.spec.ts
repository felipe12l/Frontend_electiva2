import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarTiposAlerta } from './gestionar-tipos-alerta';

describe('GestionarTiposAlerta', () => {
  let component: GestionarTiposAlerta;
  let fixture: ComponentFixture<GestionarTiposAlerta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarTiposAlerta],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarTiposAlerta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
