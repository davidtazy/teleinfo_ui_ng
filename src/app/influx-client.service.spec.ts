import { TestBed } from '@angular/core/testing';

import { InfluxClientService } from './influx-client.service';

describe('InfluxClientService', () => {
  let service: InfluxClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfluxClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
