import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableTennisComponent } from './table-tennis.component';

describe('TableTennisComponent', () => {
  let component: TableTennisComponent;
  let fixture: ComponentFixture<TableTennisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TableTennisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TableTennisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
