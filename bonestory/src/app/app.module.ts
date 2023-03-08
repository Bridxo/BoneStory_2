import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';


import { ProvenanceService } from './provenance.service';
import { BrainvisCanvasComponent } from './brainvis-canvas/brainvis-canvas.component';
import { CpuGpuUsageComponent } from './util/cpu-gpu-usage.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProvenanceVisualizationComponent } from './provenance-visualization/provenance-visualization.component';
import { ProvenanceSlidesComponent } from './provenance-slides/provenance-slides.component';
import { SlideAnnotationsComponent } from './slide-annotations/slide-annotations.component';
import { HttpClientModule } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';



@NgModule({
  declarations: [
    AppComponent,
    BrainvisCanvasComponent,
    ProvenanceVisualizationComponent,
    ProvenanceSlidesComponent,
    SlideAnnotationsComponent,
    // CpuGpuUsageComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    MatTooltipModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatIconModule,
    HttpClientModule,
    MatSliderModule
  ],
  providers: [ProvenanceService],
  bootstrap: [AppComponent]
})
export class AppModule { }
