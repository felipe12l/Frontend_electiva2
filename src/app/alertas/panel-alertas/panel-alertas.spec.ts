import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelAlertas } from './panel-alertas';

describe('PanelAlertas', () => {
  let component: PanelAlertas;
  let fixture: ComponentFixture<PanelAlertas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelAlertas],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelAlertas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
