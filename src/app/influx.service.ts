import { Injectable } from '@angular/core';
import { QueryApi, InfluxDB } from "@influxdata/influxdb-client";
import { bufferTime, from, interval, map, Observable, share, switchMap } from 'rxjs';
import { Sample } from "./teleinfo"
import { environment } from '../environments/environment';
export interface InfluxQueryState {
  values: Sample[];
  isLoading: boolean;
};

@Injectable({
  providedIn: 'root'
})
export class InfluxService {

  private bucket = "teleinfo";
  private period_ms = 1000;

  private queryApi: QueryApi

  public stream$: Observable<Sample[]>
  public offset$: Observable<Sample[]>

  constructor() {

    this.queryApi = new InfluxDB({ url: environment.url, token: environment.token }).getQueryApi(environment.org)

    const fluxQuery = this.getPeriodicQuery()

    this.stream$ = interval(this.period_ms).pipe(
      switchMap((_) => {

        return from(this.queryApi.rows(fluxQuery))
          .pipe(
            map((row) => {
              const o = row.tableMeta.toObject(row.values)
              const sample: Sample = {
                date: o["_time"],
                name: o["_measurement"],
                value: o["_value"],
              };
              return sample
            }
            ),
            bufferTime(this.period_ms / 5),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )

    this.offset$ = interval(60000).pipe(
      switchMap((_) => {

        return from(this.queryApi.rows(this.getOriginQuery(new Date())))
          .pipe(
            map((row) => {
              const o = row.tableMeta.toObject(row.values)
              const sample: Sample = {
                date: o["_time"],
                name: o["_measurement"],
                value: o["_value"],
              };
              return sample
            }
            ),
            bufferTime(1000),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )

  }


  getPeriodicQuery() {
    return `import "timezone"
    option location = timezone.location(name: "Europe/Paris")
    from(bucket: "${this.bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_field"] == "value")
        |> last()`;
  }


  getOriginQuery(now: Date): string {
    // HEURES CREUSE begins at 10pm to 6AM
    let first_query = `import "timezone"
  import "date"
  option location = timezone.location(name: "Europe/Paris")
  from(bucket: "${this.bucket}")
      |> range(start: date.sub( d:2h, from:today() ) )
      |> filter(fn: (r) => r["_field"] == "value")
      |> first()`;

    let evening_query = `import "timezone"
      import "date"
      option location = timezone.location(name: "Europe/Paris")
      from(bucket: "${this.bucket}")
      |> range(start: date.add( d:6h, to:today() ) )
      |> filter(fn: (r) => r["_field"] == "value")
      |> first()`;
    if (now.getHours() >= 22) {
      // in the evening (from  10pm to midnight)
      // nightly counter is reset for the new night
      // dayly counter is kept untill midnight
      return evening_query;
    } else {
      // from midnight to 10pm
      // nightly counter count from 10pm the previous day
      // daily counter too
      return first_query;
    }
  }
}
