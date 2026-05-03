import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarHabitaciones } from './gestionar-habitaciones';

describe('GestionarHabitaciones', () => {
  let component: GestionarHabitaciones;
  let fixture: ComponentFixture<GestionarHabitaciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarHabitaciones],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarHabitaciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
