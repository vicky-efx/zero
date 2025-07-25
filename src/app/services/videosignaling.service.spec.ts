import { TestBed } from '@angular/core/testing';

import { VideosignalingService } from './videosignaling.service';

describe('VideosignalingService', () => {
  let service: VideosignalingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideosignalingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
