import { TestBed } from '@angular/core/testing';

import { AudiosignalingService } from './audiosignaling.service';

describe('AudiosignalingService', () => {
  let service: AudiosignalingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudiosignalingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
