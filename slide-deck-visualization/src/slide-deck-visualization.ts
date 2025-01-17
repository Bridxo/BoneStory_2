import * as d3 from "d3";
import "./style.css";

import {
    IProvenanceSlide,
    ProvenanceSlide,
    IProvenanceSlidedeck,
    SlideAnnotation,
    StateNode,
    ProvenanceNode,
    ProvenanceSlidedeck
} from "@visualstorytelling/provenance-core";

import { AnnotationDisplayContainer } from "./annotation-display/annotation-display-container";
import { PositionedString } from "./annotation-display/annotation-display";
(window as any).global = window;

function firstArgThis(f: (...args: any[]) => any) {
    return function(this: any, ...args: any[]) {
        return f(this, ...args);
    };
}

type IndexedSlide = { slide: IProvenanceSlide; startTime: number };

export class SlideDeckVisualization {
    private _slideDeck: IProvenanceSlidedeck; // possible to extend HLEE
    private _slideDocker: IProvenanceSlidedeck[] = [];
    private _root: d3.Selection<HTMLDivElement, undefined, null, undefined>;
    private _slideTable: d3.Selection<SVGElement, undefined, null, undefined>;
    private _tableHeight = 125;
    private _tableWidth = 1800;
    private _minimumSlideDuration = 500;
    private _barWidthTimeMultiplier = 0.05;
    private _barPadding = 5;
    private _resizebarwidth = 5;
    private _previousSlideX = 0;
    private _lineX1 = 50;
    private _placeholderX = 0;
    private _toolbarX = 10;
    private _toolbarY = 35;
    private _toolbarPadding = 20;
    // Upon dragging a slide, no matter where you click on it, the beginning of the slide jumps to the mouse position.
    // This next variable is calculated to adjust for that error, it is a workaround but it works
    private _draggedSlideReAdjustmentFactor = 0;

    private _originPosition = 60;
    private _currentTime = 0;
    private _currentlyPlaying = false;
    private _timelineShift = 0;
    private _timeIndexedSlides: IndexedSlide[] = [];
    private _gridTimeStep = 1000;
    private _gridSnap = false;
    private _colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    private _annotationContainer = new AnnotationDisplayContainer();

    constructor(slideDeck: IProvenanceSlidedeck, elm: HTMLDivElement) {
        this._tableWidth = window.innerWidth - 400;
        window.addEventListener("resize", this.resizeTable);
        this._slideDeck = slideDeck;
        this._slideDocker.push(slideDeck);
        this._root = d3.select(elm);

        this._slideTable = this._root
            .append<SVGElement>("svg")
            .attr("class", "slide__table")
            .attr("height", this._tableHeight)
            .attr("width", this._tableWidth);

        this._slideTable
            .append("rect")
            .attr("class", "slides_background_rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", this._tableHeight)
            .attr("width", this._tableWidth);

        this._slideTable
            .append("line")
            .attr("class", "vertical-line")
            .attr("x1", this._lineX1)
            .attr("y1", 0)
            .attr("x2", this._lineX1)
            .attr("y2", 100)
            .attr("stroke", "gray")
            .attr("stroke-width", 2);

        this._slideTable
            .append("line")
            .attr("class", "horizontal-line")
            .attr("x1", this._lineX1)
            .attr("y1", this._resizebarwidth + this._originPosition)
            .attr("y2", this._resizebarwidth + this._originPosition)
            .attr("stroke", "gray")
            .attr("stroke-width", 2);

        this._slideTable
            .append("rect")
            .attr("class", "seek-dragger")
            .attr("fill", "transparent")
            .attr("x", this._originPosition)
            .attr("y", this._originPosition)
            .attr("height", 12)
            .attr("width", 12)
            .attr("cursor", "pointer")
            .call(
                (d3.drag() as any)
                    .on("start", firstArgThis(this.seekStarted))
                    .on("drag", firstArgThis(this.seekDragged))
            );


        this._slideTable
            .append("circle")
            .attr("class", "currentTime")
            .attr("fill", "red")
            .attr("r", 4)
            .attr("cx", this._originPosition)
            .attr("cy", 65);

        this._slideTable
            .append("line")
            .attr("class", "vertical-line-seek")
            .attr("x1", this._originPosition)
            .attr("y1", 65)
            .attr("x2", this._originPosition)
            .attr("y2", 0)
            .attr("stroke", "red")
            .attr("stroke-width", 1);


        this._slideTable
            .append("rect")
            .attr("class", "mask")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 50)
            .attr("height", 100)
            .attr("fill", "white");


