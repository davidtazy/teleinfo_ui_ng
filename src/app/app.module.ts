import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DebugComponent } from './debug/debug.component';
import { CardComponent } from './card/card.component';
import { TempoNotifierComponent } from './tempo-notifier/tempo-notifier.component';
import { ChartComponent } from './chart/chart.component';
import { NgChartsModule } from 'ng2-charts';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    DebugComponent,
    CardComponent,
    TempoNotifierComponent,
    ChartComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    NgChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
