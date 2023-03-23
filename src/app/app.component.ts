import { Component } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { InfluxService } from './influx.service';
import { Teleinfo } from './teleinfo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  papp$: Observable<string | null>

  constructor(private influx: InfluxService) {

    this.papp$ = influx.stream$.pipe(
      map(
        samples => {
          const teleinfo = new Teleinfo(samples, [])
          return teleinfo.getInstantPower().renderTokW()
        }
      )
    )

  }

  title = 'teleinfo-ui-ng';

  papp = "12.3"

}
