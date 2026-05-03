import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionarDispositivos } from './gestionar-dispositivos';

describe('GestionarDispositivos', () => {
  let component: GestionarDispositivos;
  let fixture: ComponentFixture<GestionarDispositivos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionarDispositivos],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionarDispositivos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
