import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearPaciente } from './crear-paciente';

describe('CrearPaciente', () => {
  let component: CrearPaciente;
  let fixture: ComponentFixture<CrearPaciente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPaciente],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPaciente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
