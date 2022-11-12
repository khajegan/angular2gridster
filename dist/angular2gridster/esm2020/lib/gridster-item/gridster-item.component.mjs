import { Component, ElementRef, Inject, Input, Output, EventEmitter, HostBinding, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { GridsterService } from '../gridster.service';
import { GridListItem } from '../gridList/GridListItem';
import { Draggable } from '../utils/draggable';
import { GridList } from '../gridList/gridList';
import { utils } from '../utils/utils';
import * as i0 from "@angular/core";
import * as i1 from "../gridster-prototype/gridster-prototype.service";
import * as i2 from "../gridster.service";
export class GridsterItemComponent {
    constructor(zone, gridsterPrototypeService, elementRef, gridster) {
        this.zone = zone;
        this.gridsterPrototypeService = gridsterPrototypeService;
        this.xChange = new EventEmitter(true);
        this.yChange = new EventEmitter(true);
        this.xSmChange = new EventEmitter(true);
        this.ySmChange = new EventEmitter(true);
        this.xMdChange = new EventEmitter(true);
        this.yMdChange = new EventEmitter(true);
        this.xLgChange = new EventEmitter(true);
        this.yLgChange = new EventEmitter(true);
        this.xXlChange = new EventEmitter(true);
        this.yXlChange = new EventEmitter(true);
        this.wChange = new EventEmitter(true);
        this.hChange = new EventEmitter(true);
        this.wSmChange = new EventEmitter(true);
        this.hSmChange = new EventEmitter(true);
        this.wMdChange = new EventEmitter(true);
        this.hMdChange = new EventEmitter(true);
        this.wLgChange = new EventEmitter(true);
        this.hLgChange = new EventEmitter(true);
        this.wXlChange = new EventEmitter(true);
        this.hXlChange = new EventEmitter(true);
        this.change = new EventEmitter(true);
        this.start = new EventEmitter(true);
        this.end = new EventEmitter(true);
        this.dragAndDrop = true;
        this.resizable = true;
        this.options = {};
        this.isDragging = false;
        this.isResizing = false;
        this.defaultOptions = {
            minWidth: 1,
            minHeight: 1,
            maxWidth: Infinity,
            maxHeight: Infinity,
            defaultWidth: 1,
            defaultHeight: 1
        };
        this.subscriptions = [];
        this.dragSubscriptions = [];
        this.resizeSubscriptions = [];
        this.gridster = gridster;
        this.elementRef = elementRef;
        this.$element = elementRef.nativeElement;
        this.item = (new GridListItem()).setFromGridsterItem(this);
        // if gridster is initialized do not show animation on new grid-item construct
        if (this.gridster.isInitialized()) {
            this.preventAnimation();
        }
    }
    set positionX(value) {
        this._positionX = value;
    }
    get positionX() {
        return this._positionX;
    }
    set positionY(value) {
        this._positionY = value;
    }
    get positionY() {
        return this._positionY;
    }
    ngOnInit() {
        this.options = Object.assign(this.defaultOptions, this.options);
        this.w = this.w || this.options.defaultWidth;
        this.h = this.h || this.options.defaultHeight;
        this.wSm = this.wSm || this.w;
        this.hSm = this.hSm || this.h;
        this.wMd = this.wMd || this.w;
        this.hMd = this.hMd || this.h;
        this.wLg = this.wLg || this.w;
        this.hLg = this.hLg || this.h;
        this.wXl = this.wXl || this.w;
        this.hXl = this.hXl || this.h;
        if (this.gridster.isInitialized()) {
            this.setPositionsOnItem();
        }
        this.gridster.registerItem(this.item);
        this.gridster.calculateCellSize();
        this.item.applySize();
        this.item.applyPosition();
        if (this.gridster.options.dragAndDrop && this.dragAndDrop) {
            this.enableDragDrop();
        }
        if (this.gridster.isInitialized()) {
            this.gridster.render();
            this.gridster.updateCachedItems();
        }
    }
    ngAfterViewInit() {
        if (this.gridster.options.resizable && this.item.resizable) {
            this.enableResizable();
        }
    }
    ngOnChanges(changes) {
        if (!this.gridster.gridList) {
            return;
        }
        let rerender = false;
        ['w', ...Object.keys(GridListItem.W_PROPERTY_MAP).map(breakpoint => GridListItem.W_PROPERTY_MAP[breakpoint])]
            .filter(propName => changes[propName] && !changes[propName].isFirstChange())
            .forEach((propName) => {
            if (changes[propName].currentValue > this.options.maxWidth) {
                this[propName] = this.options.maxWidth;
                setTimeout(() => this[propName + 'Change'].emit(this[propName]));
            }
            rerender = true;
        });
        ['h', ...Object.keys(GridListItem.H_PROPERTY_MAP).map(breakpoint => GridListItem.H_PROPERTY_MAP[breakpoint])]
            .filter(propName => changes[propName] && !changes[propName].isFirstChange())
            .forEach((propName) => {
            if (changes[propName].currentValue > this.options.maxHeight) {
                this[propName] = this.options.maxHeight;
                setTimeout(() => this[propName + 'Change'].emit(this[propName]));
            }
            rerender = true;
        });
        ['x', 'y',
            ...Object.keys(GridListItem.X_PROPERTY_MAP).map(breakpoint => GridListItem.X_PROPERTY_MAP[breakpoint]),
            ...Object.keys(GridListItem.Y_PROPERTY_MAP).map(breakpoint => GridListItem.Y_PROPERTY_MAP[breakpoint])]
            .filter(propName => changes[propName] && !changes[propName].isFirstChange())
            .forEach((propName) => rerender = true);
        if (changes['dragAndDrop'] && !changes['dragAndDrop'].isFirstChange()) {
            if (changes['dragAndDrop'].currentValue && this.gridster.options.dragAndDrop) {
                this.enableDragDrop();
            }
            else {
                this.disableDraggable();
            }
        }
        if (changes['resizable'] && !changes['resizable'].isFirstChange()) {
            if (changes['resizable'].currentValue && this.gridster.options.resizable) {
                this.enableResizable();
            }
            else {
                this.disableResizable();
            }
        }
        if (rerender && this.gridster.gridsterComponent.isReady) {
            this.gridster.debounceRenderSubject.next(null);
        }
    }
    ngOnDestroy() {
        this.gridster.removeItem(this.item);
        this.gridster.itemRemoveSubject.next(this.item);
        this.subscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
        this.disableDraggable();
        this.disableResizable();
    }
    updateElemenetPosition() {
        if (this.gridster.options.useCSSTransforms) {
            utils.setTransform(this.$element, { x: this._positionX, y: this._positionY });
        }
        else {
            utils.setCssElementPosition(this.$element, { x: this._positionX, y: this._positionY });
        }
    }
    setPositionsOnItem() {
        if (!this.item.hasPositions(this.gridster.options.breakpoint)) {
            this.setPositionsForGrid(this.gridster.options);
        }
        this.gridster.gridsterOptions.responsiveOptions
            .filter((options) => !this.item.hasPositions(options.breakpoint))
            .forEach((options) => this.setPositionsForGrid(options));
    }
    enableResizable() {
        if (this.resizeSubscriptions.length) {
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.getResizeHandlers().forEach((handler) => {
                const direction = this.getResizeDirection(handler);
                if (this.hasResizableHandle(direction)) {
                    handler.style.display = 'block';
                }
                const draggable = new Draggable(handler, this.getResizableOptions());
                let startEvent;
                let startData;
                let cursorToElementPosition;
                const dragStartSub = draggable.dragStart
                    .subscribe((event) => {
                    this.zone.run(() => {
                        this.isResizing = true;
                        startEvent = event;
                        startData = this.createResizeStartObject(direction);
                        cursorToElementPosition = event.getRelativeCoordinates(this.$element);
                        this.gridster.onResizeStart(this.item);
                        this.onStart('resize');
                    });
                });
                const dragSub = draggable.dragMove
                    .subscribe((event) => {
                    const scrollData = this.gridster.gridsterScrollData;
                    this.resizeElement({
                        direction,
                        startData,
                        position: {
                            x: event.clientX - cursorToElementPosition.x - this.gridster.gridsterRect.left,
                            y: event.clientY - cursorToElementPosition.y - this.gridster.gridsterRect.top
                        },
                        startEvent,
                        moveEvent: event,
                        scrollDiffX: scrollData.scrollLeft - startData.scrollLeft,
                        scrollDiffY: scrollData.scrollTop - startData.scrollTop
                    });
                    this.gridster.onResizeDrag(this.item);
                });
                const dragStopSub = draggable.dragStop
                    .subscribe(() => {
                    this.zone.run(() => {
                        this.isResizing = false;
                        this.gridster.onResizeStop(this.item);
                        this.onEnd('resize');
                    });
                });
                this.resizeSubscriptions = this.resizeSubscriptions.concat([dragStartSub, dragSub, dragStopSub]);
            });
        });
    }
    disableResizable() {
        this.resizeSubscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
        this.resizeSubscriptions = [];
        [].forEach.call(this.$element.querySelectorAll('.gridster-item-resizable-handler'), (handler) => {
            handler.style.display = '';
        });
    }
    enableDragDrop() {
        if (this.dragSubscriptions.length) {
            return;
        }
        this.zone.runOutsideAngular(() => {
            let cursorToElementPosition;
            const draggable = new Draggable(this.$element, this.getDraggableOptions());
            const dragStartSub = draggable.dragStart
                .subscribe((event) => {
                this.zone.run(() => {
                    this.gridster.onStart(this.item);
                    this.isDragging = true;
                    this.onStart('drag');
                    cursorToElementPosition = event.getRelativeCoordinates(this.$element);
                });
            });
            const dragSub = draggable.dragMove
                .subscribe((event) => {
                this.positionY = (event.clientY - cursorToElementPosition.y -
                    this.gridster.gridsterRect.top);
                this.positionX = (event.clientX - cursorToElementPosition.x -
                    this.gridster.gridsterRect.left);
                this.updateElemenetPosition();
                this.gridster.onDrag(this.item);
            });
            const dragStopSub = draggable.dragStop
                .subscribe(() => {
                this.zone.run(() => {
                    this.gridster.onStop(this.item);
                    this.gridster.debounceRenderSubject.next(null);
                    this.isDragging = false;
                    this.onEnd('drag');
                });
            });
            this.dragSubscriptions = this.dragSubscriptions.concat([dragStartSub, dragSub, dragStopSub]);
        });
    }
    disableDraggable() {
        this.dragSubscriptions.forEach((sub) => {
            sub.unsubscribe();
        });
        this.dragSubscriptions = [];
    }
    getResizeHandlers() {
        return [].filter.call(this.$element.children[0].children, (el) => {
            return el.classList.contains('gridster-item-resizable-handler');
        });
    }
    getDraggableOptions() {
        return { scrollDirection: this.gridster.options.direction, ...this.gridster.draggableOptions };
    }
    getResizableOptions() {
        const resizableOptions = {};
        if (this.gridster.draggableOptions.scroll || this.gridster.draggableOptions.scroll === false) {
            resizableOptions.scroll = this.gridster.draggableOptions.scroll;
        }
        if (this.gridster.draggableOptions.scrollEdge) {
            resizableOptions.scrollEdge = this.gridster.draggableOptions.scrollEdge;
        }
        resizableOptions.scrollDirection = this.gridster.options.direction;
        return resizableOptions;
    }
    hasResizableHandle(direction) {
        const isItemResizable = this.gridster.options.resizable && this.item.resizable;
        const resizeHandles = this.gridster.options.resizeHandles;
        return isItemResizable && (!resizeHandles || (resizeHandles && !!resizeHandles[direction]));
    }
    setPositionsForGrid(options) {
        let x, y;
        const position = this.findPosition(options);
        x = options.direction === 'horizontal' ? position[0] : position[1];
        y = options.direction === 'horizontal' ? position[1] : position[0];
        this.item.setValueX(x, options.breakpoint);
        this.item.setValueY(y, options.breakpoint);
        setTimeout(() => {
            this.item.triggerChangeX(options.breakpoint);
            this.item.triggerChangeY(options.breakpoint);
        });
    }
    findPosition(options) {
        const gridList = new GridList(this.gridster.items.map(item => item.copyForBreakpoint(options.breakpoint)), options);
        return gridList.findPositionForItem(this.item, { x: 0, y: 0 });
    }
    createResizeStartObject(direction) {
        const scrollData = this.gridster.gridsterScrollData;
        return {
            top: this.positionY,
            left: this.positionX,
            height: parseInt(this.$element.style.height, 10),
            width: parseInt(this.$element.style.width, 10),
            minX: Math.max(this.item.x + this.item.w - this.options.maxWidth, 0),
            maxX: this.item.x + this.item.w - this.options.minWidth,
            minY: Math.max(this.item.y + this.item.h - this.options.maxHeight, 0),
            maxY: this.item.y + this.item.h - this.options.minHeight,
            minW: this.options.minWidth,
            maxW: Math.min(this.options.maxWidth, (this.gridster.options.direction === 'vertical' && direction.indexOf('w') < 0) ?
                this.gridster.options.lanes - this.item.x : this.options.maxWidth, direction.indexOf('w') >= 0 ?
                this.item.x + this.item.w : this.options.maxWidth),
            minH: this.options.minHeight,
            maxH: Math.min(this.options.maxHeight, (this.gridster.options.direction === 'horizontal' && direction.indexOf('n') < 0) ?
                this.gridster.options.lanes - this.item.y : this.options.maxHeight, direction.indexOf('n') >= 0 ?
                this.item.y + this.item.h : this.options.maxHeight),
            scrollLeft: scrollData.scrollLeft,
            scrollTop: scrollData.scrollTop
        };
    }
    onEnd(actionType) {
        this.end.emit({ action: actionType, item: this.item });
    }
    onStart(actionType) {
        this.start.emit({ action: actionType, item: this.item });
    }
    /**
     * Assign class for short while to prevent animation of grid item component
     */
    preventAnimation() {
        this.$element.classList.add('no-transition');
        setTimeout(() => {
            this.$element.classList.remove('no-transition');
        }, 500);
        return this;
    }
    getResizeDirection(handler) {
        for (let i = handler.classList.length - 1; i >= 0; i--) {
            if (handler.classList[i].match('handle-')) {
                return handler.classList[i].split('-')[1];
            }
        }
    }
    resizeElement(config) {
        // north
        if (config.direction.indexOf('n') >= 0) {
            this.resizeToNorth(config);
        }
        // west
        if (config.direction.indexOf('w') >= 0) {
            this.resizeToWest(config);
        }
        // east
        if (config.direction.indexOf('e') >= 0) {
            this.resizeToEast(config);
        }
        // south
        if (config.direction.indexOf('s') >= 0) {
            this.resizeToSouth(config);
        }
    }
    resizeToNorth(config) {
        const height = config.startData.height + config.startEvent.clientY -
            config.moveEvent.clientY - config.scrollDiffY;
        if (height < (config.startData.minH * this.gridster.cellHeight)) {
            this.setMinHeight('n', config);
        }
        else if (height > (config.startData.maxH * this.gridster.cellHeight)) {
            this.setMaxHeight('n', config);
        }
        else {
            this.positionY = config.position.y;
            this.$element.style.height = height + 'px';
        }
    }
    resizeToWest(config) {
        const width = config.startData.width + config.startEvent.clientX -
            config.moveEvent.clientX - config.scrollDiffX;
        if (width < (config.startData.minW * this.gridster.cellWidth)) {
            this.setMinWidth('w', config);
        }
        else if (width > (config.startData.maxW * this.gridster.cellWidth)) {
            this.setMaxWidth('w', config);
        }
        else {
            this.positionX = config.position.x;
            this.updateElemenetPosition();
            this.$element.style.width = width + 'px';
        }
    }
    resizeToEast(config) {
        const width = config.startData.width + config.moveEvent.clientX -
            config.startEvent.clientX + config.scrollDiffX;
        if (width > (config.startData.maxW * this.gridster.cellWidth)) {
            this.setMaxWidth('e', config);
        }
        else if (width < (config.startData.minW * this.gridster.cellWidth)) {
            this.setMinWidth('e', config);
        }
        else {
            this.$element.style.width = width + 'px';
        }
    }
    resizeToSouth(config) {
        const height = config.startData.height + config.moveEvent.clientY -
            config.startEvent.clientY + config.scrollDiffY;
        if (height > config.startData.maxH * this.gridster.cellHeight) {
            this.setMaxHeight('s', config);
        }
        else if (height < config.startData.minH * this.gridster.cellHeight) {
            this.setMinHeight('s', config);
        }
        else {
            this.$element.style.height = height + 'px';
        }
    }
    setMinHeight(direction, config) {
        if (direction === 'n') {
            this.$element.style.height = (config.startData.minH * this.gridster.cellHeight) + 'px';
            this.positionY = config.startData.maxY * this.gridster.cellHeight;
        }
        else {
            this.$element.style.height = (config.startData.minH * this.gridster.cellHeight) + 'px';
        }
    }
    setMinWidth(direction, config) {
        if (direction === 'w') {
            this.$element.style.width = (config.startData.minW * this.gridster.cellWidth) + 'px';
            this.positionX = config.startData.maxX * this.gridster.cellWidth;
            this.updateElemenetPosition();
        }
        else {
            this.$element.style.width = (config.startData.minW * this.gridster.cellWidth) + 'px';
        }
    }
    setMaxHeight(direction, config) {
        if (direction === 'n') {
            this.$element.style.height = (config.startData.maxH * this.gridster.cellHeight) + 'px';
            this.positionY = config.startData.minY * this.gridster.cellHeight;
        }
        else {
            this.$element.style.height = (config.startData.maxH * this.gridster.cellHeight) + 'px';
        }
    }
    setMaxWidth(direction, config) {
        if (direction === 'w') {
            this.$element.style.width = (config.startData.maxW * this.gridster.cellWidth) + 'px';
            this.positionX = config.startData.minX * this.gridster.cellWidth;
            this.updateElemenetPosition();
        }
        else {
            this.$element.style.width = (config.startData.maxW * this.gridster.cellWidth) + 'px';
        }
    }
}
GridsterItemComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: GridsterItemComponent, deps: [{ token: i0.NgZone }, { token: i1.GridsterPrototypeService }, { token: ElementRef }, { token: GridsterService }], target: i0.ɵɵFactoryTarget.Component });
GridsterItemComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.0", type: GridsterItemComponent, selector: "ngx-gridster-item", inputs: { x: "x", y: "y", xSm: "xSm", ySm: "ySm", xMd: "xMd", yMd: "yMd", xLg: "xLg", yLg: "yLg", xXl: "xXl", yXl: "yXl", w: "w", h: "h", wSm: "wSm", hSm: "hSm", wMd: "wMd", hMd: "hMd", wLg: "wLg", hLg: "hLg", wXl: "wXl", hXl: "hXl", dragAndDrop: "dragAndDrop", resizable: "resizable", options: "options" }, outputs: { xChange: "xChange", yChange: "yChange", xSmChange: "xSmChange", ySmChange: "ySmChange", xMdChange: "xMdChange", yMdChange: "yMdChange", xLgChange: "xLgChange", yLgChange: "yLgChange", xXlChange: "xXlChange", yXlChange: "yXlChange", wChange: "wChange", hChange: "hChange", wSmChange: "wSmChange", hSmChange: "hSmChange", wMdChange: "wMdChange", hMdChange: "hMdChange", wLgChange: "wLgChange", hLgChange: "hLgChange", wXlChange: "wXlChange", hXlChange: "hXlChange", change: "change", start: "start", end: "end" }, host: { properties: { "class.is-dragging": "this.isDragging", "class.is-resizing": "this.isResizing" } }, usesOnChanges: true, ngImport: i0, template: `<div class="gridster-item-inner">
      <ng-content></ng-content>
      <div class="gridster-item-resizable-handler handle-s"></div>
      <div class="gridster-item-resizable-handler handle-e"></div>
      <div class="gridster-item-resizable-handler handle-n"></div>
      <div class="gridster-item-resizable-handler handle-w"></div>
      <div class="gridster-item-resizable-handler handle-se"></div>
      <div class="gridster-item-resizable-handler handle-ne"></div>
      <div class="gridster-item-resizable-handler handle-sw"></div>
      <div class="gridster-item-resizable-handler handle-nw"></div>
    </div>`, isInline: true, styles: ["ngx-gridster-item{display:block;position:absolute;top:0;left:0;z-index:1;transition:none}.gridster--ready ngx-gridster-item{transition:all .2s ease;transition-property:left,top}.gridster--ready.css-transform ngx-gridster-item{transition-property:transform}.gridster--ready ngx-gridster-item.is-dragging,.gridster--ready ngx-gridster-item.is-resizing{transition:none;z-index:9999}ngx-gridster-item.no-transition{transition:none}ngx-gridster-item .gridster-item-resizable-handler{position:absolute;z-index:2;display:none}ngx-gridster-item .gridster-item-resizable-handler.handle-n{cursor:n-resize;height:10px;right:0;top:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-e{cursor:e-resize;width:10px;bottom:0;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-s{cursor:s-resize;height:10px;right:0;bottom:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-w{cursor:w-resize;width:10px;left:0;top:0;bottom:0}ngx-gridster-item .gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}ngx-gridster-item .gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}ngx-gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.0", ngImport: i0, type: GridsterItemComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ngx-gridster-item', template: `<div class="gridster-item-inner">
      <ng-content></ng-content>
      <div class="gridster-item-resizable-handler handle-s"></div>
      <div class="gridster-item-resizable-handler handle-e"></div>
      <div class="gridster-item-resizable-handler handle-n"></div>
      <div class="gridster-item-resizable-handler handle-w"></div>
      <div class="gridster-item-resizable-handler handle-se"></div>
      <div class="gridster-item-resizable-handler handle-ne"></div>
      <div class="gridster-item-resizable-handler handle-sw"></div>
      <div class="gridster-item-resizable-handler handle-nw"></div>
    </div>`, changeDetection: ChangeDetectionStrategy.OnPush, encapsulation: ViewEncapsulation.None, styles: ["ngx-gridster-item{display:block;position:absolute;top:0;left:0;z-index:1;transition:none}.gridster--ready ngx-gridster-item{transition:all .2s ease;transition-property:left,top}.gridster--ready.css-transform ngx-gridster-item{transition-property:transform}.gridster--ready ngx-gridster-item.is-dragging,.gridster--ready ngx-gridster-item.is-resizing{transition:none;z-index:9999}ngx-gridster-item.no-transition{transition:none}ngx-gridster-item .gridster-item-resizable-handler{position:absolute;z-index:2;display:none}ngx-gridster-item .gridster-item-resizable-handler.handle-n{cursor:n-resize;height:10px;right:0;top:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-e{cursor:e-resize;width:10px;bottom:0;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-s{cursor:s-resize;height:10px;right:0;bottom:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-w{cursor:w-resize;width:10px;left:0;top:0;bottom:0}ngx-gridster-item .gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}ngx-gridster-item .gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}ngx-gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i1.GridsterPrototypeService }, { type: i0.ElementRef, decorators: [{
                    type: Inject,
                    args: [ElementRef]
                }] }, { type: i2.GridsterService, decorators: [{
                    type: Inject,
                    args: [GridsterService]
                }] }]; }, propDecorators: { x: [{
                type: Input
            }], xChange: [{
                type: Output
            }], y: [{
                type: Input
            }], yChange: [{
                type: Output
            }], xSm: [{
                type: Input
            }], xSmChange: [{
                type: Output
            }], ySm: [{
                type: Input
            }], ySmChange: [{
                type: Output
            }], xMd: [{
                type: Input
            }], xMdChange: [{
                type: Output
            }], yMd: [{
                type: Input
            }], yMdChange: [{
                type: Output
            }], xLg: [{
                type: Input
            }], xLgChange: [{
                type: Output
            }], yLg: [{
                type: Input
            }], yLgChange: [{
                type: Output
            }], xXl: [{
                type: Input
            }], xXlChange: [{
                type: Output
            }], yXl: [{
                type: Input
            }], yXlChange: [{
                type: Output
            }], w: [{
                type: Input
            }], wChange: [{
                type: Output
            }], h: [{
                type: Input
            }], hChange: [{
                type: Output
            }], wSm: [{
                type: Input
            }], wSmChange: [{
                type: Output
            }], hSm: [{
                type: Input
            }], hSmChange: [{
                type: Output
            }], wMd: [{
                type: Input
            }], wMdChange: [{
                type: Output
            }], hMd: [{
                type: Input
            }], hMdChange: [{
                type: Output
            }], wLg: [{
                type: Input
            }], wLgChange: [{
                type: Output
            }], hLg: [{
                type: Input
            }], hLgChange: [{
                type: Output
            }], wXl: [{
                type: Input
            }], wXlChange: [{
                type: Output
            }], hXl: [{
                type: Input
            }], hXlChange: [{
                type: Output
            }], change: [{
                type: Output
            }], start: [{
                type: Output
            }], end: [{
                type: Output
            }], dragAndDrop: [{
                type: Input
            }], resizable: [{
                type: Input
            }], options: [{
                type: Input
            }], isDragging: [{
                type: HostBinding,
                args: ['class.is-dragging']
            }], isResizing: [{
                type: HostBinding,
                args: ['class.is-resizing']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXItaXRlbS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyMmdyaWRzdGVyL3NyYy9saWIvZ3JpZHN0ZXItaXRlbS9ncmlkc3Rlci1pdGVtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFVLFVBQVUsRUFBRSxNQUFNLEVBQVEsS0FBSyxFQUFFLE1BQU0sRUFDL0QsWUFBWSxFQUF1QyxXQUFXLEVBQzlELHVCQUF1QixFQUF5QixpQkFBaUIsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUc3RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFHdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRXhELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUUvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7O0FBOEh2QyxNQUFNLE9BQU8scUJBQXFCO0lBc0c5QixZQUFvQixJQUFZLEVBQ1osd0JBQWtELEVBQ3RDLFVBQXNCLEVBQ2pCLFFBQXlCO1FBSDFDLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWiw2QkFBd0IsR0FBeEIsd0JBQXdCLENBQTBCO1FBckc1RCxZQUFPLEdBQUcsSUFBSSxZQUFZLENBQVMsSUFBSSxDQUFDLENBQUM7UUFFekMsWUFBTyxHQUFHLElBQUksWUFBWSxDQUFTLElBQUksQ0FBQyxDQUFDO1FBR3pDLGNBQVMsR0FBRyxJQUFJLFlBQVksQ0FBUyxJQUFJLENBQUMsQ0FBQztRQUUzQyxjQUFTLEdBQUcsSUFBSSxZQUFZLENBQVMsSUFBSSxDQUFDLENBQUM7UUFHM0MsY0FBUyxHQUFHLElBQUksWUFBWSxDQUFTLElBQUksQ0FBQyxD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LE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFaEUsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDO1FBQzdDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUM5QyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5QixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztRQUU5QixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7U0FDN0I7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdEMsSUFB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QU87c0JBQWhCLE1BQU07Z0JBRUUsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBQ0UsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBRUUsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBQ0UsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBRUUsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBQ0UsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBRUUsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBQ0UsR0FBRztzQkFBWCxLQUFLO2dCQUNJLFNBQVM7c0JBQWxCLE1BQU07Z0JBRUcsTUFBTTtzQkFBZixNQUFNO2dCQUNHLEtBQUs7c0JBQWQsTUFBTTtnQkFDRyxHQUFHO3NCQUFaLE1BQU07Z0JBRUUsV0FBVztzQkFBbkIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUVHLE9BQU87c0JBQWYsS0FBSztnQkFJNEIsVUFBVTtzQkFBM0MsV0FBVzt1QkFBQyxtQkFBbUI7Z0JBQ0UsVUFBVTtzQkFBM0MsV0FBVzt1QkFBQyxtQkFBbUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnQsIE9uSW5pdCwgRWxlbWVudFJlZiwgSW5qZWN0LCBIb3N0LCBJbnB1dCwgT3V0cHV0LFxuICAgIEV2ZW50RW1pdHRlciwgU2ltcGxlQ2hhbmdlcywgT25DaGFuZ2VzLCBPbkRlc3Ryb3ksIEhvc3RCaW5kaW5nLFxuICAgIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LCBBZnRlclZpZXdJbml0LCBOZ1pvbmUsIFZpZXdFbmNhcHN1bGF0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHsgR3JpZHN0ZXJTZXJ2aWNlIH0gZnJvbSAnLi4vZ3JpZHN0ZXIuc2VydmljZSc7XG5pbXBvcnQgeyBHcmlkc3RlclByb3RvdHlwZVNlcnZpY2UgfSBmcm9tICcuLi9ncmlkc3Rlci1wcm90b3R5cGUvZ3JpZHN0ZXItcHJvdG90eXBlLnNlcnZpY2UnO1xuXG5pbXBvcnQgeyBHcmlkTGlzdEl0ZW0gfSBmcm9tICcuLi9ncmlkTGlzdC9HcmlkTGlzdEl0ZW0nO1xuaW1wb3J0IHsgRHJhZ2dhYmxlRXZlbnQgfSBmcm9tICcuLi91dGlscy9EcmFnZ2FibGVFdmVudCc7XG5pbXBvcnQgeyBEcmFnZ2FibGUgfSBmcm9tICcuLi91dGlscy9kcmFnZ2FibGUnO1xuaW1wb3J0IHsgSUdyaWRzdGVyT3B0aW9ucyB9IGZyb20gJy4uL0lHcmlkc3Rlck9wdGlvbnMnO1xuaW1wb3J0IHsgR3JpZExpc3QgfSBmcm9tICcuLi9ncmlkTGlzdC9ncmlkTGlzdCc7XG5pbXBvcnQgeyB1dGlscyB9IGZyb20gJy4uL3V0aWxzL3V0aWxzJztcblxuQENvbXBvbmVudCh7XG4gICAgc2VsZWN0b3I6ICduZ3gtZ3JpZHN0ZXItaXRlbScsXG4gICAgdGVtcGxhdGU6IGA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1pbm5lclwiPlxuICAgICAgPG5nLWNvbnRlbnQ+PC9uZy1jb250ZW50PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLXNcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1lXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtblwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLXdcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1zZVwiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLW5lXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtc3dcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1ud1wiPjwvZGl2PlxuICAgIDwvZGl2PmAsXG4gICAgc3R5bGVzOiBbYFxuICAgIG5neC1ncmlkc3Rlci1pdGVtIHtcbiAgICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgdG9wOiAwO1xuICAgICAgICBsZWZ0OiAwO1xuICAgICAgICB6LWluZGV4OiAxO1xuICAgICAgICAtd2Via2l0LXRyYW5zaXRpb246IG5vbmU7XG4gICAgICAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgfVxuXG4gICAgLmdyaWRzdGVyLS1yZWFkeSBuZ3gtZ3JpZHN0ZXItaXRlbSB7XG4gICAgICAgIHRyYW5zaXRpb246IGFsbCAyMDBtcyBlYXNlO1xuICAgICAgICB0cmFuc2l0aW9uLXByb3BlcnR5OiBsZWZ0LCB0b3A7XG4gICAgfVxuXG4gICAgLmdyaWRzdGVyLS1yZWFkeS5jc3MtdHJhbnNmb3JtIG5neC1ncmlkc3Rlci1pdGVtICB7XG4gICAgICAgIHRyYW5zaXRpb24tcHJvcGVydHk6IHRyYW5zZm9ybTtcbiAgICB9XG5cbiAgICAuZ3JpZHN0ZXItLXJlYWR5IG5neC1ncmlkc3Rlci1pdGVtLmlzLWRyYWdnaW5nLFxuICAgIC5ncmlkc3Rlci0tcmVhZHkgbmd4LWdyaWRzdGVyLWl0ZW0uaXMtcmVzaXppbmcge1xuICAgICAgICAtd2Via2l0LXRyYW5zaXRpb246IG5vbmU7XG4gICAgICAgIHRyYW5zaXRpb246IG5vbmU7XG4gICAgICAgIHotaW5kZXg6IDk5OTk7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0ubm8tdHJhbnNpdGlvbiB7XG4gICAgICAgIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTtcbiAgICAgICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICB9XG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIge1xuICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgIHotaW5kZXg6IDI7XG4gICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIuaGFuZGxlLW4ge1xuICAgICAgY3Vyc29yOiBuLXJlc2l6ZTtcbiAgICAgIGhlaWdodDogMTBweDtcbiAgICAgIHJpZ2h0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgICAgbGVmdDogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtZSB7XG4gICAgICBjdXJzb3I6IGUtcmVzaXplO1xuICAgICAgd2lkdGg6IDEwcHg7XG4gICAgICBib3R0b206IDA7XG4gICAgICByaWdodDogMDtcbiAgICAgIHRvcDogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtcyB7XG4gICAgICBjdXJzb3I6IHMtcmVzaXplO1xuICAgICAgaGVpZ2h0OiAxMHB4O1xuICAgICAgcmlnaHQ6IDA7XG4gICAgICBib3R0b206IDA7XG4gICAgICBsZWZ0OiAwO1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS13IHtcbiAgICAgIGN1cnNvcjogdy1yZXNpemU7XG4gICAgICB3aWR0aDogMTBweDtcbiAgICAgIGxlZnQ6IDA7XG4gICAgICB0b3A6IDA7XG4gICAgICBib3R0b206IDA7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIuaGFuZGxlLW5lIHtcbiAgICAgIGN1cnNvcjogbmUtcmVzaXplO1xuICAgICAgd2lkdGg6IDEwcHg7XG4gICAgICBoZWlnaHQ6IDEwcHg7XG4gICAgICByaWdodDogMDtcbiAgICAgIHRvcDogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtbncge1xuICAgICAgY3Vyc29yOiBudy1yZXNpemU7XG4gICAgICB3aWR0aDogMTBweDtcbiAgICAgIGhlaWdodDogMTBweDtcbiAgICAgIGxlZnQ6IDA7XG4gICAgICB0b3A6IDA7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIuaGFuZGxlLXNlIHtcbiAgICAgIGN1cnNvcjogc2UtcmVzaXplO1xuICAgICAgd2lkdGg6IDA7XG4gICAgICBoZWlnaHQ6IDA7XG4gICAgICByaWdodDogMDtcbiAgICAgIGJvdHRvbTogMDtcbiAgICAgIGJvcmRlci1zdHlsZTogc29saWQ7XG4gICAgICBib3JkZXItd2lkdGg6IDAgMCAxMHB4IDEwcHg7XG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50O1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS1zdyB7XG4gICAgICBjdXJzb3I6IHN3LXJlc2l6ZTtcbiAgICAgIHdpZHRoOiAxMHB4O1xuICAgICAgaGVpZ2h0OiAxMHB4O1xuICAgICAgbGVmdDogMDtcbiAgICAgIGJvdHRvbTogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbTpob3ZlciAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtc2Uge1xuICAgICAgYm9yZGVyLWNvbG9yOiB0cmFuc3BhcmVudCB0cmFuc3BhcmVudCAjY2NjXG4gICAgfVxuICAgIGBdLFxuICAgIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLk5vbmVcbn0pXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJJdGVtQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMsIEFmdGVyVmlld0luaXQsIE9uRGVzdHJveSB7XG4gICAgQElucHV0KCkgeDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB4Q2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuICAgIEBJbnB1dCgpIHk6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgeUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHhTbTogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB4U21DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgeVNtOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHlTbUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHhNZDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB4TWRDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgeU1kOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHlNZENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHhMZzogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB4TGdDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgeUxnOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHlMZ0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHhYbDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB4WGxDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgeVhsOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHlYbENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuXG4gICAgQElucHV0KCkgdzogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB3Q2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuICAgIEBJbnB1dCgpIGg6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgaENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHdTbTogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB3U21DaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgaFNtOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIGhTbUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHdNZDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB3TWRDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgaE1kOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIGhNZENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHdMZzogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB3TGdDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgaExnOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIGhMZ0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBJbnB1dCgpIHdYbDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB3WGxDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgaFhsOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIGhYbENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcblxuICAgIEBPdXRwdXQoKSBjaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4odHJ1ZSk7XG4gICAgQE91dHB1dCgpIHN0YXJ0ID0gbmV3IEV2ZW50RW1pdHRlcjxhbnk+KHRydWUpO1xuICAgIEBPdXRwdXQoKSBlbmQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4odHJ1ZSk7XG5cbiAgICBASW5wdXQoKSBkcmFnQW5kRHJvcCA9IHRydWU7XG4gICAgQElucHV0KCkgcmVzaXphYmxlID0gdHJ1ZTtcblxuICAgIEBJbnB1dCgpIG9wdGlvbnM6IGFueSA9IHt9O1xuXG4gICAgYXV0b1NpemU6IGJvb2xlYW47XG5cbiAgICBASG9zdEJpbmRpbmcoJ2NsYXNzLmlzLWRyYWdnaW5nJykgaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgIEBIb3N0QmluZGluZygnY2xhc3MuaXMtcmVzaXppbmcnKSBpc1Jlc2l6aW5nID0gZmFsc2U7XG5cbiAgICAkZWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gICAgZWxlbWVudFJlZjogRWxlbWVudFJlZjtcbiAgICAvKipcbiAgICAgKiBHcmlkc3RlciBwcm92aWRlciBzZXJ2aWNlXG4gICAgICovXG4gICAgZ3JpZHN0ZXI6IEdyaWRzdGVyU2VydmljZTtcblxuICAgIGl0ZW06IEdyaWRMaXN0SXRlbTtcblxuICAgIHNldCBwb3NpdGlvblgodmFsdWU6IG51bWJlcikge1xuICAgICAgICB0aGlzLl9wb3NpdGlvblggPSB2YWx1ZTtcbiAgICB9XG4gICAgZ2V0IHBvc2l0aW9uWCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3Bvc2l0aW9uWDtcbiAgICB9XG4gICAgc2V0IHBvc2l0aW9uWSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uWSA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXQgcG9zaXRpb25ZKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25ZO1xuICAgIH1cbiAgICBwcml2YXRlIF9wb3NpdGlvblg6IG51bWJlcjtcbiAgICBwcml2YXRlIF9wb3NpdGlvblk6IG51bWJlcjtcblxuICAgIHByaXZhdGUgZGVmYXVsdE9wdGlvbnM6IGFueSA9IHtcbiAgICAgICAgbWluV2lkdGg6IDEsXG4gICAgICAgIG1pbkhlaWdodDogMSxcbiAgICAgICAgbWF4V2lkdGg6IEluZmluaXR5LFxuICAgICAgICBtYXhIZWlnaHQ6IEluZmluaXR5LFxuICAgICAgICBkZWZhdWx0V2lkdGg6IDEsXG4gICAgICAgIGRlZmF1bHRIZWlnaHQ6IDFcbiAgICB9O1xuICAgIHByaXZhdGUgc3Vic2NyaXB0aW9uczogQXJyYXk8U3Vic2NyaXB0aW9uPiA9IFtdO1xuICAgIHByaXZhdGUgZHJhZ1N1YnNjcmlwdGlvbnM6IEFycmF5PFN1YnNjcmlwdGlvbj4gPSBbXTtcbiAgICBwcml2YXRlIHJlc2l6ZVN1YnNjcmlwdGlvbnM6IEFycmF5PFN1YnNjcmlwdGlvbj4gPSBbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgem9uZTogTmdab25lLFxuICAgICAgICAgICAgICAgIHByaXZhdGUgZ3JpZHN0ZXJQcm90b3R5cGVTZXJ2aWNlOiBHcmlkc3RlclByb3RvdHlwZVNlcnZpY2UsXG4gICAgICAgICAgICAgICAgQEluamVjdChFbGVtZW50UmVmKSBlbGVtZW50UmVmOiBFbGVtZW50UmVmLFxuICAgICAgICAgICAgICAgIEBJbmplY3QoR3JpZHN0ZXJTZXJ2aWNlKSBncmlkc3RlcjogR3JpZHN0ZXJTZXJ2aWNlKSB7XG5cbiAgICAgICAgdGhpcy5ncmlkc3RlciA9IGdyaWRzdGVyO1xuICAgICAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICAgICAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50O1xuXG4gICAgICAgIHRoaXMuaXRlbSA9IChuZXcgR3JpZExpc3RJdGVtKCkpLnNldEZyb21Hcmlkc3Rlckl0ZW0odGhpcyk7XG5cbiAgICAgICAgLy8gaWYgZ3JpZHN0ZXIgaXMgaW5pdGlhbGl6ZWQgZG8gbm90IHNob3cgYW5pbWF0aW9uIG9uIG5ldyBncmlkLWl0ZW0gY29uc3RydWN0XG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgdGhpcy5wcmV2ZW50QW5pbWF0aW9uKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uSW5pdCgpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gT2JqZWN0LmFzc2lnbih0aGlzLmRlZmF1bHRPcHRpb25zLCB0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHRoaXMudyA9IHRoaXMudyB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdFdpZHRoO1xuICAgICAgICB0aGlzLmggPSB0aGlzLmggfHwgdGhpcy5vcHRpb25zLmRlZmF1bHRIZWlnaHQ7XG4gICAgICAgIHRoaXMud1NtID0gdGhpcy53U20gfHwgdGhpcy53O1xuICAgICAgICB0aGlzLmhTbSA9IHRoaXMuaFNtIHx8IHRoaXMuaDtcbiAgICAgICAgdGhpcy53TWQgPSB0aGlzLndNZCB8fCB0aGlzLnc7XG4gICAgICAgIHRoaXMuaE1kID0gdGhpcy5oTWQgfHwgdGhpcy5oO1xuICAgICAgICB0aGlzLndMZyA9IHRoaXMud0xnIHx8IHRoaXMudztcbiAgICAgICAgdGhpcy5oTGcgPSB0aGlzLmhMZyB8fCB0aGlzLmg7XG4gICAgICAgIHRoaXMud1hsID0gdGhpcy53WGwgfHwgdGhpcy53O1xuICAgICAgICB0aGlzLmhYbCA9IHRoaXMuaFhsIHx8IHRoaXMuaDtcblxuICAgICAgICBpZiAodGhpcy5ncmlkc3Rlci5pc0luaXRpYWxpemVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0UG9zaXRpb25zT25JdGVtKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWRzdGVyLnJlZ2lzdGVySXRlbSh0aGlzLml0ZW0pO1xuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuY2FsY3VsYXRlQ2VsbFNpemUoKTtcbiAgICAgICAgdGhpcy5pdGVtLmFwcGx5U2l6ZSgpO1xuICAgICAgICB0aGlzLml0ZW0uYXBwbHlQb3NpdGlvbigpO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMuZHJhZ0FuZERyb3AgJiYgdGhpcy5kcmFnQW5kRHJvcCkge1xuICAgICAgICAgICAgdGhpcy5lbmFibGVEcmFnRHJvcCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuaXNJbml0aWFsaXplZCgpKSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLnJlbmRlcigpO1xuICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci51cGRhdGVDYWNoZWRJdGVtcygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgICAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZSAmJiB0aGlzLml0ZW0ucmVzaXphYmxlKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZVJlc2l6YWJsZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcykge1xuICAgICAgICBpZiAoIXRoaXMuZ3JpZHN0ZXIuZ3JpZExpc3QpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVyZW5kZXIgPSBmYWxzZTtcblxuICAgICAgICBbJ3cnLCAuLi5PYmplY3Qua2V5cyhHcmlkTGlzdEl0ZW0uV19QUk9QRVJUWV9NQVApLm1hcChicmVha3BvaW50ID0+IEdyaWRMaXN0SXRlbS5XX1BST1BFUlRZX01BUFticmVha3BvaW50XSldXG4gICAgICAgIC5maWx0ZXIocHJvcE5hbWUgPT4gY2hhbmdlc1twcm9wTmFtZV0gJiYgIWNoYW5nZXNbcHJvcE5hbWVdLmlzRmlyc3RDaGFuZ2UoKSlcbiAgICAgICAgLmZvckVhY2goKHByb3BOYW1lOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VzW3Byb3BOYW1lXS5jdXJyZW50VmFsdWUgPiB0aGlzLm9wdGlvbnMubWF4V2lkdGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzW3Byb3BOYW1lXSA9IHRoaXMub3B0aW9ucy5tYXhXaWR0aDtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXNbcHJvcE5hbWUgKyAnQ2hhbmdlJ10uZW1pdCh0aGlzW3Byb3BOYW1lXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVyZW5kZXIgPSB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICBbJ2gnLCAuLi5PYmplY3Qua2V5cyhHcmlkTGlzdEl0ZW0uSF9QUk9QRVJUWV9NQVApLm1hcChicmVha3BvaW50ID0+IEdyaWRMaXN0SXRlbS5IX1BST1BFUlRZX01BUFticmVha3BvaW50XSldXG4gICAgICAgICAgICAuZmlsdGVyKHByb3BOYW1lID0+IGNoYW5nZXNbcHJvcE5hbWVdICYmICFjaGFuZ2VzW3Byb3BOYW1lXS5pc0ZpcnN0Q2hhbmdlKCkpXG4gICAgICAgICAgICAuZm9yRWFjaCgocHJvcE5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VzW3Byb3BOYW1lXS5jdXJyZW50VmFsdWUgPiB0aGlzLm9wdGlvbnMubWF4SGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXNbcHJvcE5hbWVdID0gdGhpcy5vcHRpb25zLm1heEhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzW3Byb3BOYW1lICsgJ0NoYW5nZSddLmVtaXQodGhpc1twcm9wTmFtZV0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVyZW5kZXIgPSB0cnVlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgWyd4JywgJ3knLFxuICAgICAgICAuLi5PYmplY3Qua2V5cyhHcmlkTGlzdEl0ZW0uWF9QUk9QRVJUWV9NQVApLm1hcChicmVha3BvaW50ID0+IEdyaWRMaXN0SXRlbS5YX1BST1BFUlRZX01BUFticmVha3BvaW50XSksXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKEdyaWRMaXN0SXRlbS5ZX1BST1BFUlRZX01BUCkubWFwKGJyZWFrcG9pbnQgPT4gR3JpZExpc3RJdGVtLllfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdKV1cbiAgICAgICAgICAgIC5maWx0ZXIocHJvcE5hbWUgPT4gY2hhbmdlc1twcm9wTmFtZV0gJiYgIWNoYW5nZXNbcHJvcE5hbWVdLmlzRmlyc3RDaGFuZ2UoKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChwcm9wTmFtZTogc3RyaW5nKSA9PiByZXJlbmRlciA9IHRydWUpO1xuXG4gICAgICAgIGlmIChjaGFuZ2VzWydkcmFnQW5kRHJvcCddICYmICFjaGFuZ2VzWydkcmFnQW5kRHJvcCddLmlzRmlyc3RDaGFuZ2UoKSkge1xuICAgICAgICAgICAgaWYgKGNoYW5nZXNbJ2RyYWdBbmREcm9wJ10uY3VycmVudFZhbHVlICYmIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnQW5kRHJvcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlRHJhZ0Ryb3AoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlRHJhZ2dhYmxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoYW5nZXNbJ3Jlc2l6YWJsZSddICYmICFjaGFuZ2VzWydyZXNpemFibGUnXS5pc0ZpcnN0Q2hhbmdlKCkpIHtcbiAgICAgICAgICAgIGlmIChjaGFuZ2VzWydyZXNpemFibGUnXS5jdXJyZW50VmFsdWUgJiYgdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzYWJsZVJlc2l6YWJsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlcmVuZGVyICYmIHRoaXMuZ3JpZHN0ZXIuZ3JpZHN0ZXJDb21wb25lbnQuaXNSZWFkeSkge1xuICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5kZWJvdW5jZVJlbmRlclN1YmplY3QubmV4dChudWxsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nT25EZXN0cm95KCkge1xuICAgICAgICB0aGlzLmdyaWRzdGVyLnJlbW92ZUl0ZW0odGhpcy5pdGVtKTtcbiAgICAgICAgdGhpcy5ncmlkc3Rlci5pdGVtUmVtb3ZlU3ViamVjdC5uZXh0KHRoaXMuaXRlbSk7XG5cbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLmZvckVhY2goKHN1YjogU3Vic2NyaXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZGlzYWJsZURyYWdnYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc2FibGVSZXNpemFibGUoKTtcbiAgICB9XG5cbiAgICB1cGRhdGVFbGVtZW5ldFBvc2l0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5ncmlkc3Rlci5vcHRpb25zLnVzZUNTU1RyYW5zZm9ybXMpIHtcbiAgICAgICAgICAgIHV0aWxzLnNldFRyYW5zZm9ybSh0aGlzLiRlbGVtZW50LCB7eDogdGhpcy5fcG9zaXRpb25YLCB5OiB0aGlzLl9wb3NpdGlvbll9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzLnNldENzc0VsZW1lbnRQb3NpdGlvbih0aGlzLiRlbGVtZW50LCB7eDogdGhpcy5fcG9zaXRpb25YLCB5OiB0aGlzLl9wb3NpdGlvbll9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFBvc2l0aW9uc09uSXRlbSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW0uaGFzUG9zaXRpb25zKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50KSkge1xuICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbnNGb3JHcmlkKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyT3B0aW9ucy5yZXNwb25zaXZlT3B0aW9uc1xuICAgICAgICAgICAgLmZpbHRlcigob3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucykgPT4gIXRoaXMuaXRlbS5oYXNQb3NpdGlvbnMob3B0aW9ucy5icmVha3BvaW50KSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSA9PiB0aGlzLnNldFBvc2l0aW9uc0ZvckdyaWQob3B0aW9ucykpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlbmFibGVSZXNpemFibGUoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5nZXRSZXNpemVIYW5kbGVycygpLmZvckVhY2goKGhhbmRsZXIpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXJlY3Rpb24gPSB0aGlzLmdldFJlc2l6ZURpcmVjdGlvbihoYW5kbGVyKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc1Jlc2l6YWJsZUhhbmRsZShkaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZHJhZ2dhYmxlID0gbmV3IERyYWdnYWJsZShoYW5kbGVyLCB0aGlzLmdldFJlc2l6YWJsZU9wdGlvbnMoKSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRFdmVudDtcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnREYXRhO1xuICAgICAgICAgICAgICAgIGxldCBjdXJzb3JUb0VsZW1lbnRQb3NpdGlvbjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGRyYWdTdGFydFN1YiA9IGRyYWdnYWJsZS5kcmFnU3RhcnRcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQ6IERyYWdnYWJsZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzUmVzaXppbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRFdmVudCA9IGV2ZW50O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0YSA9IHRoaXMuY3JlYXRlUmVzaXplU3RhcnRPYmplY3QoZGlyZWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JUb0VsZW1lbnRQb3NpdGlvbiA9IGV2ZW50LmdldFJlbGF0aXZlQ29vcmRpbmF0ZXModGhpcy4kZWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9uUmVzaXplU3RhcnQodGhpcy5pdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uU3RhcnQoJ3Jlc2l6ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZHJhZ1N1YiA9IGRyYWdnYWJsZS5kcmFnTW92ZVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChldmVudDogRHJhZ2dhYmxlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcm9sbERhdGEgPSB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyU2Nyb2xsRGF0YTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNpemVFbGVtZW50KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREYXRhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHg6IGV2ZW50LmNsaWVudFggLSBjdXJzb3JUb0VsZW1lbnRQb3NpdGlvbi54IC0gdGhpcy5ncmlkc3Rlci5ncmlkc3RlclJlY3QubGVmdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeTogZXZlbnQuY2xpZW50WSAtIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uLnkgLSB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyUmVjdC50b3BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0RXZlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW92ZUV2ZW50OiBldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEaWZmWDogc2Nyb2xsRGF0YS5zY3JvbGxMZWZ0IC0gc3RhcnREYXRhLnNjcm9sbExlZnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2Nyb2xsRGlmZlk6IHNjcm9sbERhdGEuc2Nyb2xsVG9wIC0gc3RhcnREYXRhLnNjcm9sbFRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25SZXNpemVEcmFnKHRoaXMuaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZHJhZ1N0b3BTdWIgPSBkcmFnZ2FibGUuZHJhZ1N0b3BcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzUmVzaXppbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25SZXNpemVTdG9wKHRoaXMuaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVuZCgncmVzaXplJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbnMgPSB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbnMuY29uY2F0KFtkcmFnU3RhcnRTdWIsIGRyYWdTdWIsIGRyYWdTdG9wU3ViXSk7XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzYWJsZVJlc2l6YWJsZSgpIHtcbiAgICAgICAgdGhpcy5yZXNpemVTdWJzY3JpcHRpb25zLmZvckVhY2goKHN1YjogU3Vic2NyaXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVzaXplU3Vic2NyaXB0aW9ucyA9IFtdO1xuXG4gICAgICAgIFtdLmZvckVhY2guY2FsbCh0aGlzLiRlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyJyksIChoYW5kbGVyKSA9PiB7XG4gICAgICAgICAgICBoYW5kbGVyLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGVuYWJsZURyYWdEcm9wKCkge1xuICAgICAgICBpZiAodGhpcy5kcmFnU3Vic2NyaXB0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnpvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgICAgICAgbGV0IGN1cnNvclRvRWxlbWVudFBvc2l0aW9uO1xuXG4gICAgICAgICAgICBjb25zdCBkcmFnZ2FibGUgPSBuZXcgRHJhZ2dhYmxlKHRoaXMuJGVsZW1lbnQsIHRoaXMuZ2V0RHJhZ2dhYmxlT3B0aW9ucygpKTtcblxuICAgICAgICAgICAgY29uc3QgZHJhZ1N0YXJ0U3ViID0gZHJhZ2dhYmxlLmRyYWdTdGFydFxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKGV2ZW50OiBEcmFnZ2FibGVFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnpvbmUucnVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25TdGFydCh0aGlzLml0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc0RyYWdnaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25TdGFydCgnZHJhZycpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJzb3JUb0VsZW1lbnRQb3NpdGlvbiA9IGV2ZW50LmdldFJlbGF0aXZlQ29vcmRpbmF0ZXModGhpcy4kZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBkcmFnU3ViID0gZHJhZ2dhYmxlLmRyYWdNb3ZlXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQ6IERyYWdnYWJsZUV2ZW50KSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSAoZXZlbnQuY2xpZW50WSAtIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uLnkgLVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkc3RlclJlY3QudG9wKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSAoZXZlbnQuY2xpZW50WCAtIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uLnggLVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5ncmlkc3RlclJlY3QubGVmdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVuZXRQb3NpdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25EcmFnKHRoaXMuaXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRyYWdTdG9wU3ViID0gZHJhZ2dhYmxlLmRyYWdTdG9wXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vblN0b3AodGhpcy5pdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuZGVib3VuY2VSZW5kZXJTdWJqZWN0Lm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25FbmQoJ2RyYWcnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuZHJhZ1N1YnNjcmlwdGlvbnMgPSB0aGlzLmRyYWdTdWJzY3JpcHRpb25zLmNvbmNhdChbZHJhZ1N0YXJ0U3ViLCBkcmFnU3ViLCBkcmFnU3RvcFN1Yl0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzYWJsZURyYWdnYWJsZSgpIHtcbiAgICAgICAgdGhpcy5kcmFnU3Vic2NyaXB0aW9ucy5mb3JFYWNoKChzdWI6IFN1YnNjcmlwdGlvbikgPT4ge1xuICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRyYWdTdWJzY3JpcHRpb25zID0gW107XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRSZXNpemVIYW5kbGVycygpOiBIVE1MRWxlbWVudFtdICB7XG4gICAgICAgIHJldHVybiBbXS5maWx0ZXIuY2FsbCh0aGlzLiRlbGVtZW50LmNoaWxkcmVuWzBdLmNoaWxkcmVuLCAoZWwpID0+IHtcblxuICAgICAgICAgICAgcmV0dXJuIGVsLmNsYXNzTGlzdC5jb250YWlucygnZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlcicpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldERyYWdnYWJsZU9wdGlvbnMoKSB7XG4gICAgICAgIHJldHVybiB7IHNjcm9sbERpcmVjdGlvbjogdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRpcmVjdGlvbiwgLi4udGhpcy5ncmlkc3Rlci5kcmFnZ2FibGVPcHRpb25zIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRSZXNpemFibGVPcHRpb25zKCkge1xuICAgICAgICBjb25zdCByZXNpemFibGVPcHRpb25zOiBhbnkgPSB7fTtcblxuICAgICAgICBpZiAodGhpcy5ncmlkc3Rlci5kcmFnZ2FibGVPcHRpb25zLnNjcm9sbCB8fCB0aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMuc2Nyb2xsID09PSBmYWxzZSkge1xuICAgICAgICAgICAgcmVzaXphYmxlT3B0aW9ucy5zY3JvbGwgPSB0aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMuc2Nyb2xsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMuc2Nyb2xsRWRnZSkge1xuICAgICAgICAgICAgcmVzaXphYmxlT3B0aW9ucy5zY3JvbGxFZGdlID0gdGhpcy5ncmlkc3Rlci5kcmFnZ2FibGVPcHRpb25zLnNjcm9sbEVkZ2U7XG4gICAgICAgIH1cblxuICAgICAgICByZXNpemFibGVPcHRpb25zLnNjcm9sbERpcmVjdGlvbiA9IHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kaXJlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIHJlc2l6YWJsZU9wdGlvbnM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYXNSZXNpemFibGVIYW5kbGUoZGlyZWN0aW9uOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgaXNJdGVtUmVzaXphYmxlID0gdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6YWJsZSAmJiB0aGlzLml0ZW0ucmVzaXphYmxlO1xuICAgICAgICBjb25zdCByZXNpemVIYW5kbGVzID0gdGhpcy5ncmlkc3Rlci5vcHRpb25zLnJlc2l6ZUhhbmRsZXM7XG5cbiAgICAgICAgcmV0dXJuIGlzSXRlbVJlc2l6YWJsZSAmJiAoIXJlc2l6ZUhhbmRsZXMgfHwgKHJlc2l6ZUhhbmRsZXMgJiYgISFyZXNpemVIYW5kbGVzW2RpcmVjdGlvbl0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFBvc2l0aW9uc0ZvckdyaWQob3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucykge1xuICAgICAgICBsZXQgeCwgeTtcblxuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuZmluZFBvc2l0aW9uKG9wdGlvbnMpO1xuICAgICAgICB4ID0gb3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJyA/IHBvc2l0aW9uWzBdIDogcG9zaXRpb25bMV07XG4gICAgICAgIHkgPSBvcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnID8gcG9zaXRpb25bMV0gOiBwb3NpdGlvblswXTtcblxuICAgICAgICB0aGlzLml0ZW0uc2V0VmFsdWVYKHgsIG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgIHRoaXMuaXRlbS5zZXRWYWx1ZVkoeSwgb3B0aW9ucy5icmVha3BvaW50KTtcblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaXRlbS50cmlnZ2VyQ2hhbmdlWChvcHRpb25zLmJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgdGhpcy5pdGVtLnRyaWdnZXJDaGFuZ2VZKG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZmluZFBvc2l0aW9uKG9wdGlvbnM6IElHcmlkc3Rlck9wdGlvbnMpOiBBcnJheTxudW1iZXI+IHtcbiAgICAgICAgY29uc3QgZ3JpZExpc3QgPSBuZXcgR3JpZExpc3QoXG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLml0ZW1zLm1hcChpdGVtID0+IGl0ZW0uY29weUZvckJyZWFrcG9pbnQob3B0aW9ucy5icmVha3BvaW50KSksXG4gICAgICAgICAgICBvcHRpb25zXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGdyaWRMaXN0LmZpbmRQb3NpdGlvbkZvckl0ZW0odGhpcy5pdGVtLCB7eDogMCwgeTogMH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgY3JlYXRlUmVzaXplU3RhcnRPYmplY3QoZGlyZWN0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgc2Nyb2xsRGF0YSA9IHRoaXMuZ3JpZHN0ZXIuZ3JpZHN0ZXJTY3JvbGxEYXRhO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0b3A6IHRoaXMucG9zaXRpb25ZLFxuICAgICAgICAgICAgbGVmdDogdGhpcy5wb3NpdGlvblgsXG4gICAgICAgICAgICBoZWlnaHQ6IHBhcnNlSW50KHRoaXMuJGVsZW1lbnQuc3R5bGUuaGVpZ2h0LCAxMCksXG4gICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQodGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCwgMTApLFxuICAgICAgICAgICAgbWluWDogTWF0aC5tYXgodGhpcy5pdGVtLnggKyB0aGlzLml0ZW0udyAtIHRoaXMub3B0aW9ucy5tYXhXaWR0aCwgMCksXG4gICAgICAgICAgICBtYXhYOiB0aGlzLml0ZW0ueCArIHRoaXMuaXRlbS53IC0gdGhpcy5vcHRpb25zLm1pbldpZHRoLFxuICAgICAgICAgICAgbWluWTogTWF0aC5tYXgodGhpcy5pdGVtLnkgKyB0aGlzLml0ZW0uaCAtIHRoaXMub3B0aW9ucy5tYXhIZWlnaHQsIDApLFxuICAgICAgICAgICAgbWF4WTogdGhpcy5pdGVtLnkgKyB0aGlzLml0ZW0uaCAtIHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXG4gICAgICAgICAgICBtaW5XOiB0aGlzLm9wdGlvbnMubWluV2lkdGgsXG4gICAgICAgICAgICBtYXhXOiBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMubWF4V2lkdGgsXG4gICAgICAgICAgICAgICAgKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kaXJlY3Rpb24gPT09ICd2ZXJ0aWNhbCcgJiYgZGlyZWN0aW9uLmluZGV4T2YoJ3cnKSA8IDApID9cbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMubGFuZXMgLSB0aGlzLml0ZW0ueCA6IHRoaXMub3B0aW9ucy5tYXhXaWR0aCxcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb24uaW5kZXhPZigndycpID49IDAgP1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbS54ICsgdGhpcy5pdGVtLncgOiB0aGlzLm9wdGlvbnMubWF4V2lkdGhcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBtaW5IOiB0aGlzLm9wdGlvbnMubWluSGVpZ2h0LFxuICAgICAgICAgICAgbWF4SDogTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLm1heEhlaWdodCxcbiAgICAgICAgICAgICAgICAodGhpcy5ncmlkc3Rlci5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnICYmIGRpcmVjdGlvbi5pbmRleE9mKCduJykgPCAwKSA/XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmxhbmVzIC0gdGhpcy5pdGVtLnkgOiB0aGlzLm9wdGlvbnMubWF4SGVpZ2h0LFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbi5pbmRleE9mKCduJykgPj0gMCA/XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtLnkgKyB0aGlzLml0ZW0uaCA6IHRoaXMub3B0aW9ucy5tYXhIZWlnaHRcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzY3JvbGxMZWZ0OiBzY3JvbGxEYXRhLnNjcm9sbExlZnQsXG4gICAgICAgICAgICBzY3JvbGxUb3A6IHNjcm9sbERhdGEuc2Nyb2xsVG9wXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkVuZChhY3Rpb25UeXBlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5lbmQuZW1pdCh7YWN0aW9uOiBhY3Rpb25UeXBlLCBpdGVtOiB0aGlzLml0ZW19KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uU3RhcnQoYWN0aW9uVHlwZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc3RhcnQuZW1pdCh7YWN0aW9uOiBhY3Rpb25UeXBlLCBpdGVtOiB0aGlzLml0ZW19KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBc3NpZ24gY2xhc3MgZm9yIHNob3J0IHdoaWxlIHRvIHByZXZlbnQgYW5pbWF0aW9uIG9mIGdyaWQgaXRlbSBjb21wb25lbnRcbiAgICAgKi9cbiAgICBwcml2YXRlIHByZXZlbnRBbmltYXRpb24oKTogR3JpZHN0ZXJJdGVtQ29tcG9uZW50IHtcbiAgICAgICAgdGhpcy4kZWxlbWVudC5jbGFzc0xpc3QuYWRkKCduby10cmFuc2l0aW9uJyk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCduby10cmFuc2l0aW9uJyk7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRSZXNpemVEaXJlY3Rpb24oaGFuZGxlcjogRWxlbWVudCk6IHN0cmluZyB7XG4gICAgICAgIGZvciAobGV0IGkgPSBoYW5kbGVyLmNsYXNzTGlzdC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKGhhbmRsZXIuY2xhc3NMaXN0W2ldLm1hdGNoKCdoYW5kbGUtJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGFuZGxlci5jbGFzc0xpc3RbaV0uc3BsaXQoJy0nKVsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzaXplRWxlbWVudChjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICAvLyBub3J0aFxuICAgICAgICBpZiAoY29uZmlnLmRpcmVjdGlvbi5pbmRleE9mKCduJykgPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5yZXNpemVUb05vcnRoKGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gd2VzdFxuICAgICAgICBpZiAoY29uZmlnLmRpcmVjdGlvbi5pbmRleE9mKCd3JykgPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5yZXNpemVUb1dlc3QoY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlYXN0XG4gICAgICAgIGlmIChjb25maWcuZGlyZWN0aW9uLmluZGV4T2YoJ2UnKSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZVRvRWFzdChjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNvdXRoXG4gICAgICAgIGlmIChjb25maWcuZGlyZWN0aW9uLmluZGV4T2YoJ3MnKSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZVRvU291dGgoY29uZmlnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzaXplVG9Ob3J0aChjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBjb25maWcuc3RhcnREYXRhLmhlaWdodCArIGNvbmZpZy5zdGFydEV2ZW50LmNsaWVudFkgLVxuICAgICAgICAgICAgY29uZmlnLm1vdmVFdmVudC5jbGllbnRZIC0gY29uZmlnLnNjcm9sbERpZmZZO1xuXG4gICAgICAgIGlmIChoZWlnaHQgPCAoY29uZmlnLnN0YXJ0RGF0YS5taW5IICogdGhpcy5ncmlkc3Rlci5jZWxsSGVpZ2h0KSkge1xuICAgICAgICAgICAgdGhpcy5zZXRNaW5IZWlnaHQoJ24nLCBjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlaWdodCA+IChjb25maWcuc3RhcnREYXRhLm1heEggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1heEhlaWdodCgnbicsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IGNvbmZpZy5wb3NpdGlvbi55O1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNpemVUb1dlc3QoY29uZmlnOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBjb25maWcuc3RhcnREYXRhLndpZHRoICsgY29uZmlnLnN0YXJ0RXZlbnQuY2xpZW50WCAtXG4gICAgICAgICAgICBjb25maWcubW92ZUV2ZW50LmNsaWVudFggLSBjb25maWcuc2Nyb2xsRGlmZlg7XG5cbiAgICAgICAgaWYgKHdpZHRoIDwgKGNvbmZpZy5zdGFydERhdGEubWluVyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRNaW5XaWR0aCgndycsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAod2lkdGggPiAoY29uZmlnLnN0YXJ0RGF0YS5tYXhXICogdGhpcy5ncmlkc3Rlci5jZWxsV2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1heFdpZHRoKCd3JywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25YID0gY29uZmlnLnBvc2l0aW9uLng7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVsZW1lbmV0UG9zaXRpb24oKTtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc2l6ZVRvRWFzdChjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCB3aWR0aCA9IGNvbmZpZy5zdGFydERhdGEud2lkdGggKyBjb25maWcubW92ZUV2ZW50LmNsaWVudFggLVxuICAgICAgICAgICAgY29uZmlnLnN0YXJ0RXZlbnQuY2xpZW50WCArIGNvbmZpZy5zY3JvbGxEaWZmWDtcblxuICAgICAgICBpZiAod2lkdGggPiAoY29uZmlnLnN0YXJ0RGF0YS5tYXhXICogdGhpcy5ncmlkc3Rlci5jZWxsV2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1heFdpZHRoKCdlJywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh3aWR0aCA8IChjb25maWcuc3RhcnREYXRhLm1pblcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWluV2lkdGgoJ2UnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzaXplVG9Tb3V0aChjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBjb25maWcuc3RhcnREYXRhLmhlaWdodCArIGNvbmZpZy5tb3ZlRXZlbnQuY2xpZW50WSAtXG4gICAgICAgICAgICBjb25maWcuc3RhcnRFdmVudC5jbGllbnRZICsgY29uZmlnLnNjcm9sbERpZmZZO1xuXG4gICAgICAgIGlmIChoZWlnaHQgPiBjb25maWcuc3RhcnREYXRhLm1heEggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF4SGVpZ2h0KCdzJywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmIChoZWlnaHQgPCBjb25maWcuc3RhcnREYXRhLm1pbkggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWluSGVpZ2h0KCdzJywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0TWluSGVpZ2h0KGRpcmVjdGlvbjogc3RyaW5nLCBjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnbicpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKGNvbmZpZy5zdGFydERhdGEubWluSCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBjb25maWcuc3RhcnREYXRhLm1heFkgKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLmhlaWdodCA9IChjb25maWcuc3RhcnREYXRhLm1pbkggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0TWluV2lkdGgoZGlyZWN0aW9uOiBzdHJpbmcsIGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd3Jykge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IChjb25maWcuc3RhcnREYXRhLm1pblcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBjb25maWcuc3RhcnREYXRhLm1heFggKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aDtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVuZXRQb3NpdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IChjb25maWcuc3RhcnREYXRhLm1pblcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRNYXhIZWlnaHQoZGlyZWN0aW9uOiBzdHJpbmcsIGNvbmZpZzogYW55KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ24nKSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLmhlaWdodCA9IChjb25maWcuc3RhcnREYXRhLm1heEggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpICsgJ3B4JztcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25ZID0gY29uZmlnLnN0YXJ0RGF0YS5taW5ZICogdGhpcy5ncmlkc3Rlci5jZWxsSGVpZ2h0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAoY29uZmlnLnN0YXJ0RGF0YS5tYXhIICogdGhpcy5ncmlkc3Rlci5jZWxsSGVpZ2h0KSArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldE1heFdpZHRoKGRpcmVjdGlvbjogc3RyaW5nLCBjb25maWc6IGFueSk6IHZvaWQge1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICd3Jykge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IChjb25maWcuc3RhcnREYXRhLm1heFcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBjb25maWcuc3RhcnREYXRhLm1pblggKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aDtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVuZXRQb3NpdGlvbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IChjb25maWcuc3RhcnREYXRhLm1heFcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19