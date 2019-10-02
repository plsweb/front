import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Formulario } from './formulario.component';

describe('Formulario', () => {
  let component: Formulario;
  let fixture: ComponentFixture<Formulario>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Formulario ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Formulario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
