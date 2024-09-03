import { Injectable } from '@angular/core';

import {
  ProvenanceGraph,
  ProvenanceTracker,
  ProvenanceGraphTraverser,
  ActionFunctionRegistry,
} from '@visualstorytelling/provenance-core';
4
@Injectable({
  providedIn: 'any'
})
export class ProvenanceService {
  public graph: ProvenanceGraph;
  public registry: ActionFunctionRegistry;
  public tracker: ProvenanceTracker;
  public traverser: ProvenanceGraphTraverser;

  constructor() {
    this.graph = new ProvenanceGraph({ name: 'bonestory', version: '1.0.0' });
    this.registry = new ActionFunctionRegistry();
    this.tracker = new ProvenanceTracker(this.registry, this.graph);
    this.traverser = new ProvenanceGraphTraverser(this.registry, this.graph, this.tracker);

    // todo: remove objects from window (used for dev / debug)
    const w = window as any;
    w.graph = this.graph;
    w.registry = this.registry;
    w.tracker = this.tracker;
    w.traverser = this.traverser;
  }
  updateProvenanceObjects(graph, registry, tracker, traverser) {
    this.graph = graph;
    this.registry = registry;
    this.tracker = tracker;
    this.traverser = traverser;
    const w = window as any;
    w.graph = this.graph;
    w.registry = this.registry;
    w.tracker = this.tracker;
    w.traverser = this.traverser;
  }
}