        this._slideTable
            .append("svg:foreignObject")
            .attr("class", "player_backward")
            .attr("x", 22)
            .attr("y", 5)
            .attr("cursor", "pointer")
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:body")
            .on("mousedown", this.onBackward)
            .html('<i class="fa fa-backward"></i>');

        this._slideTable
            .append("svg:foreignObject")
            .attr("class", "player_play")
            .attr("x", 22)
            .attr("y", 25)
            .attr("cursor", "pointer")
            .attr("width", 20)
            .attr("height", 20)
            .on("mousedown",this.onPlay) // Update the event listener here
            .html('<i class="fa fa-play"></i>');


        this._slideTable
            .append("svg:foreignObject")
            .attr("class", "player_forward")
            .attr("x", 22)
            .attr("y", 45)
            .attr("cursor", "pointer")
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:body")
            .on("mousedown", this.onForward)
            .html('<i class="fa fa-forward"></i>');

        this._slideTable
            .append("text")
            .attr("class", "grid_display")
            .attr("x", this._originPosition + 10)
            .attr("y", 110);

        slideDeck.on("slideAdded", () => this.update());
        slideDeck.on("slideRemoved", () => this.update());
        slideDeck.on("slidesMoved", () => this.update());
        slideDeck.on("slideSelected", () => this.update());
        slideDeck.on("changeslide", () => this.update());

