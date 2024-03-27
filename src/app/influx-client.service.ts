import { Injectable } from '@angular/core';
import { QueryApi, InfluxDB } from "@influxdata/influxdb-client";
import { catchError, EMPTY, from, map, Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import { Sample } from './teleinfo';

@Injectable({
  providedIn: 'root'
})
export class InfluxClientService {

  private queryApi: QueryApi

  constructor() {
    this.queryApi = new InfluxDB({ url: environment.url, token: environment.token }).getQueryApi(environment.org)
  }

  public query_rows(fluxQuery: string): Observable<Sample> {

    return from(this.queryApi.rows(fluxQuery))
      .pipe(
        catchError(error => {
          console.error(error)
          return EMPTY
        }),
        map((row) => {
          const o = row.tableMeta.toObject(row.values)
          return {
            date: o["_time"],
            name: o["_measurement"],
            value: o["_value"],
          };
        }
        )
      )
  }


  public query_number(fluxQuery: string): Observable<number>{

    return from(this.queryApi.rows(fluxQuery))
      .pipe(
        catchError(error => {
          console.error(error)
          return EMPTY
        }),
        map((row) => {
          const o = row.tableMeta.toObject(row.values)
          return  o["_value"];
        }
        )
      )
  }

}
