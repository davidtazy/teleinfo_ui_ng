import { tick } from "@angular/core/testing";
import { delayWhen, from, map, of, pluck, timer } from "rxjs";
import { InfluxClientService } from "./influx-client.service";
import { InfluxService } from "./influx.service";
import { Sample } from "./teleinfo";

let influxClientSpy: jasmine.SpyObj<InfluxClientService>;
//let influx: InfluxService;

interface SampleInjector {
  sample: Sample,
  time: number
}

describe('TestInfluxService', () => {
  beforeEach(() => {

    influxClientSpy = jasmine.createSpyObj<InfluxClientService>('InfluxClientService', ["query_rows"]);

  });

  it('stream$ observable return  array packed by time and ordered by name)', (done: DoneFn) => {
    const expectedSamples: Sample[] =
      [{ date: "12345", name: 'A', value: "12" }, { date: "12345", name: 'B', value: "34" }];

    // inject 3 samples not, but third one is not expected because it will be sent after the buffer time setting
    const inject_samples: SampleInjector[] = [{ sample: expectedSamples[1], time: 20 },
    { sample: expectedSamples[0], time: 100 }, { sample: expectedSamples[1], time: 1000 }]

    influxClientSpy.query_rows.and.returnValue(
      from(inject_samples).pipe(
        delayWhen((si: SampleInjector) => timer(si.time)),
        map((si: SampleInjector) => si.sample)
      )
    )

    const influx = new InfluxService(influxClientSpy);

    influx.stream$.subscribe(samples => {
      expect(samples).toEqual(expectedSamples)
      done()
    })

  });



})