import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Opme } from './opme.component';

describe('Opme Component', () => {
  let component: Opme;
  let fixture: ComponentFixture<Opme>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Opme ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Opme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
