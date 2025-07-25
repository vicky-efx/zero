import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudiocallComponent } from './audiocall.component';

describe('AudiocallComponent', () => {
  let component: AudiocallComponent;
  let fixture: ComponentFixture<AudiocallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudiocallComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AudiocallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
