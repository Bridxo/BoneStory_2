import { ElementRef } from '@angular/core';

import {SlideDeckVisualization} from '@visualstorytelling/slide-deck-visualization';
import { ProvenanceService } from '../provenance.service';
import { ProvenanceSlidedeck } from '@visualstorytelling/provenance-core';
import {ProvenanceSlidesComponent} from './provenance-slides.component';
import { merge } from 'rxjs';

export const addListenersSlides = (slideDeck: SlideDeckVisualization, deck: ProvenanceSlidedeck, service: ProvenanceService) => {

    let exportButton = document.getElementById("saveprov_btn");
    exportButton.addEventListener("click", (e: Event) => exportJson(e));

    let importButton = document.getElementById("slidesImportButton");
    importButton.addEventListener("click", (e: Event)  => importJson(e));

    // let mergeButton = document.getElementById("slidesMergeButton");
    // mergeButton.addEventListener("click", (e: Event) =>  merge(e));
    
    function importJson(e: Event) : void{
        let element = document.createElement('input');
        element.setAttribute('type', 'file');
        element.setAttribute('id', 'input-file');
        element.setAttribute('accept', '.json');
        element.style.display = 'none';
        document.body.appendChild(element);
        // document.getElementById('input-file').addEventListener('change', (e: Event) => getFile(e))
        element.click(); // simulate click
        document.body.removeChild(element);
    }

    function getFile(e: Event){
        let input = <HTMLInputElement>e.target;
        let files = input.files;
        var f:File = files[0];
        var reader = new FileReader();
        var name = f.name;
        reader.onload = function (e) {
            var target: any = e.target;
            var data = target.result;
            restoreDeck(data);
        };
        reader.readAsText(f);
    }

    function restoreDeck(data){
        let data_in = JSON.parse(data);
        // slideDeck.setDeck(data_in, service.traverser, service.graph, service.graph.application);
        slideDeck.update();
    }

    function exportJson(e:Event) : void {
        let myJson = deck.serializeSelf();
        downloadJson(myJson);
    }

    function downloadJson(myJson: any){
        var sJson = JSON.stringify(myJson, null, 2);
        var element = document.createElement('a');
        element.setAttribute('href', "data:text/json;charset=UTF-8," + encodeURIComponent(sJson));
        element.setAttribute('download', "slides-template.json");
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click(); // simulate click
        document.body.removeChild(element);
    }

    // function importJsonMerge(e: Event) : void{
    //     let element = document.createElement('input');
    //     element.setAttribute('type', 'file');
    //     element.setAttribute('id', 'input-file');
    //     element.setAttribute('accept', '.json');
    //     element.style.display = 'none';
    //     document.body.appendChild(element);
    //     document.getElementById('input-file').addEventListener('change', (e: Event) => getFileMerge(e))
    //     element.click(); // simulate click
    //     document.body.removeChild(element);
    // }

    // function getFileMerge(e: Event){
    //     let input = <HTMLInputElement>e.target;
    //     let files = input.files;
    //     var f:File = files[0];
    //     var reader = new FileReader();
    //     var name = f.name;
    //     reader.onload = function (e) {
    //         var target: any = e.target;
    //         var data = target.result;
    //         mergeDeck(data);
    //     };
    //     reader.readAsText(f);
    // }

    // function mergeDeck(data){
    //     let data_in = JSON.parse(data);
    //     let deckToMerge = deck.restoreSelf(data_in, service.traverser, service.graph, service.graph.application);
    //     let to_add = slideDeck.getDeck();
    //     deckToMerge.slides.forEach(slide => {
    //         to_add.addSlide(slide);
    //     });
    //     slideDeck.update();
    // }

    // function merge(e: Event){
    //     importJsonMerge(e); 
    // }


}