import { Component, ElementRef, OnInit, ViewEncapsulation } from '@angular/core';
import { ProvenanceService } from '../provenance.service';
import { ProvenanceTreeVisualization } from '@visualstorytelling/provenance-tree-visualization';
import {addVisualizationListeners} from './visualizationListeners';
import { get } from 'lodash';

@Component({
  selector: 'app-provenance-visualization',
  templateUrl: './provenance-visualization.component.html',
  styleUrls: ['./provenance-visualization.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProvenanceVisualizationComponent implements OnInit {
  private _viz: ProvenanceTreeVisualization;
  public slider_value = 0;
  constructor(private elementRef: ElementRef, private provenance: ProvenanceService) {
    window.addEventListener('resize', this.getfullsizeview.bind(this));
  }

  ngOnInit() {
    this._viz = new ProvenanceTreeVisualization(
      this.provenance.traverser,
      this.elementRef.nativeElement,
    );
    addVisualizationListeners(this._viz, this.provenance);
  }

  update() {
    this._viz.update();
  }

  getnodenumber() {
    try{
      return this._viz.numberofnodes - this._viz.numberOfUniqueValues;
    }catch(error){
      return 0;
    }
  }
  setgroupnumber() {
    console.log(this.slider_value);
    this._viz.groupnumber = this.slider_value;
    this.update();
  }

  getfullsizeview() {
    this._viz.getFullsizeview();
  }

  setviz(viz: ProvenanceTreeVisualization) {
    this._viz = viz;
  }

}
(function () {
  var blockContextMenu;

  blockContextMenu = function (evt: any) {
      evt.preventDefault();
  };
  window.addEventListener('contextmenu', blockContextMenu);
})();