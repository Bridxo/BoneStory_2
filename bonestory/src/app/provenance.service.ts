import { Injectable } from '@angular/core';

import {
  ProvenanceGraph,
  ProvenanceTracker,
  ProvenanceGraphTraverser,
  ActionFunctionRegistry,
} from '@visualstorytelling/provenance-core';
4
@Injectable({
  providedIn: 'root'
})
export class ProvenanceService {
  public graph: ProvenanceGraph;
  public chidegraph: ProvenanceGraph;
  public registry: ActionFunctionRegistry;
  public tracker: ProvenanceTracker;
  public tracker_2: ProvenanceTracker;
  public traverser: ProvenanceGraphTraverser;

  constructor() {
    this.graph = new ProvenanceGraph({ name: 'bonestory', version: '1.0.0' });
    this.chidegraph = new ProvenanceGraph({ name: 'Camhide', version: '1.0.0' });
    this.registry = new ActionFunctionRegistry();
    this.tracker = new ProvenanceTracker(this.registry, this.graph);
    this.tracker_2 = new ProvenanceTracker(this.registry, this.chidegraph);
    this.traverser = new ProvenanceGraphTraverser(this.registry, this.graph, this.tracker);

    // todo: remove objects from window (used for dev / debug)
    const w = window as any;
    w.graph = this.graph;
    w.graph = this.chidegraph;
    w.registry = this.registry;
    w.tracker = this.tracker;
    w.traverser = this.traverser;
    w.tracker_2 = this.tracker_2;
  }
}
