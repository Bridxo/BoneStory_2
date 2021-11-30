import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { ProvenanceService } from '../provenance.service';
import { ProvenanceTreeVisualization } from '@visualstorytelling/provenance-tree-visualization';
import {addVisualizationListeners} from './visualizationListeners';

@Component({
  selector: 'app-provenance-visualization',
  templateUrl: './provenance-visualization.component.html',
  styleUrls: ['./provenance-visualization.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProvenanceVisualizationComponent implements OnInit {
  private _viz: ProvenanceTreeVisualization;
  constructor(private elementRef: ElementRef, private provenance: ProvenanceService) {
  }

  ngOnInit() {
    this._viz = new ProvenanceTreeVisualization(
      this.provenance.traverser,
      this.elementRef.nativeElement,
    );
    
    // addVisualizationListeners(this._viz, this.provenance);
  }


}
(function () {
  var blockContextMenu;

  blockContextMenu = function (evt: any) {
      evt.preventDefault();
  };

  window.addEventListener('contextmenu', blockContextMenu);
})();