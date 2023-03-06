import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';

import { ProvenanceSlide, ProvenanceSlidedeck } from '@visualstorytelling/provenance-core';
import { SlideDeckVisualization } from '@visualstorytelling/slide-deck-visualization';
import {addListenersSlides} from './slidesListeners';
import { ProvenanceService } from '../provenance.service';

@Component({
  selector: 'app-provenance-slides',
  templateUrl: './provenance-slides.component.html',
  styleUrls: ['./provenance-slides.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProvenanceSlidesComponent implements OnInit {
  private _deck: ProvenanceSlidedeck;
  private _deckViz: SlideDeckVisualization;

  constructor(private elementRef: ElementRef, private provenance: ProvenanceService) {
  }

  get deck() : ProvenanceSlidedeck {
    return this._deck;
  }

  ngOnInit() {
    this._deck = new ProvenanceSlidedeck(this.provenance.graph.application, this.provenance.traverser);
    this._deckViz = new SlideDeckVisualization(this._deck, this.elementRef.nativeElement.children[0]);
    (window as any).slideDeck = this._deck;
    (window as any).slideDeckViz = this._deckViz;
    addListenersSlides(this._deckViz, this._deck, this.provenance);
  }
}
