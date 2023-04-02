import { Injectable } from '@angular/core';
import { QueryApi, InfluxDB } from "@influxdata/influxdb-client";
import { bufferTime, filter, from, interval, map, Observable, share, switchMap, tap, timer } from 'rxjs';
import { Sample } from "./teleinfo"
import { environment } from '../environments/environment';
import { InfluxClientService } from './influx-client.service';
export interface InfluxQueryState {
  values: Sample[];
  isLoading: boolean;
};


@Injectable({
  providedIn: 'root'
})
export class InfluxService {

  private bucket = "teleinfo";
  private period_ms = 2000;

  private stream_cache: Observable<Sample[]> | null = null
  private offset_cache: Observable<Sample[]> | null = null

  constructor(private influx_client: InfluxClientService) { }

  public get stream$(): Observable<Sample[]> {

    if (this.stream_cache !== null) {
      return this.stream_cache
    }

    const fluxQuery = this.getPeriodicQuery()

    this.stream_cache = interval(this.period_ms).pipe(
      switchMap((_) => {

        return this.influx_client.query_rows(fluxQuery)
          .pipe(
            bufferTime(this.period_ms / 3),
            filter(samples => samples.length > 0),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )
    return this.stream_cache
  }

  public get offset$(): Observable<Sample[]> {
    if (this.offset_cache !== null) {
      return this.offset_cache
    }
    this.offset_cache = timer(1000, 60000).pipe(
      switchMap((_) => {
        return from(this.influx_client.query_rows(this.getOriginQuery(new Date())))
          .pipe(
            bufferTime(1000),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )

    return this.offset_cache

  }

  public daylyreport$(offset: number): Observable<Sample[]> {

    const fluxQuery = (offset <= 0) ? this.getDailyReportQuery() : this.getPastReportQuery(offset)

    return this.influx_client.query_rows(fluxQuery)
      .pipe(
        bufferTime(1000),
        filter(samples => samples.length > 0),
        //tap((samples) => console.log("influx query received"))
      )

  }

  getDailyReportQuery() {
    return `import "timezone"
    import "date"
    option location = timezone.location(name: "Europe/Paris")
    from(bucket: "teleinfo")
          |> range(start: date.sub( d:150m, from:today() ) )
          |> filter(fn: (r) => r["_measurement"] == "BBRHCJB"  or r["_measurement"] == "BBRHPJB")
          |> keep(columns: ["_time", "_measurement","_value"])
          |> aggregateWindow(every: 30m, fn: last)`;
  }

  getPastReportQuery(delta: number) {

    const begin = `${delta + 1}d`
    const end = `${delta}d`

    return `import "timezone"
    import "date"
    option location = timezone.location(name: "Europe/Paris")
    
    delta= date.sub( d:150m, from:today() )
    begin = date.sub(d:${begin} , from:delta )
    end= date.sub( d:${end}, from:today() )
    
    from(bucket: "teleinfo")
            |> range(start: begin, stop:end )
            |> filter(fn: (r) => r["_measurement"] == "BBRHCJB"  or r["_measurement"] == "BBRHPJB")
            |> keep(columns: ["_time", "_measurement","_value"])
            |> aggregateWindow(every: 30m, fn: last)`
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
