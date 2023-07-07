import { Component, ElementRef, OnInit, SimpleChanges, ViewEncapsulation, Input } from '@angular/core';
import { ProvenanceService } from '../provenance.service';
import { ProvenanceTreeVisualization } from '@visualstorytelling/provenance-tree-visualization';
import {addVisualizationListeners} from './visualizationListeners';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';

@Component({
  selector: 'app-provenance-visualization',
  templateUrl: './provenance-visualization.component.html',
  styleUrls: ['./provenance-visualization.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProvenanceVisualizationComponent implements OnInit {
  private _viz: ProvenanceTreeVisualization;
  public slider_value = 0;
  private grouping_text = {
    0: 'Actionwise grouping',
    1: 'Typewise grouping',
    2: 'Fragmentwise grouping',
  }
  @Input() provenances: ProvenanceService; // Move @Input() inside the class.
  constructor(private elementRef: ElementRef, private provenance: ProvenanceService, public dialog: MatDialog) {
    window.addEventListener('deleteButtonClicked', this.openDialog.bind(this));
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
  openDialog(event: CustomEvent): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'Delete only selected node') {
        // perform action for Option A
        var real_traverser = this._viz.real_traverser;
        real_traverser
          .filter((d: any) => {
            const ref = d.data.wrappedNodes.includes(this._viz.traverser.graph.current);
            if (ref) {
                this._viz.deletesingleNode();
                this._viz.update();
            }
          });
      } else if (result === 'Delete the selected node and all its descendants') {
        // perform action for Option B
        var real_traverser = this._viz.real_traverser;
        real_traverser
          .filter((d: any) => {
            const ref = d.data.wrappedNodes.includes(this._viz.traverser.graph.current);
            if (ref) {
              if (d.data.wrappedNodes.length == 1)
                this._viz.deleteNode();
            }
          });
      } else {
        // perform action for Cancel
      }
    });
  }

  function () {
  var blockContextMenu;

  blockContextMenu = function (evt: any) {
      evt.preventDefault();
  };
  window.addEventListener('contextmenu', blockContextMenu)}
}