import { Component, ViewChild, Input, Output, EventEmitter, ChangeDetectionStrategy, HostBinding, ViewEncapsulation } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime, filter, publish } from 'rxjs/operators';
import { utils } from './utils/utils';
import { GridsterService } from './gridster.service';
import { GridsterOptions } from './GridsterOptions';
import * as i0 from "@angular/core";
import * as i1 from "./gridster.service";
import * as i2 from "./gridster-prototype/gridster-prototype.service";
export class GridsterComponent {
    constructor(zone, elementRef, gridster, gridsterPrototype) {
        this.zone = zone;
        this.gridsterPrototype = gridsterPrototype;
        this.optionsChange = new EventEmitter();
        this.ready = new EventEmitter();
        this.reflow = new EventEmitter();
        this.prototypeDrop = new EventEmitter();
        this.prototypeEnter = new EventEmitter();
        this.prototypeOut = new EventEmitter();
        this.draggableOptions = {};
        this.isDragging = false;
        this.isResizing = false;
        this.isReady = false;
        this.isPrototypeEntered = false;
        this.isDisabled = false;
        this.subscription = new Subscription();
        this.gridster = gridster;
        this.$element = elementRef.nativeElement;
    }
    ngOnInit() {
        this.gridsterOptions = new GridsterOptions(this.options, this.$element);
        if (this.options.useCSSTransforms) {
            this.$element.classList.add('css-transform');
        }
        this.subscription.add(this.gridsterOptions.change.subscribe(options => {
            this.gridster.options = options;
            if (this.gridster.gridList) {
                this.gridster.gridList.options = options;
            }
            setTimeout(() => this.optionsChange.emit(options));
        }));
        this.gridster.init(this);
        this.subscription.add(fromEvent(window, 'resize')
            .pipe(debounceTime(this.gridster.options.responsiveDebounce || 0), filter(() => this.gridster.options.responsiveView))
            .subscribe(() => this.reload()));
        this.zone.runOutsideAngular(() => {
            this.subscription.add(fromEvent(document, 'scroll', { passive: true }).subscribe(() => this.updateGridsterElementData()));
            const scrollableContainer = utils.getScrollableContainer(this.$element);
            if (scrollableContainer) {
                this.subscription.add(fromEvent(scrollableContainer, 'scroll', { passive: true })
                    .subscribe(() => this.updateGridsterElementData()));
            }
        });
    }
    ngAfterContentInit() {
        this.gridster.start();
        this.updateGridsterElementData();
        this.connectGridsterPrototype();
        this.gridster.$positionHighlight = this.$positionHighlight.nativeElement;
    }
    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
    /**
     * Change gridster config option and rebuild
     * @param string name
     * @param any value
     * @return GridsterComponent
     */
    setOption(name, value) {
        if (name === 'dragAndDrop') {
            if (value) {
                this.enableDraggable();
            }
            else {
                this.disableDraggable();
            }
        }
        if (name === 'resizable') {
            if (value) {
                this.enableResizable();
            }
            else {
                this.disableResizable();
            }
        }
        if (name === 'lanes') {
            this.gridster.options.lanes = value;
            this.gridster.gridList.fixItemsPositions(this.gridster.options);
            this.reflowGridster();
        }
        if (name === 'direction') {
            this.gridster.options.direction = value;
            this.gridster.gridList.pullItemsToLeft();
        }
        if (name === 'widthHeightRatio') {
            this.gridster.options.widthHeightRatio = parseFloat(value || 1);
        }
        if (name === 'responsiveView') {
            this.gridster.options.responsiveView = !!value;
        }
        this.gridster.gridList.setOption(name, value);
        return this;
    }
    reload() {
        setTimeout(() => {
            this.gridster.fixItemsPositions();
            this.reflowGridster();
        });
        return this;
    }
    reflowGridster(isInit = false) {
        this.gridster.reflow();
        this.reflow.emit({
            isInit: isInit,
            gridsterComponent: this
        });
    }
    updateGridsterElementData() {
        this.gridster.gridsterScrollData = this.getScrollPositionFromParents(this.$element);
        this.gridster.gridsterRect = this.$element.getBoundingClientRect();
    }
    setReady() {
        setTimeout(() => (this.isReady = true));
        this.ready.emit();
    }
    adjustItemsHeightToContent(scrollableItemElementSelector = '.gridster-item-inner') {
        this.gridster.items
            // convert each item to object with information about content height and scroll height
            .map((item) => {
            const scrollEl = item.$element.querySelector(scrollableItemElementSelector);
            const contentEl = scrollEl.lastElementChild;
            const scrollElDistance = utils.getRelativeCoordinates(scrollEl, item.$element);
            const scrollElRect = scrollEl.getBoundingClientRect();
            const contentRect = contentEl.getBoundingClientRect();
            return {
                item,
                contentHeight: contentRect.bottom - scrollElRect.top,
                scrollElDistance
            };
        })
            // calculate required height in lanes amount and update item "h"
            .forEach(data => {
            data.item.h = Math.ceil(((data.contentHeight /
                (this.gridster.cellHeight - data.scrollElDistance.top))));
        });
        this.gridster.fixItemsPositions();
        this.gridster.reflow();
    }
    disable(item) {
        const itemIdx = this.gridster.items.indexOf(item.itemComponent);
        this.isDisabled = true;
        if (itemIdx >= 0) {
            delete this.gridster.items[this.gridster.items.indexOf(item.itemComponent)];
        }
        this.gridster.onDragOut(item);
    }
    enable() {
        this.isDisabled = false;
    }
    getScrollPositionFromParents(element, data = { scrollTop: 0, scrollLeft: 0 }) {
        if (element.parentElement && element.parentElement !== document.body) {
            data.scrollTop += element.parentElement.scrollTop;
            data.scrollLeft += element.parentElement.scrollLeft;
            return this.getScrollPositionFromParents(element.parentElement, data);
        }
        return {
            scrollTop: data.scrollTop,
            scrollLeft: data.scrollLeft
        };
    }
    /**
     * Connect gridster prototype item to gridster dragging hooks (onStart, onDrag, onStop).
     */
    connectGridsterPrototype() {
        this.gridsterPrototype.observeDropOut(this.gridster).subscribe();
        const dropOverObservable = (this.gridsterPrototype
            .observeDropOver(this.gridster)
            .pipe(publish()));
        const dragObservable = this.gridsterPrototype.observeDragOver(this.gridster);
        dragObservable.dragOver
            .pipe(filter(() => !this.isDisabled))
            .subscribe((prototype) => {
            if (!this.isPrototypeEntered) {
                return;
            }
            this.gridster.onDrag(prototype.item);
        });
        dragObservable.dragEnter
            .pipe(filter(() => !this.isDisabled))
            .subscribe((prototype) => {
            this.isPrototypeEntered = true;
            if (this.gridster.items.indexOf(prototype.item) < 0) {
                this.gridster.items.push(prototype.item);
            }
            this.gridster.onStart(prototype.item);
            prototype.setDragContextGridster(this.gridster);
            if (this.parent) {
                this.parent.disable(prototype.item);
            }
            this.prototypeEnter.emit({ item: prototype.item });
        });
        dragObservable.dragOut
            .pipe(filter(() => !this.isDisabled))
            .subscribe((prototype) => {
            if (!this.isPrototypeEntered) {
                return;
            }
            this.gridster.onDragOut(prototype.item);
            this.isPrototypeEntered = false;
            this.prototypeOut.emit({ item: prototype.item });
            if (this.parent) {
                this.parent.enable();
                this.parent.isPrototypeEntered = true;
                if (this.parent.gridster.items.indexOf(prototype.item) < 0) {
                    this.parent.gridster.items.push(prototype.item);
                }
                this.parent.gridster.onStart(prototype.item);
                prototype.setDragContextGridster(this.parent.gridster);
                // timeout is needed to be sure that "enter" event is fired after "out"
                setTimeout(() => {
                    this.parent.prototypeEnter.emit({
                        item: prototype.item
                    });
                    prototype.onEnter(this.parent.gridster);
                });
            }
        });
        dropOverObservable
            .pipe(filter(() => !this.isDisabled))
            .subscribe(data => {
            if (!this.isPrototypeEntered) {
                return;
            }
            this.gridster.onStop(data.item.item);
            this.gridster.removeItem(data.item.item);
            this.isPrototypeEntered = false;
            if (this.parent) {
                this.parent.enable();
            }
            this.prototypeDrop.emit({ item: data.item.item });
        });
        dropOverObservable.connect();
    }
    enableDraggable() {
        this.gridster.options.dragAndDrop = true;
        this.gridster.items
            .filter(item => item.itemComponent && item.itemComponent.dragAndDrop)
            .forEach((item) => item.itemComponent.enableDragDrop());
    }
    disableDraggable() {
        this.gridster.options.dragAndDrop = false;
        this.gridster.items
            .filter(item => item.itemComponent)
            .forEach((item) => item.itemComponent.disableDraggable());
    }
    enableResizable() {
        this.gridster.options.resizable = true;
        this.gridster.items
            .filter(item => item.itemComponent && item.itemComponent.resizable)
            .forEach((item) => item.itemComponent.enableResizable());
    }
    disableResizable() {
        this.gridster.options.resizable = false;
        this.gridster.items.forEach((item) => item.itemComponent.disableResizable());
    }
}
GridsterComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterComponent, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: i1.GridsterService }, { token: i2.GridsterPrototypeService }], target: i0.ɵɵFactoryTarget.Component });
GridsterComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.7", type: GridsterComponent, selector: "ngx-gridster", inputs: { options: "options", draggableOptions: "draggableOptions", parent: "parent" }, outputs: { optionsChange: "optionsChange", ready: "ready", reflow: "reflow", prototypeDrop: "prototypeDrop", prototypeEnter: "prototypeEnter", prototypeOut: "prototypeOut" }, host: { properties: { "class.gridster--dragging": "this.isDragging", "class.gridster--resizing": "this.isResizing", "class.gridster--ready": "this.isReady" } }, providers: [GridsterService], viewQueries: [{ propertyName: "$positionHighlight", first: true, predicate: ["positionHighlight"], descendants: true, static: true }], ngImport: i0, template: `<div class="gridster-container">
      <ng-content></ng-content>
      <div class="position-highlight" style="display:none;" #positionHighlight>
        <div class="inner"></div>
      </div>
    </div>`, isInline: true, styles: ["ngx-gridster{position:relative;display:block;left:0;width:100%}ngx-gridster.gridster--dragging{-moz-user-select:none;-webkit-user-select:none;user-select:none}ngx-gridster .gridster-container{position:relative;width:100%;list-style:none;transition:width .2s,height .2s}ngx-gridster .position-highlight{display:block;position:absolute;z-index:1}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-gridster', template: `<div class="gridster-container">
      <ng-content></ng-content>
      <div class="position-highlight" style="display:none;" #positionHighlight>
        <div class="inner"></div>
      </div>
    </div>`, providers: [GridsterService], changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: ["ngx-gridster{position:relative;display:block;left:0;width:100%}ngx-gridster.gridster--dragging{-moz-user-select:none;-webkit-user-select:none;user-select:none}ngx-gridster .gridster-container{position:relative;width:100%;list-style:none;transition:width .2s,height .2s}ngx-gridster .position-highlight{display:block;position:absolute;z-index:1}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: i1.GridsterService }, { type: i2.GridsterPrototypeService }]; }, propDecorators: { options: [{
                type: Input
            }], optionsChange: [{
                type: Output
            }], ready: [{
                type: Output
            }], reflow: [{
                type: Output
            }], prototypeDrop: [{
                type: Output
            }], prototypeEnter: [{
                type: Output
            }], prototypeOut: [{
                type: Output
            }], draggableOptions: [{
                type: Input
            }], parent: [{
                type: Input
            }], $positionHighlight: [{
                type: ViewChild,
                args: ['positionHighlight', { static: true }]
            }], isDragging: [{
                type: HostBinding,
                args: ['class.gridster--dragging']
            }], isResizing: [{
                type: HostBinding,
                args: ['class.gridster--resizing']
            }], isReady: [{
                type: HostBinding,
                args: ['class.gridster--ready']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhcjJncmlkc3Rlci9zcmMvbGliL2dyaWRzdGVyLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0gsU0FBUyxFQUtULFNBQVMsRUFFVCxLQUFLLEVBQ0wsTUFBTSxFQUNOLFlBQVksRUFDWix1QkFBdUIsRUFDdkIsV0FBVyxFQUNYLGlCQUFpQixFQUNwQixNQUFNLGVBQWUsQ0FBQztBQUN2QixPQUFPLEVBRUgsWUFBWSxFQUNaLFNBQVMsRUFFWixNQUFNLE1BQU0sQ0FBQztBQUNkLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRS9ELE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDdEMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBTXJELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQzs7OztBQThDcEQsTUFBTSxPQUFPLGlCQUFpQjtJQXdCMUIsWUFDWSxJQUFZLEVBQ3BCLFVBQXNCLEVBQ3RCLFFBQXlCLEVBQ2pCLGlCQUEyQztRQUgzQyxTQUFJLEdBQUosSUFBSSxDQUFRO1FBR1osc0JBQWlCLEdBQWpCLGlCQUFpQixDQUEwQjtRQTFCN0Msa0JBQWEsR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ3hDLFVBQUssR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ2hDLFdBQU0sR0FBRyxJQUFJLFlBQVksRUFBTyxDQUFDO1FBQ2pDLGtCQUFhLEdBQUcsSUFBSSxZQUFZLEVBQTBCLENBQUM7UUFDM0QsbUJBQWMsR0FBRyxJQUFJLFlBQVksRUFBMEIsQ0FBQztRQUM1RCxpQkFBWSxHQUFHLElBQUksWUFBWSxFQUEwQixDQUFDO1FBQzNELHFCQUFnQixHQUE4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Q0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBa0IsRUFBRSxFQUFFLENBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FDeEMsQ0FBQztJQUNOLENBQUM7OzhHQWhYUSxpQkFBaUI7a0dBQWpCLGlCQUFpQiwrY0FKZixDQUFDLGVBQWUsQ0FBQyxpS0F0Q2xCOzs7OztXQUtIOzJGQXFDRSxpQkFBaUI7a0JBNUM3QixTQUFTOytCQUNJLGNBQWMsWUFDZDs7Ozs7V0FLSCxhQWlDSSxDQUFDLGVBQWUsQ0FBQyxtQkFDWCx1QkFBdUIsQ0FBQyxNQUFNLGlCQUNoQyxpQkFBaUIsQ0FBQyxJQUFJOzJMQUc1QixPQUFPO3NCQUFmLEtBQUs7Z0JBQ0ksYUFBYTtzQkFBdEIsTUFBTTtnQkFDRyxLQUFLO3NCQUFkLE1BQU07Z0JBQ0csTUFBTTtzQkFBZixNQUFNO2dCQUNHLGFBQWE7c0JBQXRCLE1BQU07Z0JBQ0csY0FBYztzQkFBdkIsTUFBTTtnQkFDRyxZQUFZO3NCQUFyQixNQUFNO2dCQUNFLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxNQUFNO3NCQUFkLEtBQUs7Z0JBRTRDLGtCQUFrQjtzQkFBbkUsU0FBUzt1QkFBQyxtQkFBbUIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUU7Z0JBQ1AsVUFBVTtzQkFBbEQsV0FBVzt1QkFBQywwQkFBMEI7Z0JBQ0UsVUFBVTtzQkFBbEQsV0FBVzt1QkFBQywwQkFBMEI7Z0JBRUQsT0FBTztzQkFBNUMsV0FBVzt1QkFBQyx1QkFBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIENvbXBvbmVudCxcbiAgICBPbkluaXQsXG4gICAgQWZ0ZXJDb250ZW50SW5pdCxcbiAgICBPbkRlc3Ryb3ksXG4gICAgRWxlbWVudFJlZixcbiAgICBWaWV3Q2hpbGQsXG4gICAgTmdab25lLFxuICAgIElucHV0LFxuICAgIE91dHB1dCxcbiAgICBFdmVudEVtaXR0ZXIsXG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gICAgSG9zdEJpbmRpbmcsXG4gICAgVmlld0VuY2Fwc3VsYXRpb25cbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICAgIE9ic2VydmFibGUsXG4gICAgU3Vic2NyaXB0aW9uLFxuICAgIGZyb21FdmVudCxcbiAgICBDb25uZWN0YWJsZU9ic2VydmFibGVcbn0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUsIGZpbHRlciwgcHVibGlzaCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHsgdXRpbHMgfSBmcm9tICcuL3V0aWxzL3V0aWxzJztcbmltcG9ydCB7IEdyaWRzdGVyU2VydmljZSB9IGZyb20gJy4vZ3JpZHN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBJR3JpZHN0ZXJPcHRpb25zIH0gZnJvbSAnLi9JR3JpZHN0ZXJPcHRpb25zJztcbmltcG9ydCB7IElHcmlkc3RlckRyYWdnYWJsZU9wdGlvbnMgfSBmcm9tICcuL0lHcmlkc3RlckRyYWdnYWJsZU9wdGlvbnMnO1xuaW1wb3J0IHsgR3JpZHN0ZXJQcm90b3R5cGVTZXJ2aWNlIH0gZnJvbSAnLi9ncmlkc3Rlci1wcm90b3R5cGUvZ3JpZHN0ZXItcHJvdG90eXBlLnNlcnZpY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlIH0gZnJvbSAnLi9ncmlkc3Rlci1wcm90b3R5cGUvZ3JpZHN0ZXItaXRlbS1wcm90b3R5cGUuZGlyZWN0aXZlJztcbmltcG9ydCB7IEdyaWRMaXN0SXRlbSB9IGZyb20gJy4vZ3JpZExpc3QvR3JpZExpc3RJdGVtJztcbmltcG9ydCB7IEdyaWRzdGVyT3B0aW9ucyB9IGZyb20gJy4vR3JpZHN0ZXJPcHRpb25zJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICduZ3gtZ3JpZHN0ZXInLFxuICAgIHRlbXBsYXRlOiBgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWNvbnRhaW5lclwiPlxuICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgICAgPGRpdiBjbGFzcz1cInBvc2l0aW9uLWhpZ2hsaWdodFwiIHN0eWxlPVwiZGlzcGxheTpub25lO1wiICNwb3NpdGlvbkhpZ2hsaWdodD5cbiAgICAgICAgPGRpdiBjbGFzcz1cImlubmVyXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5gLFxuICAgIHN0eWxlczogW1xuICAgICAgICBgXG4gICAgICAgICAgICBuZ3gtZ3JpZHN0ZXIge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgICAgICBsZWZ0OiAwO1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBuZ3gtZ3JpZHN0ZXIuZ3JpZHN0ZXItLWRyYWdnaW5nIHtcbiAgICAgICAgICAgICAgICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICAgICAgICAgIC1raHRtbC11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgICAgICAgICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xuICAgICAgICAgICAgICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbmd4LWdyaWRzdGVyIC5ncmlkc3Rlci1jb250YWluZXIge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICAgICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgICAgICBsaXN0LXN0eWxlOiBub25lO1xuICAgICAgICAgICAgICAgIC13ZWJraXQtdHJhbnNpdGlvbjogd2lkdGggMC4ycywgaGVpZ2h0IDAuMnM7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggMC4ycywgaGVpZ2h0IDAuMnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5neC1ncmlkc3RlciAucG9zaXRpb24taGlnaGxpZ2h0IHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgICAgICAgei1pbmRleDogMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgYFxuICAgIF0sXG4gICAgcHJvdmlkZXJzOiBbR3JpZHN0ZXJTZXJ2aWNlXSxcbiAgICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXG59KVxuZXhwb3J0IGNsYXNzIEdyaWRzdGVyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBBZnRlckNvbnRlbnRJbml0LCBPbkRlc3Ryb3kge1xuICAgIEBJbnB1dCgpIG9wdGlvbnM6IElHcmlkc3Rlck9wdGlvbnM7XG4gICAgQE91dHB1dCgpIG9wdGlvbnNDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgICBAT3V0cHV0KCkgcmVhZHkgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4oKTtcbiAgICBAT3V0cHV0KCkgcmVmbG93ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KCk7XG4gICAgQE91dHB1dCgpIHByb3RvdHlwZURyb3AgPSBuZXcgRXZlbnRFbWl0dGVyPHsgaXRlbTogR3JpZExpc3RJdGVtIH0+KCk7XG4gICAgQE91dHB1dCgpIHByb3RvdHlwZUVudGVyID0gbmV3IEV2ZW50RW1pdHRlcjx7IGl0ZW06IEdyaWRMaXN0SXRlbSB9PigpO1xuICAgIEBPdXRwdXQoKSBwcm90b3R5cGVPdXQgPSBuZXcgRXZlbnRFbWl0dGVyPHsgaXRlbTogR3JpZExpc3RJdGVtIH0+KCk7XG4gICAgQElucHV0KCkgZHJhZ2dhYmxlT3B0aW9uczogSUdyaWRzdGVyRHJhZ2dhYmxlT3B0aW9ucyA9IHt9O1xuICAgIEBJbnB1dCgpIHBhcmVudDogR3JpZHN0ZXJDb21wb25lbnQ7XG5cbiAgICBAVmlld0NoaWxkKCdwb3NpdGlvbkhpZ2hsaWdodCcsIHsgc3RhdGljOiB0cnVlIH0pICRwb3NpdGlvbkhpZ2hsaWdodDtcbiAgICBASG9zdEJpbmRpbmcoJ2NsYXNzLmdyaWRzdGVyLS1kcmFnZ2luZycpIGlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICBASG9zdEJpbmRpbmcoJ2NsYXNzLmdyaWRzdGVyLS1yZXNpemluZycpIGlzUmVzaXppbmcgPSBmYWxzZTtcblxuICAgIEBIb3N0QmluZGluZygnY2xhc3MuZ3JpZHN0ZXItLXJlYWR5JykgaXNSZWFkeSA9IGZhbHNlO1xuICAgIGdyaWRzdGVyOiBHcmlkc3RlclNlcnZpY2U7XG4gICAgJGVsZW1lbnQ6IEhUTUxFbGVtZW50O1xuXG4gICAgZ3JpZHN0ZXJPcHRpb25zOiBHcmlkc3Rlck9wdGlvbnM7XG4gICAgaXNQcm90b3R5cGVFbnRlcmVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBpc0Rpc2FibGVkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBzdWJzY3JpcHRpb24gPSBuZXcgU3Vic2NyaXB0aW9uKCk7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSB6b25lOiBOZ1pvbmUsXG4gICAgICAgIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgICAgIGdyaWRzdGVyOiBHcmlkc3RlclNlcnZpY2UsXG4gICAgICAgIHByaXZhdGUgZ3JpZHN0ZXJQcm90b3R5cGU6IEdyaWRzdGVyUHJvdG90eXBlU2VydmljZVxuICAgICkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyID0gZ3JpZHN0ZXI7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG4gICAgfVxuXG4gICAgbmdPbkluaXQoKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJPcHRpb25zID0gbmV3IEdyaWRzdGVyT3B0aW9ucyh0aGlzLm9wdGlvbnMsIHRoaXMuJGVsZW1lbnQpO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMudXNlQ1NTVHJhbnNmb3Jtcykge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdjc3MtdHJhbnNmb3JtJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQoXG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyT3B0aW9ucy5jaGFuZ2Uuc3Vic2NyaWJlKG9wdGlvbnMgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuZ3JpZExpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkTGlzdC5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLm9wdGlvbnNDaGFuZ2UuZW1pdChvcHRpb25zKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuaW5pdCh0aGlzKTtcblxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbi5hZGQoXG4gICAgICAgICAgICBmcm9tRXZlbnQod2luZG93LCAncmVzaXplJylcbiAgICAgICAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgICAgICAgZGVib3VuY2VUaW1lKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNwb25zaXZlRGVib3VuY2UgfHwgMCksXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlcigoKSA9PiB0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzcG9uc2l2ZVZpZXcpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZWxvYWQoKSlcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb24uYWRkKFxuICAgICAgICAgICAgICAgIGZyb21FdmVudChkb2N1bWVudCwgJ3Njcm9sbCcsIHsgcGFzc2l2ZTogdHJ1ZSB9KS5zdWJzY3JpYmUoKCkgPT5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVHcmlkc3RlckVsZW1lbnREYXRhKClcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsYWJsZUNvbnRhaW5lciA9IHV0aWxzLmdldFNjcm9sbGFibGVDb250YWluZXIodGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgICBpZiAoc2Nyb2xsYWJsZUNvbnRhaW5lcikge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uLmFkZChcbiAgICAgICAgICAgICAgICAgICAgZnJvbUV2ZW50KHNjcm9sbGFibGVDb250YWluZXIsICdzY3JvbGwnLCB7IHBhc3NpdmU6IHRydWUgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVHcmlkc3RlckVsZW1lbnREYXRhKClcbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG5nQWZ0ZXJDb250ZW50SW5pdCgpIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5zdGFydCgpO1xuXG4gICAgICAgIHRoaXMudXBkYXRlR3JpZHN0ZXJFbGVtZW50RGF0YSgpO1xuXG4gICAgICAgIHRoaXMuY29ubmVjdEdyaWRzdGVyUHJvdG90eXBlKCk7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlci4kcG9zaXRpb25IaWdobGlnaHQgPSB0aGlzLiRwb3NpdGlvbkhpZ2hsaWdodC5uYXRpdmVFbGVtZW50O1xuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoYW5nZSBncmlkc3RlciBjb25maWcgb3B0aW9uIGFuZCByZWJ1aWxkXG4gICAgICogQHBhcmFtIHN0cmluZyBuYW1lXG4gICAgICogQHBhcmFtIGFueSB2YWx1ZVxuICAgICAqIEByZXR1cm4gR3JpZHN0ZXJDb21wb25lbnRcbiAgICAgKi9cbiAgICBzZXRPcHRpb24obmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gICAgICAgIGlmIChuYW1lID09PSAnZHJhZ0FuZERyb3AnKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVuYWJsZURyYWdnYWJsZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVEcmFnZ2FibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PT0gJ3Jlc2l6YWJsZScpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09PSAnbGFuZXMnKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMubGFuZXMgPSB2YWx1ZTtcblxuICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkTGlzdC5maXhJdGVtc1Bvc2l0aW9ucyh0aGlzLmdyaWRzdGVyLm9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy5yZWZsb3dHcmlkc3RlcigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lID09PSAnZGlyZWN0aW9uJykge1xuICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRpcmVjdGlvbiA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkTGlzdC5wdWxsSXRlbXNUb0xlZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobmFtZSA9PT0gJ3dpZHRoSGVpZ2h0UmF0aW8nKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMud2lkdGhIZWlnaHRSYXRpbyA9IHBhcnNlRmxvYXQodmFsdWUgfHwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5hbWUgPT09ICdyZXNwb25zaXZlVmlldycpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5yZXNwb25zaXZlVmlldyA9ICEhdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkTGlzdC5zZXRPcHRpb24obmFtZSwgdmFsdWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlbG9hZCgpIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLmZpeEl0ZW1zUG9zaXRpb25zKCk7XG4gICAgICAgICAgICB0aGlzLnJlZmxvd0dyaWRzdGVyKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZmxvd0dyaWRzdGVyKGlzSW5pdCA9IGZhbHNlKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucmVmbG93KCk7XG4gICAgICAgIHRoaXMucmVmbG93LmVtaXQoe1xuICAgICAgICAgICAgaXNJbml0OiBpc0luaXQsXG4gICAgICAgICAgICBncmlkc3RlckNvbXBvbmVudDogdGhpc1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1cGRhdGVHcmlkc3RlckVsZW1lbnREYXRhKCkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyU2Nyb2xsRGF0YSA9IHRoaXMuZ2V0U2Nyb2xsUG9zaXRpb25Gcm9tUGFyZW50cyhcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnRcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkc3RlclJlY3QgPSB0aGlzLiRlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIH1cblxuICAgIHNldFJlYWR5KCkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+ICh0aGlzLmlzUmVhZHkgPSB0cnVlKSk7XG4gICAgICAgIHRoaXMucmVhZHkuZW1pdCgpO1xuICAgIH1cblxuICAgIGFkanVzdEl0ZW1zSGVpZ2h0VG9Db250ZW50KFxuICAgICAgICBzY3JvbGxhYmxlSXRlbUVsZW1lbnRTZWxlY3Rvcjogc3RyaW5nID0gJy5ncmlkc3Rlci1pdGVtLWlubmVyJ1xuICAgICkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLml0ZW1zXG4gICAgICAgICAgICAvLyBjb252ZXJ0IGVhY2ggaXRlbSB0byBvYmplY3Qgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCBjb250ZW50IGhlaWdodCBhbmQgc2Nyb2xsIGhlaWdodFxuICAgICAgICAgICAgLm1hcCgoaXRlbTogR3JpZExpc3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsRWwgPSBpdGVtLiRlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgIHNjcm9sbGFibGVJdGVtRWxlbWVudFNlbGVjdG9yXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50RWwgPSBzY3JvbGxFbC5sYXN0RWxlbWVudENoaWxkO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbEVsRGlzdGFuY2UgPSB1dGlscy5nZXRSZWxhdGl2ZUNvb3JkaW5hdGVzKFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbCxcbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWxlbWVudFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsRWxSZWN0ID0gc2Nyb2xsRWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudFJlY3QgPSBjb250ZW50RWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50SGVpZ2h0OiBjb250ZW50UmVjdC5ib3R0b20gLSBzY3JvbGxFbFJlY3QudG9wLFxuICAgICAgICAgICAgICAgICAgICBzY3JvbGxFbERpc3RhbmNlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyBjYWxjdWxhdGUgcmVxdWlyZWQgaGVpZ2h0IGluIGxhbmVzIGFtb3VudCBhbmQgdXBkYXRlIGl0ZW0gXCJoXCJcbiAgICAgICAgICAgIC5mb3JFYWNoKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIGRhdGEuaXRlbS5oID0gTWF0aC5jZWlsKDxhbnk+KFxuICAgICAgICAgICAgICAgICAgICAoZGF0YS5jb250ZW50SGVpZ2h0IC9cbiAgICAgICAgICAgICAgICAgICAgICAgICh0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQgLSBkYXRhLnNjcm9sbEVsRGlzdGFuY2UudG9wKSlcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuZml4SXRlbXNQb3NpdGlvbnMoKTtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5yZWZsb3coKTtcbiAgICB9XG5cbiAgICBkaXNhYmxlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgaXRlbUlkeCA9IHRoaXMuZ3JpZHN0ZXIuaXRlbXMuaW5kZXhPZihpdGVtLml0ZW1Db21wb25lbnQpO1xuXG4gICAgICAgIHRoaXMuaXNEaXNhYmxlZCA9IHRydWU7XG4gICAgICAgIGlmIChpdGVtSWR4ID49IDApIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmdyaWRzdGVyLml0ZW1zW1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuaXRlbXMuaW5kZXhPZihpdGVtLml0ZW1Db21wb25lbnQpXG4gICAgICAgICAgICBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIub25EcmFnT3V0KGl0ZW0pO1xuICAgIH1cblxuICAgIGVuYWJsZSgpIHtcbiAgICAgICAgdGhpcy5pc0Rpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRTY3JvbGxQb3NpdGlvbkZyb21QYXJlbnRzKFxuICAgICAgICBlbGVtZW50OiBFbGVtZW50LFxuICAgICAgICBkYXRhID0geyBzY3JvbGxUb3A6IDAsIHNjcm9sbExlZnQ6IDAgfVxuICAgICk6IHsgc2Nyb2xsVG9wOiBudW1iZXI7IHNjcm9sbExlZnQ6IG51bWJlciB9IHtcbiAgICAgICAgaWYgKGVsZW1lbnQucGFyZW50RWxlbWVudCAmJiBlbGVtZW50LnBhcmVudEVsZW1lbnQgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIGRhdGEuc2Nyb2xsVG9wICs9IGVsZW1lbnQucGFyZW50RWxlbWVudC5zY3JvbGxUb3A7XG4gICAgICAgICAgICBkYXRhLnNjcm9sbExlZnQgKz0gZWxlbWVudC5wYXJlbnRFbGVtZW50LnNjcm9sbExlZnQ7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldFNjcm9sbFBvc2l0aW9uRnJvbVBhcmVudHMoXG4gICAgICAgICAgICAgICAgZWxlbWVudC5wYXJlbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGRhdGFcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc2Nyb2xsVG9wOiBkYXRhLnNjcm9sbFRvcCxcbiAgICAgICAgICAgIHNjcm9sbExlZnQ6IGRhdGEuc2Nyb2xsTGVmdFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENvbm5lY3QgZ3JpZHN0ZXIgcHJvdG90eXBlIGl0ZW0gdG8gZ3JpZHN0ZXIgZHJhZ2dpbmcgaG9va3MgKG9uU3RhcnQsIG9uRHJhZywgb25TdG9wKS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGNvbm5lY3RHcmlkc3RlclByb3RvdHlwZSgpIHtcbiAgICAgICAgdGhpcy5ncmlkc3RlclByb3RvdHlwZS5vYnNlcnZlRHJvcE91dCh0aGlzLmdyaWRzdGVyKS5zdWJzY3JpYmUoKTtcblxuICAgICAgICBjb25zdCBkcm9wT3Zlck9ic2VydmFibGUgPSA8Q29ubmVjdGFibGVPYnNlcnZhYmxlPGFueT4+KFxuICAgICAgICAgICAgdGhpcy5ncmlkc3RlclByb3RvdHlwZVxuICAgICAgICAgICAgICAgIC5vYnNlcnZlRHJvcE92ZXIodGhpcy5ncmlkc3RlcilcbiAgICAgICAgICAgICAgICAucGlwZShwdWJsaXNoKCkpXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgZHJhZ09ic2VydmFibGUgPSB0aGlzLmdyaWRzdGVyUHJvdG90eXBlLm9ic2VydmVEcmFnT3ZlcihcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXJcbiAgICAgICAgKTtcblxuICAgICAgICBkcmFnT2JzZXJ2YWJsZS5kcmFnT3ZlclxuICAgICAgICAgICAgLnBpcGUoZmlsdGVyKCgpID0+ICF0aGlzLmlzRGlzYWJsZWQpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgocHJvdG90eXBlOiBHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNQcm90b3R5cGVFbnRlcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vbkRyYWcocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgZHJhZ09ic2VydmFibGUuZHJhZ0VudGVyXG4gICAgICAgICAgICAucGlwZShmaWx0ZXIoKCkgPT4gIXRoaXMuaXNEaXNhYmxlZCkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKChwcm90b3R5cGU6IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuaXNQcm90b3R5cGVFbnRlcmVkID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLml0ZW1zLmluZGV4T2YocHJvdG90eXBlLml0ZW0pIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLml0ZW1zLnB1c2gocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9uU3RhcnQocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgICAgIHByb3RvdHlwZS5zZXREcmFnQ29udGV4dEdyaWRzdGVyKHRoaXMuZ3JpZHN0ZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmRpc2FibGUocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnByb3RvdHlwZUVudGVyLmVtaXQoeyBpdGVtOiBwcm90b3R5cGUuaXRlbSB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIGRyYWdPYnNlcnZhYmxlLmRyYWdPdXRcbiAgICAgICAgICAgIC5waXBlKGZpbHRlcigoKSA9PiAhdGhpcy5pc0Rpc2FibGVkKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHByb3RvdHlwZTogR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzUHJvdG90eXBlRW50ZXJlZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25EcmFnT3V0KHByb3RvdHlwZS5pdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUHJvdG90eXBlRW50ZXJlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5wcm90b3R5cGVPdXQuZW1pdCh7IGl0ZW06IHByb3RvdHlwZS5pdGVtIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmVuYWJsZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmlzUHJvdG90eXBlRW50ZXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmdyaWRzdGVyLml0ZW1zLmluZGV4T2YocHJvdG90eXBlLml0ZW0pIDwgMFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmdyaWRzdGVyLml0ZW1zLnB1c2gocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LmdyaWRzdGVyLm9uU3RhcnQocHJvdG90eXBlLml0ZW0pO1xuICAgICAgICAgICAgICAgICAgICBwcm90b3R5cGUuc2V0RHJhZ0NvbnRleHRHcmlkc3Rlcih0aGlzLnBhcmVudC5ncmlkc3Rlcik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRpbWVvdXQgaXMgbmVlZGVkIHRvIGJlIHN1cmUgdGhhdCBcImVudGVyXCIgZXZlbnQgaXMgZmlyZWQgYWZ0ZXIgXCJvdXRcIlxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50LnByb3RvdHlwZUVudGVyLmVtaXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW06IHByb3RvdHlwZS5pdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3RvdHlwZS5vbkVudGVyKHRoaXMucGFyZW50LmdyaWRzdGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgZHJvcE92ZXJPYnNlcnZhYmxlXG4gICAgICAgICAgICAucGlwZShmaWx0ZXIoKCkgPT4gIXRoaXMuaXNEaXNhYmxlZCkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5pc1Byb3RvdHlwZUVudGVyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25TdG9wKGRhdGEuaXRlbS5pdGVtKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLnJlbW92ZUl0ZW0oZGF0YS5pdGVtLml0ZW0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5pc1Byb3RvdHlwZUVudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQuZW5hYmxlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHJvdG90eXBlRHJvcC5lbWl0KHsgaXRlbTogZGF0YS5pdGVtLml0ZW0gfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBkcm9wT3Zlck9ic2VydmFibGUuY29ubmVjdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZW5hYmxlRHJhZ2dhYmxlKCkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMuZHJhZ0FuZERyb3AgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuaXRlbXNcbiAgICAgICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICAgICAgaXRlbSA9PiBpdGVtLml0ZW1Db21wb25lbnQgJiYgaXRlbS5pdGVtQ29tcG9uZW50LmRyYWdBbmREcm9wXG4gICAgICAgICAgICApXG4gICAgICAgICAgICAuZm9yRWFjaCgoaXRlbTogR3JpZExpc3RJdGVtKSA9PlxuICAgICAgICAgICAgICAgIGl0ZW0uaXRlbUNvbXBvbmVudC5lbmFibGVEcmFnRHJvcCgpXG4gICAgICAgICAgICApO1xuICAgIH1cblxuICAgIHByaXZhdGUgZGlzYWJsZURyYWdnYWJsZSgpIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdBbmREcm9wID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uaXRlbUNvbXBvbmVudClcbiAgICAgICAgICAgIC5mb3JFYWNoKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+XG4gICAgICAgICAgICAgICAgaXRlbS5pdGVtQ29tcG9uZW50LmRpc2FibGVEcmFnZ2FibGUoKVxuICAgICAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuYWJsZVJlc2l6YWJsZSgpIHtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZSA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IGl0ZW0uaXRlbUNvbXBvbmVudCAmJiBpdGVtLml0ZW1Db21wb25lbnQucmVzaXphYmxlKVxuICAgICAgICAgICAgLmZvckVhY2goKGl0ZW06IEdyaWRMaXN0SXRlbSkgPT5cbiAgICAgICAgICAgICAgICBpdGVtLml0ZW1Db21wb25lbnQuZW5hYmxlUmVzaXphYmxlKClcbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkaXNhYmxlUmVzaXphYmxlKCkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzaXphYmxlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5pdGVtcy5mb3JFYWNoKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+XG4gICAgICAgICAgICBpdGVtLml0ZW1Db21wb25lbnQuZGlzYWJsZVJlc2l6YWJsZSgpXG4gICAgICAgICk7XG4gICAgfVxufVxuIl19