        this.update();
    }

    private selectslidedeck = (bnum: number) => {
        if(this._slideDeck !== this._slideDocker[bnum]){
            this._slideDeck = this._slideDocker[bnum];
            (window as any).slideDeck = this._slideDeck;
            this._currentTime = 0;
            this._placeholderX = 0;

        }
    }
    private onDelete = (slide: IProvenanceSlide) => {
        this.onSelect(slide);
        let node: any;
        if(slide != null)
            node=slide.node;
        else 
            node = this._slideDeck.graph.current;
        node.metadata.isSlideAdded = false;
        node.metadata.bookmarked = false;
        // node.metadata.H_value-=70000;
        this._slideDeck.graph.emitNodeChangedEvent(node);
        for(const slidedecks of this._slideDocker){
            if(slide){
                slidedecks.removeSlide(slide);
            } else if (node) {
                const exactSlide = slidedecks.slides.find((slide: any) => slide.node === node);
                if(slidedecks.slides.filter((slide: any) => slide.node === node))
                    slidedecks.removeSlide(exactSlide as IProvenanceSlide);      
            }
            this.selectSlide(null);
            this.update();
        }
    }

    private onSelect = (slide: IProvenanceSlide) => {
        this.selectSlide(slide);
        this._slideDeck.slideAtTime(this._currentTime);
        if (this._currentlyPlaying) {
            this.stopPlaying();
        }
    }

    private selectSlide = (slide: IProvenanceSlide | null) => {
        if (slide === null) {
            this._annotationContainer.clear();
            return;
        }
        let originalSlideTransitionTime = slide.transitionTime;
        let artificialTransitionTime = 0;

        if (this._currentlyPlaying) {
            artificialTransitionTime =
                slide.transitionTime -
                (this._currentTime - this._slideDeck.startTime(slide));
        } else {
            artificialTransitionTime = 0;
        }

        slide.transitionTime =
            artificialTransitionTime >= 0 ? artificialTransitionTime : 0;
        this._slideDeck.selectedSlide = slide;
        slide.transitionTime = originalSlideTransitionTime;
        this._annotationContainer.loadForSlide(slide);
        this.update();
    }

    private onMouseEnter() {
        let toolbar = d3.event.target.parentElement.querySelector(
            ".slide_toolbar"
        );
        toolbar.style.display = "block";
    }
    private onMouseLeave() {
        let toolbar = d3.event.target.parentElement.querySelector(
            ".slide_toolbar"
        );
        toolbar.style.display = "none";
    }

    private provchanged = (node: ProvenanceNode) => { // annotation 구분을 위해서 쓴다
        let slideDeck = this._slideDeck;
        if(slideDeck != undefined){
            let match = false;
            slideDeck.slides.forEach((slide: any) => {
                if(slide.node != null && slide.node.id === node.id){
                    this.selectSlide(slide);
                    match = true;
                    return;
                }
            });
            if(match === false)
                this.selectSlide(null);
        }
    }

    private onChange = (node: any) => {
        node = node.data.wrappedNodes[0];
        let alpha: any[] = [];
        let counter = 0;
        const maxIterations = 1000;
        if(node.metadata != undefined){
            let temp_node = node;
            do{
                for (const child of temp_node.children) {
                    if (child.metadata.mainbranch){
                        temp_node = child;
                        break;
                    }       
                }
                counter++;
                if (counter > maxIterations) {
                throw new Error("Endless loop detected in onChange function");
                }
            }while(temp_node.children.length != 0)

            let bnumber = temp_node.metadata.branchnumber;
            // console.log(node);
            // console.log(bnumber);
            if(this._slideDocker[bnumber] === undefined){
            const newslideDeck = new ProvenanceSlidedeck({ name: 'bonestory', version: '1.0.0' },(window as any).traverser);
            this._slideDocker[bnumber] = newslideDeck;
            this.selectslidedeck(bnumber);
            
            }
            else
                this.selectslidedeck(bnumber);
            temp_node = node;
            if ((temp_node as StateNode).label === "Root"){
                if((temp_node as StateNode).metadata.bookmarked)
                    alpha.push(temp_node);
            }
            else{
                counter = 0;
                do {
                    if((temp_node as StateNode).parent.metadata.bookmarked){
                        alpha.push((temp_node as StateNode).parent);
                        // console.log(alpha);
                    }
                    temp_node = (temp_node as StateNode).parent;
                    counter++;
                    if (counter > maxIterations) {
                      throw new Error("Endless loop detected in onChange_2 function");
                    }
                } while ((temp_node as StateNode).label != "Root");
            }
            

            for (let i = alpha.length-1; i >=0; i--) {
                this.onAdd_2(alpha[i]);
                
            }
            this.update();
        }
  
    }
    public onAdd = (al?: ProvenanceNode) => {
        let slideDeck = this._slideDeck;
        let node: ProvenanceNode;
        if(al === undefined)
            node = slideDeck.graph.current;
        else
            node = al;
        
            
        // Check if there is an existing slide with the same node
        const existingSlide = slideDeck.slides.find(slide => slide.node === node);

        if (!existingSlide) {
            // If there is no existing slide with the same node, create and add a new slide
            const slide = new ProvenanceSlide(node.label, 1000, 1000, [], node);
            slideDeck.addSlide(slide, slideDeck.slides.length);
            node.metadata.bookmarked = true;
            // node.metadata.H_value+=70000;
            slideDeck.graph.emitNodeChangedEvent(node);

            this.selectSlide(slide);
        }
    }
    private onAdd_2 = (al?: ProvenanceNode) => {
        let slideDeck = this._slideDeck;
        let node: ProvenanceNode;
        if(al === undefined)
            node = slideDeck.graph.current;
        else
            node = al;
        
            
        // Check if there is an existing slide with the same node
        const existingSlide = slideDeck.slides.find(slide => slide.node === node);

        if (!existingSlide) {
            // If there is no existing slide with the same node, create and add a new slide
            const slide = new ProvenanceSlide(node.label, 1000, 1000, [], node);
            slideDeck.addSlide(slide, slideDeck.slides.length);
            node.metadata.bookmarked = true;
            this.selectSlide(null);
        }
    }
    private onClone = (slide: IProvenanceSlide) => {
        let slideDeck = this._slideDeck;
        const cloneSlide = new ProvenanceSlide(
            slide.name,
            2000,
            0,
            [],
            slide.node
        );
        // cloneSlide.mainAnnotation = slide.mainAnnotation;
        slideDeck.addSlide(
            cloneSlide,
            slideDeck.selectedSlide
                ? slideDeck.slides.indexOf(slideDeck.selectedSlide) + 1
                : slideDeck.slides.length
        );
    }

    private moveDragStarted(draggedObject: any) {
        d3.select<any, any>(this).classed("active", true);
    }

    private moveDragged = (that: any, draggedObject: any) => {
        d3.select<any, any>(that).attr(
            "transform",
            (slide: IProvenanceSlide) => {
                const originalX =
                    this.previousSlidesWidth(slide) - this._timelineShift;
                const draggedX = d3.event.x;
                const myIndex = this._slideDeck.slides.indexOf(slide);

                if (draggedX < originalX && myIndex > 0) {
                    // check upwards
                    const previousSlide = this._slideDeck.slides[myIndex - 1];
                    let previousSlideCenterY =
                        this.previousSlidesWidth(previousSlide) -
                        this._timelineShift +
                        this.barTotalWidth(previousSlide) / 2;

                    if (draggedX < previousSlideCenterY) {
                        this._slideDeck.moveSlide(myIndex, myIndex - 1);
                    }
                } else if (
                    draggedX > originalX &&
                    myIndex < this._slideDeck.slides.length - 1
                ) {
                    // check downwards
                    const nextSlide = this._slideDeck.slides[myIndex + 1];
                    let nextSlideCenterY =
                        this.previousSlidesWidth(nextSlide) -
                        this._timelineShift +
                        this.barTotalWidth(nextSlide) / 2;

                    if (draggedX > nextSlideCenterY) {
                        this._slideDeck.moveSlide(myIndex, myIndex + 1);
                    }
                }

                if (this._draggedSlideReAdjustmentFactor === 0) {
                    this._draggedSlideReAdjustmentFactor =
                        draggedX - slide.xPosition;
                }
                let slidePosition =
                    d3.event.x -
                    this._draggedSlideReAdjustmentFactor -
                    this._timelineShift;
                return "translate(" + slidePosition + ", 0)";
            }
        );
    }

    private moveDragended = (that: any, draggedObject: any) => {
        d3.select<any, any>(that)
            .classed("active", false)
            .attr("transform", (slide: IProvenanceSlide) => {
                return (
                    "translate(" +
                    (this.previousSlidesWidth(slide) +
                        50 +
                        this._resizebarwidth -
                        this._timelineShift) +
                    ", 0)"
                );
            });
        this._draggedSlideReAdjustmentFactor = 0;
    }

    private transitionTimeDragged = (that: any, slide: IProvenanceSlide) => {
        let transitionTime =
            Math.max(d3.event.x, 0) / this._barWidthTimeMultiplier;
        slide.transitionTime = this.getSnappedTime(slide, transitionTime, 0);
        this.update();
    }

    private transitionTimeSubject = (that: any, slide: IProvenanceSlide) => {
        return { x: this.barTransitionTimeWidth(slide) };
    }

    private durationDragged = (that: any, slide: IProvenanceSlide) => {
        let duration = Math.max(
            Math.max(d3.event.x, 0) / this._barWidthTimeMultiplier,
            this._minimumSlideDuration
        );
        slide.duration = this.getSnappedTime(slide, duration, 1);
        this.update();
    }

    private durationSubject = (that: any, slide: IProvenanceSlide) => {
        return { x: this.barDurationWidth(slide) };
    }

    private getSnappedTime = (
        slide: IProvenanceSlide,
        time: number,
        isDuration: number
    ) => {
        if (this._gridSnap) {
            let currentTime =
                this._slideDeck.startTime(slide) +
                slide.transitionTime * isDuration +
                time;
            let remainder = currentTime % this._gridTimeStep;
            if (remainder > this._gridTimeStep / 2) {
                return time + this._gridTimeStep - remainder;
            } else {
                return time - remainder;
            }
        }
        return time;
    }
    private barTransitionTimeWidth(slide: IProvenanceSlide) {
        let calculatedWidth =
            this._barWidthTimeMultiplier * slide.transitionTime;
        return Math.max(calculatedWidth, 0);
    }

    private barDurationWidth(slide: IProvenanceSlide) {
        let calculatedWidth = this._barWidthTimeMultiplier * slide.duration;
        return Math.max(
            calculatedWidth,
            this._minimumSlideDuration * this._barWidthTimeMultiplier
        );
    }

    private barTotalWidth(slide: IProvenanceSlide) {
        let calculatedWidth =
            this.barTransitionTimeWidth(slide) + this.barDurationWidth(slide);

        return calculatedWidth;
    }

    private previousSlidesWidth(slide: IProvenanceSlide) {
        let myIndex = this._slideDeck.slides.indexOf(slide);
        let calculatedWidth = 0;

        for (let i = 0; i < myIndex; i++) {
            calculatedWidth += this.barTotalWidth(this._slideDeck.slides[i]);
        }

        return calculatedWidth;
    }

    private updateTimeIndices(slideDeck: IProvenanceSlidedeck) {
        this._timeIndexedSlides = [];
        let timeIndex = 0;
        slideDeck.slides.forEach((slide: any) => {
            this._timeIndexedSlides.push({
                slide: slide,
                startTime: timeIndex
            });
            timeIndex += slide.transitionTime + slide.duration;
        });
    }

    private rescaleTimeline = () => {
        let wheelDirection = d3.event.deltaY < 0 ? "up" : "down";
        if (d3.event.shiftKey) {
            let correctedShiftAmount =
                d3.event.x - (this._originPosition - this._timelineShift);
            if (wheelDirection === "down") {
                let scalingFactor = 0.2;
                if (this._placeholderX > this._tableWidth / 2) {
                    this._barWidthTimeMultiplier *= 1 - scalingFactor;
                    this._timelineShift -= correctedShiftAmount * scalingFactor;
                }
            } else {
                let scalingFactor = 0.25;
                this._barWidthTimeMultiplier *= 1 + scalingFactor;
                if (!(this._placeholderX - this._timelineShift < d3.event.x)) {
                    this._timelineShift += correctedShiftAmount * scalingFactor;
                }
            }
            this.adjustGridScale();
        } else {
            let shiftAmount = 100;
            if (wheelDirection === "down") {
                this._timelineShift += shiftAmount;
            } else {
                this._timelineShift -= shiftAmount;
            }
        }
        this.update();
    }

    private onBackward = () => {
        if(this._currentlyPlaying)
            this.stopPlaying();
        if (!this._currentlyPlaying) {
            for (let i = this._timeIndexedSlides.length - 1; i >= 0; i--) {
                if (this._currentTime > this._timeIndexedSlides[i].startTime) {
                    this._currentTime = this._timeIndexedSlides[i].startTime;
                    this.selectSlide(this._slideDeck.slideAtTime(this._currentTime));
                    this.update();
                    break;
                }
            }
        }
    }

    private playTimeline() {
        let intervalStepMS = 25;
      
        const playNextStep = () => {
          if (!this._currentlyPlaying) {
            return;
          }
      
          this._currentTime += intervalStepMS;
          let currentSlide = this._slideDeck.slideAtTime(this._currentTime);
      
          if (currentSlide !== this._slideDeck.selectedSlide) {
            this.selectSlide(currentSlide);
          }
      
          this.update();
      
          setTimeout(playNextStep, intervalStepMS);
        };
      
        setTimeout(playNextStep, intervalStepMS);
      }

      private onPlay = () => {
        if (this._currentlyPlaying) {
            this.stopPlaying();
        } else {
            this.startPlaying();
        }
    }
    
    private startPlaying = () => {
        d3.select(".player_play")
            .select("i")
            .attr("class", "fa fa-pause");
        this._currentlyPlaying = true;
        this.playTimeline();
    }
    
    private stopPlaying = () => {
        d3.select(".player_play")
            .select("i")
            .attr("class", "fa fa-play");
        this._currentlyPlaying = false;
    }
    
    private onForward = () => {
        if(this._currentlyPlaying)
            this.stopPlaying();
        if (!this._currentlyPlaying) {
            for (let timedSlide of this._timeIndexedSlides) {
                if (this._currentTime < timedSlide.startTime) {
                    this._currentTime = timedSlide.startTime;
                    this.selectSlide(this._slideDeck.slideAtTime(this._currentTime));
                    this.update();
                    break;
                }
            }
        }
    }

    private seekStarted = (that: any) => {
        if (this._currentlyPlaying) {
            this.stopPlaying();
        }
        this._currentTime =
            (d3.event.x - this._originPosition + this._timelineShift) /
            this._barWidthTimeMultiplier;
        this.update();
    }

    private seekDragged = (that: any) => {
        this._currentTime =
            (d3.event.x + this._timelineShift - this._originPosition) /
            this._barWidthTimeMultiplier;
        this.update();
    }

    private resizeTable() {
        this._tableWidth = window.innerWidth - 400;
        d3.select(".slide__table").attr("width", this._tableWidth);
        d3.select(".slides_background_rect").attr("width", this._tableWidth);
    }

    private adjustGridScale() {
        if (this._barWidthTimeMultiplier < 0.02) {
            this._gridTimeStep = 1000;
            return;
        }
        if (this._barWidthTimeMultiplier < 0.2) {
            this._gridTimeStep = 1000;
            return;
        }
        this._gridTimeStep = 200;
    }

    private drawGrid(maxWidth: number) {
        this._slideTable.selectAll("circle.gridTime").remove();
        let time = 0;
        let currentX =
            this._originPosition +
            time * this._barWidthTimeMultiplier -
            this._timelineShift;

        while (currentX < maxWidth) {
            let radius = time % (this._gridTimeStep * 5) === 0 ? 4 : 2;
            this._slideTable
                .append("circle")
                .attr("class", "gridTime")
                .attr("fill", "black")
                .attr("r", radius)
                .attr(
                    "cx",
                    this._originPosition +
                        time * this._barWidthTimeMultiplier -
                        this._timelineShift
                )
                .attr("cy", 65);
            time += this._gridTimeStep;
            currentX =
                this._originPosition +
                time * this._barWidthTimeMultiplier -
                this._timelineShift;
        }
        this._slideTable.selectAll("circle.gridTime").lower();
        this._slideTable.select("line.horizontal-line").lower();
    }

    private fixDrawingPriorities = () => {
        this._slideTable
            .select("rect.seek-dragger")
            .attr("width", this._placeholderX)
            .raise();
        this._slideTable.select("rect.mask").raise();
        // this._slideTable.select("#player_placeholder").raise();
        this._slideTable.select("foreignObject.player_backward").raise();
        this._slideTable.select("foreignObject.player_play").raise();
        this._slideTable.select("foreignObject.player_forward").raise();
    }

    private displayGridLevel = () => {
        d3.select("text.grid_display").text(
            "Grid step: " + (this._gridTimeStep / 1000).toFixed(2) + " Sec"
        );
    }

    private drawSeekBar = () => {
        const timeWidth = this._currentTime * this._barWidthTimeMultiplier;

        if (timeWidth >= this._placeholderX) {
            this.stopPlaying();
            this._currentTime =
                this._placeholderX / this._barWidthTimeMultiplier;
        }

        if (this._currentTime < 0) {
            this._currentTime = 0;
        }

        const shiftedPosition =
            this._originPosition + timeWidth - this._timelineShift;
        this._slideTable
            .select("circle.currentTime")
            .attr("cx", shiftedPosition)
            .raise();
        this._slideTable
            .select("line.vertical-line-seek")
            .attr("x1", shiftedPosition)
            .attr("y1", 65)
            .attr("x2", shiftedPosition)
            .attr("y2", 0)
            .raise();
    }
    private adjustHorizontalLine = () => {
        this._slideTable
            .select("line.horizontal-line")
            .attr("x2", this._placeholderX + 60 - this._timelineShift);
    }

    public update() {
        this.updateTimeIndices(this._slideDeck);

        if (this._timelineShift < 0) {
            this._timelineShift = 0;
        }
        const allExistingNodes = this._slideTable
            .selectAll<SVGGElement, IProvenanceSlide>("g.slide")
            .data(this._slideDeck.slides, d => d.id);

        const that = this;

        const newNodes = allExistingNodes
            .enter()
            .append("g")
            .attr("class", "slide");

        newNodes
             .on("click", this.onSelect)
             .call(
            (d3.drag() as any)
                .clickDistance([2, 2])
                // .on("start", this.moveDragStarted)
                .on("drag", firstArgThis(this.moveDragged))
                .on("end", firstArgThis(this.moveDragended))
        );

        /* Rect between 2slides -- lorenzo */
        newNodes
            .append("rect")
            .attr("class", "slides_transitionTime_rect")
            .attr("x", this._resizebarwidth)
            .attr("y", 0)
            .attr("height", 60)
            .on("click", this.onSelect);

        /* Removed slides_delay_resize and slides_delay_rect */
        let slideGroup = newNodes
            .append("g")
            .attr("transform", "translate(5,0)")
            .attr("class", "slide_group")
            .on("mouseenter", this.onMouseEnter)
            .on("mouseleave", this.onMouseLeave);

        slideGroup
            .append("rect")
            .attr("class", "slides_rect")
            .attr(
                "height",
                60
            ) /* removed width = this._barWidth - 2 * this._barPadding */
            .attr("cursor", "move")
            .on("click", this.onSelect); // changes made for single click select --Pushpanjali;

        /* Appnded SVG for text ---Lorenzo */
        slideGroup
            .append("svg")
            .attr("class", "text-viewport")
            .attr("height", 60)
            .append("text") // appended previous slides_text
            .attr("class", "slides_text")
            .attr("y", this._resizebarwidth + 2 * this._barPadding)
            .attr("font-size", 9)
            .attr("dy", ".35em");

        slideGroup
            .append("image")
            .attr("class", "screenshot")
            .attr("opacity", 0.8);

        const textPosition = this._resizebarwidth + 4 * this._barPadding + 68;
        /** Ends Appnded SVG for text ---Lorenzo */
        // TransitionTime Text --Lorenzo
        slideGroup
            .append("text") // removed slides_delaytext
            .attr("class", "slides_transitionTimetext")
            .attr("y", textPosition)
            .attr("font-size", 10)
            .attr("dy", "-.65em");
        // Ends --TransitionTime Text --Lorenzo
        let toolbar = slideGroup.append("g").attr("class", "slide_toolbar");

        toolbar
            .append("svg:foreignObject")
            .attr("class", "slides_delete_icon")
            .attr("cursor", "pointer")
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:body")
            .on("click", this.onDelete)
            .html('<i class="fa fa-trash-o"></i>');

        toolbar
            .append("svg:foreignObject")
            .attr("class", "slides_annotation_icon")
            .attr("cursor", "pointer")
            .attr("width", 20)
            .attr("height", 20)
            .append("xhtml:body")
            .html('<i class="fa fa-font"></i>')
            .on("click", slide => {
                const newAnnotation = new SlideAnnotation<PositionedString>(
                    { x: 0, y: 0, value: "" }
                );
                slide.addAnnotation(newAnnotation);
                that._annotationContainer.add(newAnnotation, true);
            } );

        const placeholder = this._slideTable.select("rect.slides_placeholder");

        newNodes
            .append("text")
            .attr("class", "slides_durationtext")
            .attr("y", textPosition)
            .attr("font-size", 10)
            .attr("dy", "-.65em");

        newNodes
            .append("circle")
            .attr("class", "time")
            .attr("cy", this._resizebarwidth + 60)
            .attr("r", 4)
            .attr("fill", "blue");

        newNodes
            .append("circle")
            .attr("class", "transitionTime_time")
            .attr("cy", this._resizebarwidth + 60)
            .attr("r", 4)
            .attr("fill", "blue");

        newNodes
            .append("rect")
            .attr("class", "slides_duration_resize")
            .attr("x", 0)
            .attr("width", this._resizebarwidth)
            .attr("height", 60)
            .attr("cursor", "ew-resize")
            .call(
                (d3.drag() as any)
                    .subject(firstArgThis(this.durationSubject))
                    .on("drag", firstArgThis(this.durationDragged))
            );

        newNodes
            .append("rect")
            .attr("class", "slides_transitionTime_resize")
            .attr("y", 0)
            .attr("width", this._resizebarwidth)
            .attr("height", 60)
            .attr("cursor", "ew-resize")
            .call(
                (d3.drag() as any)
                    .subject(firstArgThis(this.transitionTimeSubject))
                    .on("drag", firstArgThis(this.transitionTimeDragged))
            );
        d3.select(".slide__table").on("wheel", this.rescaleTimeline);

        // Update all nodes

        const allNodes = newNodes
            .merge(allExistingNodes as any)
            .attr("transform", (slide: IProvenanceSlide) => {
                this._previousSlideX = this.previousSlidesWidth(slide);
                slide.xPosition =
                    50 + this._resizebarwidth + this.previousSlidesWidth(slide);
                return (
                    "translate(" +
                    (slide.xPosition - this._timelineShift) +
                    ", 0 )"
                );
            });

        allNodes
            .select("image.screenshot")
            .attr("href", d => d.metadata.screenShot)
            .attr("width", (slide: IProvenanceSlide) => {
                this._placeholderX =
                    this._previousSlideX +
                    this.barDurationWidth(slide) +
                    this.barTransitionTimeWidth(slide);
                return this.barDurationWidth(slide);
            })
            .attr("height", 60)
            .attr("x", (slide: IProvenanceSlide) => {
                return this.barTransitionTimeWidth(slide);
            });

        allNodes
            .select("rect.slides_transitionTime_rect")
            .attr("width", (slide: IProvenanceSlide) => {
                return this.barTransitionTimeWidth(slide);
            });

        allNodes
            .select("rect.slides_transitionTime_resize")
            .attr("x", (slide: IProvenanceSlide) => {
                return (
                    this.barTransitionTimeWidth(slide) + this._resizebarwidth
                );
            });

        slideGroup = allNodes.select("g.slide_group");
        slideGroup
            .select("rect.slides_rect")
            .attr("fill", (slide: IProvenanceSlide, i) => {
                const color = this._colorScale(i.toString());
                if (slide.node) {
                    slide.node.metadata.bgColor = color;
                }
                return color;
            })
            .attr("selected", (slide: IProvenanceSlide) => {
                return this._slideDeck.selectedSlide === slide;
            })
            .attr("x", (slide: IProvenanceSlide) => {
                return this.barTransitionTimeWidth(slide);
            })
            .attr("width", (slide: IProvenanceSlide) => {
                this._placeholderX =
                    this._previousSlideX +
                    this.barDurationWidth(slide) +
                    this.barTransitionTimeWidth(slide);
                return this.barDurationWidth(slide);
            });

        slideGroup
            .select("svg.text-viewport")
            .attr("x", (slide: IProvenanceSlide) => {
                return this.barTransitionTimeWidth(slide);
            })
            .attr("width", (slide: IProvenanceSlide) => {
                return this.barDurationWidth(slide) - 5;
            });

        toolbar = allNodes.select("g.slide_toolbar");

        toolbar
            .select("foreignObject.slides_delete_icon")
            .attr("y", (slide: IProvenanceSlide) => {
                return this._toolbarY;
            })
            .attr("x", (slide: IProvenanceSlide) => {
                return this._toolbarX + this.barTransitionTimeWidth(slide) - 3;
            });

        toolbar
            .select("foreignObject.slides_annotation_icon")
            .attr("y", (slide: IProvenanceSlide) => {
                return this._toolbarY;
            })
            .attr("x", (slide: IProvenanceSlide) => {
                return (
                    this._toolbarX +
                    this._toolbarPadding +
                    this.barTransitionTimeWidth(slide) -
                    3
                );
            });

        slideGroup
            .select("text.slides_text")
            .attr("x", (slide: IProvenanceSlide) => {
                return this._barPadding * 2 - 2;
            })
            .text((slide: IProvenanceSlide) => {
                return slide.name;
            });

        slideGroup
            .select("text.slides_transitionTimetext")
            .attr("x", (slide: IProvenanceSlide) => {
                return (
                    this.barTransitionTimeWidth(slide) + this._barPadding * 2
                );
            })
            .text((slide: IProvenanceSlide) => {
                if (
                    this.barTransitionTimeWidth(slide) > 35 ||
                    this._slideDeck.startTime(slide) === 0
                ) {
                    return (
                        (this._slideDeck.startTime(slide) +
                            slide.transitionTime) /
                        1000
                    ).toFixed(2);
                } else {
                    return "";
                }
            });

        allNodes.select("circle.time").attr("cx", (slide: IProvenanceSlide) => {
            return this.barTotalWidth(slide) + this._resizebarwidth;
        });

        allNodes
            .select("circle.transitionTime_time")
            .attr("cx", (slide: IProvenanceSlide) => {
                return (
                    this.barTransitionTimeWidth(slide) + this._resizebarwidth
                );
            });

        allNodes
            .select("rect.slides_duration_resize")
            .attr("x", (slide: IProvenanceSlide) => {
                return this.barTotalWidth(slide);
            });

        allNodes
            .select("text.slides_durationtext")
            .attr("x", (slide: IProvenanceSlide) => {
                return this.barTotalWidth(slide) + this._barPadding + 10;
            })
            .text((slide: IProvenanceSlide) => {
                return (
                    (this._slideDeck.startTime(slide) +
                        slide.duration +
                        slide.transitionTime) /
                    1000
                ).toFixed(2);
            });

        placeholder.attr("x", this._placeholderX + 80 - this._timelineShift);

        this.adjustHorizontalLine();

        // this.adjustSlideAddObjectPosition();

        this.drawSeekBar();

        this.drawGrid(
            this._placeholderX + this._originPosition - this._timelineShift
        );

        this.fixDrawingPriorities();

        allExistingNodes.exit().remove();
    }

    
}
