// provenance-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProvenanceGraph } from '@visualstorytelling/provenance-core';
import { ProvenanceSlidedeck } from '@visualstorytelling/provenance-core';

@Injectable({
  providedIn: 'any'
})
export class ProvenanceStateService {
  private provenanceGraphSource = new BehaviorSubject<ProvenanceGraph>(null);
  private slideDeckSource = new BehaviorSubject<ProvenanceSlidedeck>(null);

  currentProvenanceGraph = this.provenanceGraphSource.asObservable();
  currentSlideDeck = this.slideDeckSource.asObservable();

  setProvenanceGraph(graph: ProvenanceGraph) {
    this.provenanceGraphSource.next(graph);
  }

  setSlideDeck(slideDeck: ProvenanceSlidedeck) {
    this.slideDeckSource.next(slideDeck);
  }
}