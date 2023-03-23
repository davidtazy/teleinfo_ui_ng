import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DebugComponent } from './debug/debug.component';
import { CardComponent } from './card/card.component';

@NgModule({
  declarations: [
    AppComponent,
    DebugComponent,
    CardComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
