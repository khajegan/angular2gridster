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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.7", ngImport: i0, type: GridsterItemComponent, deps: [{ token: i0.NgZone }, { token: i1.GridsterPrototypeService }, { token: ElementRef }, { token: GridsterService }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.0.7", type: GridsterItemComponent, selector: "ngx-gridster-item", inputs: { x: "x", y: "y", xSm: "xSm", ySm: "ySm", xMd: "xMd", yMd: "yMd", xLg: "xLg", yLg: "yLg", xXl: "xXl", yXl: "yXl", w: "w", h: "h", wSm: "wSm", hSm: "hSm", wMd: "wMd", hMd: "hMd", wLg: "wLg", hLg: "hLg", wXl: "wXl", hXl: "hXl", dragAndDrop: "dragAndDrop", resizable: "resizable", options: "options" }, outputs: { xChange: "xChange", yChange: "yChange", xSmChange: "xSmChange", ySmChange: "ySmChange", xMdChange: "xMdChange", yMdChange: "yMdChange", xLgChange: "xLgChange", yLgChange: "yLgChange", xXlChange: "xXlChange", yXlChange: "yXlChange", wChange: "wChange", hChange: "hChange", wSmChange: "wSmChange", hSmChange: "hSmChange", wMdChange: "wMdChange", hMdChange: "hMdChange", wLgChange: "wLgChange", hLgChange: "hLgChange", wXlChange: "wXlChange", hXlChange: "hXlChange", change: "change", start: "start", end: "end" }, host: { properties: { "class.is-dragging": "this.isDragging", "class.is-resizing": "this.isResizing" } }, usesOnChanges: true, ngImport: i0, template: `<div class="gridster-item-inner">
      <ng-content></ng-content>
      <div class="gridster-item-resizable-handler handle-s"></div>
      <div class="gridster-item-resizable-handler handle-e"></div>
      <div class="gridster-item-resizable-handler handle-n"></div>
      <div class="gridster-item-resizable-handler handle-w"></div>
      <div class="gridster-item-resizable-handler handle-se"></div>
      <div class="gridster-item-resizable-handler handle-ne"></div>
      <div class="gridster-item-resizable-handler handle-sw"></div>
      <div class="gridster-item-resizable-handler handle-nw"></div>
    </div>`, isInline: true, styles: ["ngx-gridster-item{display:block;position:absolute;top:0;left:0;z-index:1;transition:none}.gridster--ready ngx-gridster-item{transition:all .2s ease;transition-property:left,top}.gridster--ready.css-transform ngx-gridster-item{transition-property:transform}.gridster--ready ngx-gridster-item.is-dragging,.gridster--ready ngx-gridster-item.is-resizing{transition:none;z-index:9999}ngx-gridster-item.no-transition{transition:none}ngx-gridster-item .gridster-item-resizable-handler{position:absolute;z-index:2;display:none}ngx-gridster-item .gridster-item-resizable-handler.handle-n{cursor:n-resize;height:10px;right:0;top:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-e{cursor:e-resize;width:10px;bottom:0;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-s{cursor:s-resize;height:10px;right:0;bottom:0;left:0}ngx-gridster-item .gridster-item-resizable-handler.handle-w{cursor:w-resize;width:10px;left:0;top:0;bottom:0}ngx-gridster-item .gridster-item-resizable-handler.handle-ne{cursor:ne-resize;width:10px;height:10px;right:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-nw{cursor:nw-resize;width:10px;height:10px;left:0;top:0}ngx-gridster-item .gridster-item-resizable-handler.handle-se{cursor:se-resize;width:0;height:0;right:0;bottom:0;border-style:solid;border-width:0 0 10px 10px;border-color:transparent}ngx-gridster-item .gridster-item-resizable-handler.handle-sw{cursor:sw-resize;width:10px;height:10px;left:0;bottom:0}ngx-gridster-item:hover .gridster-item-resizable-handler.handle-se{border-color:transparent transparent #ccc}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush, encapsulation: i0.ViewEncapsulation.None }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.7", ngImport: i0, type: GridsterItemComponent, decorators: [{
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
        }], ctorParameters: () => [{ type: i0.NgZone }, { type: i1.GridsterPrototypeService }, { type: i0.ElementRef, decorators: [{
                    type: Inject,
                    args: [ElementRef]
                }] }, { type: i2.GridsterService, decorators: [{
                    type: Inject,
                    args: [GridsterService]
                }] }], propDecorators: { x: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXItaXRlbS5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyMmdyaWRzdGVyL3NyYy9saWIvZ3JpZHN0ZXItaXRlbS9ncmlkc3Rlci1pdGVtLmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsU0FBUyxFQUFVLFVBQVUsRUFBRSxNQUFNLEVBQVEsS0FBSyxFQUFFLE1BQU0sRUFDL0QsWUFBWSxFQUF1QyxXQUFXLEVBQzlELHVCQUF1QixFQUF5QixpQkFBaUIsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUc3RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFHdEQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRXhELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUUvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDaEQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7O0FBOEh2QyxNQUFNLE9BQU8scUJBQXFCO0lBMkU5QixJQUFJLFNBQVMsQ0FBQyxLQUFhO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFDRCxJQUFJLFNBQVM7UUFDVCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDM0IsQ0FBQztJQUNELElBQUksU0FBUyxDQUFDLEtBQWE7UUFDdkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7SUFDNUIsQ0FBQztJQUNELElBQUksU0FBUztRQUNULE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBZ0JELFlBQW9CLElBQVksRUFDWix3QkFBa0QsRUFDdEMsVUFBc0IsRUFDakIsUUFBeUI7UUFIMUMsU0FBSSxHQUFKLElBQUksQ0FBUTtR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TztzQkFBaEIsTUFBTTtnQkFFRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFDRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFFRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFDRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFFRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFDRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFFRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFDRSxHQUFHO3NCQUFYLEtBQUs7Z0JBQ0ksU0FBUztzQkFBbEIsTUFBTTtnQkFFRyxNQUFNO3NCQUFmLE1BQU07Z0JBQ0csS0FBSztzQkFBZCxNQUFNO2dCQUNHLEdBQUc7c0JBQVosTUFBTTtnQkFFRSxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBRUcsT0FBTztzQkFBZixLQUFLO2dCQUk0QixVQUFVO3NCQUEzQyxXQUFXO3VCQUFDLG1CQUFtQjtnQkFDRSxVQUFVO3NCQUEzQyxXQUFXO3VCQUFDLG1CQUFtQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgT25Jbml0LCBFbGVtZW50UmVmLCBJbmplY3QsIEhvc3QsIElucHV0LCBPdXRwdXQsXG4gICAgRXZlbnRFbWl0dGVyLCBTaW1wbGVDaGFuZ2VzLCBPbkNoYW5nZXMsIE9uRGVzdHJveSwgSG9zdEJpbmRpbmcsXG4gICAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksIEFmdGVyVmlld0luaXQsIE5nWm9uZSwgVmlld0VuY2Fwc3VsYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQgeyBHcmlkc3RlclNlcnZpY2UgfSBmcm9tICcuLi9ncmlkc3Rlci5zZXJ2aWNlJztcbmltcG9ydCB7IEdyaWRzdGVyUHJvdG90eXBlU2VydmljZSB9IGZyb20gJy4uL2dyaWRzdGVyLXByb3RvdHlwZS9ncmlkc3Rlci1wcm90b3R5cGUuc2VydmljZSc7XG5cbmltcG9ydCB7IEdyaWRMaXN0SXRlbSB9IGZyb20gJy4uL2dyaWRMaXN0L0dyaWRMaXN0SXRlbSc7XG5pbXBvcnQgeyBEcmFnZ2FibGVFdmVudCB9IGZyb20gJy4uL3V0aWxzL0RyYWdnYWJsZUV2ZW50JztcbmltcG9ydCB7IERyYWdnYWJsZSB9IGZyb20gJy4uL3V0aWxzL2RyYWdnYWJsZSc7XG5pbXBvcnQgeyBJR3JpZHN0ZXJPcHRpb25zIH0gZnJvbSAnLi4vSUdyaWRzdGVyT3B0aW9ucyc7XG5pbXBvcnQgeyBHcmlkTGlzdCB9IGZyb20gJy4uL2dyaWRMaXN0L2dyaWRMaXN0JztcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSAnLi4vdXRpbHMvdXRpbHMnO1xuXG5AQ29tcG9uZW50KHtcbiAgICBzZWxlY3RvcjogJ25neC1ncmlkc3Rlci1pdGVtJyxcbiAgICB0ZW1wbGF0ZTogYDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLWlubmVyXCI+XG4gICAgICA8bmctY29udGVudD48L25nLWNvbnRlbnQ+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtc1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLWVcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1uXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtd1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLXNlXCI+PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciBoYW5kbGUtbmVcIj48L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyIGhhbmRsZS1zd1wiPjwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIgaGFuZGxlLW53XCI+PC9kaXY+XG4gICAgPC9kaXY+YCxcbiAgICBzdHlsZXM6IFtgXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0ge1xuICAgICAgICBkaXNwbGF5OiBibG9jaztcbiAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICB0b3A6IDA7XG4gICAgICAgIGxlZnQ6IDA7XG4gICAgICAgIHotaW5kZXg6IDE7XG4gICAgICAgIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTtcbiAgICAgICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICB9XG5cbiAgICAuZ3JpZHN0ZXItLXJlYWR5IG5neC1ncmlkc3Rlci1pdGVtIHtcbiAgICAgICAgdHJhbnNpdGlvbjogYWxsIDIwMG1zIGVhc2U7XG4gICAgICAgIHRyYW5zaXRpb24tcHJvcGVydHk6IGxlZnQsIHRvcDtcbiAgICB9XG5cbiAgICAuZ3JpZHN0ZXItLXJlYWR5LmNzcy10cmFuc2Zvcm0gbmd4LWdyaWRzdGVyLWl0ZW0gIHtcbiAgICAgICAgdHJhbnNpdGlvbi1wcm9wZXJ0eTogdHJhbnNmb3JtO1xuICAgIH1cblxuICAgIC5ncmlkc3Rlci0tcmVhZHkgbmd4LWdyaWRzdGVyLWl0ZW0uaXMtZHJhZ2dpbmcsXG4gICAgLmdyaWRzdGVyLS1yZWFkeSBuZ3gtZ3JpZHN0ZXItaXRlbS5pcy1yZXNpemluZyB7XG4gICAgICAgIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTtcbiAgICAgICAgdHJhbnNpdGlvbjogbm9uZTtcbiAgICAgICAgei1pbmRleDogOTk5OTtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbS5uby10cmFuc2l0aW9uIHtcbiAgICAgICAgLXdlYmtpdC10cmFuc2l0aW9uOiBub25lO1xuICAgICAgICB0cmFuc2l0aW9uOiBub25lO1xuICAgIH1cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlciB7XG4gICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgei1pbmRleDogMjtcbiAgICAgICAgZGlzcGxheTogbm9uZTtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtbiB7XG4gICAgICBjdXJzb3I6IG4tcmVzaXplO1xuICAgICAgaGVpZ2h0OiAxMHB4O1xuICAgICAgcmlnaHQ6IDA7XG4gICAgICB0b3A6IDA7XG4gICAgICBsZWZ0OiAwO1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS1lIHtcbiAgICAgIGN1cnNvcjogZS1yZXNpemU7XG4gICAgICB3aWR0aDogMTBweDtcbiAgICAgIGJvdHRvbTogMDtcbiAgICAgIHJpZ2h0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS1zIHtcbiAgICAgIGN1cnNvcjogcy1yZXNpemU7XG4gICAgICBoZWlnaHQ6IDEwcHg7XG4gICAgICByaWdodDogMDtcbiAgICAgIGJvdHRvbTogMDtcbiAgICAgIGxlZnQ6IDA7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIuaGFuZGxlLXcge1xuICAgICAgY3Vyc29yOiB3LXJlc2l6ZTtcbiAgICAgIHdpZHRoOiAxMHB4O1xuICAgICAgbGVmdDogMDtcbiAgICAgIHRvcDogMDtcbiAgICAgIGJvdHRvbTogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtbmUge1xuICAgICAgY3Vyc29yOiBuZS1yZXNpemU7XG4gICAgICB3aWR0aDogMTBweDtcbiAgICAgIGhlaWdodDogMTBweDtcbiAgICAgIHJpZ2h0OiAwO1xuICAgICAgdG9wOiAwO1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS1udyB7XG4gICAgICBjdXJzb3I6IG53LXJlc2l6ZTtcbiAgICAgIHdpZHRoOiAxMHB4O1xuICAgICAgaGVpZ2h0OiAxMHB4O1xuICAgICAgbGVmdDogMDtcbiAgICAgIHRvcDogMDtcbiAgICB9XG5cbiAgICBuZ3gtZ3JpZHN0ZXItaXRlbSAuZ3JpZHN0ZXItaXRlbS1yZXNpemFibGUtaGFuZGxlci5oYW5kbGUtc2Uge1xuICAgICAgY3Vyc29yOiBzZS1yZXNpemU7XG4gICAgICB3aWR0aDogMDtcbiAgICAgIGhlaWdodDogMDtcbiAgICAgIHJpZ2h0OiAwO1xuICAgICAgYm90dG9tOiAwO1xuICAgICAgYm9yZGVyLXN0eWxlOiBzb2xpZDtcbiAgICAgIGJvcmRlci13aWR0aDogMCAwIDEwcHggMTBweDtcbiAgICAgIGJvcmRlci1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgfVxuXG4gICAgbmd4LWdyaWRzdGVyLWl0ZW0gLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXIuaGFuZGxlLXN3IHtcbiAgICAgIGN1cnNvcjogc3ctcmVzaXplO1xuICAgICAgd2lkdGg6IDEwcHg7XG4gICAgICBoZWlnaHQ6IDEwcHg7XG4gICAgICBsZWZ0OiAwO1xuICAgICAgYm90dG9tOiAwO1xuICAgIH1cblxuICAgIG5neC1ncmlkc3Rlci1pdGVtOmhvdmVyIC5ncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyLmhhbmRsZS1zZSB7XG4gICAgICBib3JkZXItY29sb3I6IHRyYW5zcGFyZW50IHRyYW5zcGFyZW50ICNjY2NcbiAgICB9XG4gICAgYF0sXG4gICAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24uTm9uZVxufSlcbmV4cG9ydCBjbGFzcyBHcmlkc3Rlckl0ZW1Db21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcywgQWZ0ZXJWaWV3SW5pdCwgT25EZXN0cm95IHtcbiAgICBASW5wdXQoKSB4OiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHhDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgeTogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSB5Q2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgeFNtOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHhTbUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSB5U206IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgeVNtQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgeE1kOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHhNZENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSB5TWQ6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgeU1kQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgeExnOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHhMZ0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSB5TGc6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgeUxnQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgeFhsOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHhYbENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSB5WGw6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgeVhsQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG5cbiAgICBASW5wdXQoKSB3OiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHdDaGFuZ2UgPSBuZXcgRXZlbnRFbWl0dGVyPG51bWJlcj4odHJ1ZSk7XG4gICAgQElucHV0KCkgaDogbnVtYmVyO1xuICAgIEBPdXRwdXQoKSBoQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgd1NtOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHdTbUNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSBoU206IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgaFNtQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgd01kOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHdNZENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSBoTWQ6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgaE1kQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgd0xnOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHdMZ0NoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSBoTGc6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgaExnQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQElucHV0KCkgd1hsOiBudW1iZXI7XG4gICAgQE91dHB1dCgpIHdYbENoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8bnVtYmVyPih0cnVlKTtcbiAgICBASW5wdXQoKSBoWGw6IG51bWJlcjtcbiAgICBAT3V0cHV0KCkgaFhsQ2hhbmdlID0gbmV3IEV2ZW50RW1pdHRlcjxudW1iZXI+KHRydWUpO1xuXG4gICAgQE91dHB1dCgpIGNoYW5nZSA9IG5ldyBFdmVudEVtaXR0ZXI8YW55Pih0cnVlKTtcbiAgICBAT3V0cHV0KCkgc3RhcnQgPSBuZXcgRXZlbnRFbWl0dGVyPGFueT4odHJ1ZSk7XG4gICAgQE91dHB1dCgpIGVuZCA9IG5ldyBFdmVudEVtaXR0ZXI8YW55Pih0cnVlKTtcblxuICAgIEBJbnB1dCgpIGRyYWdBbmREcm9wID0gdHJ1ZTtcbiAgICBASW5wdXQoKSByZXNpemFibGUgPSB0cnVlO1xuXG4gICAgQElucHV0KCkgb3B0aW9uczogYW55ID0ge307XG5cbiAgICBhdXRvU2l6ZTogYm9vbGVhbjtcblxuICAgIEBIb3N0QmluZGluZygnY2xhc3MuaXMtZHJhZ2dpbmcnKSBpc0RyYWdnaW5nID0gZmFsc2U7XG4gICAgQEhvc3RCaW5kaW5nKCdjbGFzcy5pcy1yZXNpemluZycpIGlzUmVzaXppbmcgPSBmYWxzZTtcblxuICAgICRlbGVtZW50OiBIVE1MRWxlbWVudDtcbiAgICBlbGVtZW50UmVmOiBFbGVtZW50UmVmO1xuICAgIC8qKlxuICAgICAqIEdyaWRzdGVyIHByb3ZpZGVyIHNlcnZpY2VcbiAgICAgKi9cbiAgICBncmlkc3RlcjogR3JpZHN0ZXJTZXJ2aWNlO1xuXG4gICAgaXRlbTogR3JpZExpc3RJdGVtO1xuXG4gICAgc2V0IHBvc2l0aW9uWCh2YWx1ZTogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uWCA9IHZhbHVlO1xuICAgIH1cbiAgICBnZXQgcG9zaXRpb25YKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcG9zaXRpb25YO1xuICAgIH1cbiAgICBzZXQgcG9zaXRpb25ZKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgdGhpcy5fcG9zaXRpb25ZID0gdmFsdWU7XG4gICAgfVxuICAgIGdldCBwb3NpdGlvblkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9wb3NpdGlvblk7XG4gICAgfVxuICAgIHByaXZhdGUgX3Bvc2l0aW9uWDogbnVtYmVyO1xuICAgIHByaXZhdGUgX3Bvc2l0aW9uWTogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSBkZWZhdWx0T3B0aW9uczogYW55ID0ge1xuICAgICAgICBtaW5XaWR0aDogMSxcbiAgICAgICAgbWluSGVpZ2h0OiAxLFxuICAgICAgICBtYXhXaWR0aDogSW5maW5pdHksXG4gICAgICAgIG1heEhlaWdodDogSW5maW5pdHksXG4gICAgICAgIGRlZmF1bHRXaWR0aDogMSxcbiAgICAgICAgZGVmYXVsdEhlaWdodDogMVxuICAgIH07XG4gICAgcHJpdmF0ZSBzdWJzY3JpcHRpb25zOiBBcnJheTxTdWJzY3JpcHRpb24+ID0gW107XG4gICAgcHJpdmF0ZSBkcmFnU3Vic2NyaXB0aW9uczogQXJyYXk8U3Vic2NyaXB0aW9uPiA9IFtdO1xuICAgIHByaXZhdGUgcmVzaXplU3Vic2NyaXB0aW9uczogQXJyYXk8U3Vic2NyaXB0aW9uPiA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB6b25lOiBOZ1pvbmUsXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBncmlkc3RlclByb3RvdHlwZVNlcnZpY2U6IEdyaWRzdGVyUHJvdG90eXBlU2VydmljZSxcbiAgICAgICAgICAgICAgICBASW5qZWN0KEVsZW1lbnRSZWYpIGVsZW1lbnRSZWY6IEVsZW1lbnRSZWYsXG4gICAgICAgICAgICAgICAgQEluamVjdChHcmlkc3RlclNlcnZpY2UpIGdyaWRzdGVyOiBHcmlkc3RlclNlcnZpY2UpIHtcblxuICAgICAgICB0aGlzLmdyaWRzdGVyID0gZ3JpZHN0ZXI7XG4gICAgICAgIHRoaXMuZWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gICAgICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ7XG5cbiAgICAgICAgdGhpcy5pdGVtID0gKG5ldyBHcmlkTGlzdEl0ZW0oKSkuc2V0RnJvbUdyaWRzdGVySXRlbSh0aGlzKTtcblxuICAgICAgICAvLyBpZiBncmlkc3RlciBpcyBpbml0aWFsaXplZCBkbyBub3Qgc2hvdyBhbmltYXRpb24gb24gbmV3IGdyaWQtaXRlbSBjb25zdHJ1Y3RcbiAgICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuaXNJbml0aWFsaXplZCgpKSB7XG4gICAgICAgICAgICB0aGlzLnByZXZlbnRBbmltYXRpb24oKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5nT25Jbml0KCkge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHRoaXMuZGVmYXVsdE9wdGlvbnMsIHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgdGhpcy53ID0gdGhpcy53IHx8IHRoaXMub3B0aW9ucy5kZWZhdWx0V2lkdGg7XG4gICAgICAgIHRoaXMuaCA9IHRoaXMuaCB8fCB0aGlzLm9wdGlvbnMuZGVmYXVsdEhlaWdodDtcbiAgICAgICAgdGhpcy53U20gPSB0aGlzLndTbSB8fCB0aGlzLnc7XG4gICAgICAgIHRoaXMuaFNtID0gdGhpcy5oU20gfHwgdGhpcy5oO1xuICAgICAgICB0aGlzLndNZCA9IHRoaXMud01kIHx8IHRoaXMudztcbiAgICAgICAgdGhpcy5oTWQgPSB0aGlzLmhNZCB8fCB0aGlzLmg7XG4gICAgICAgIHRoaXMud0xnID0gdGhpcy53TGcgfHwgdGhpcy53O1xuICAgICAgICB0aGlzLmhMZyA9IHRoaXMuaExnIHx8IHRoaXMuaDtcbiAgICAgICAgdGhpcy53WGwgPSB0aGlzLndYbCB8fCB0aGlzLnc7XG4gICAgICAgIHRoaXMuaFhsID0gdGhpcy5oWGwgfHwgdGhpcy5oO1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRQb3NpdGlvbnNPbkl0ZW0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucmVnaXN0ZXJJdGVtKHRoaXMuaXRlbSk7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlci5jYWxjdWxhdGVDZWxsU2l6ZSgpO1xuICAgICAgICB0aGlzLml0ZW0uYXBwbHlTaXplKCk7XG4gICAgICAgIHRoaXMuaXRlbS5hcHBseVBvc2l0aW9uKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5kcmFnQW5kRHJvcCAmJiB0aGlzLmRyYWdBbmREcm9wKSB7XG4gICAgICAgICAgICB0aGlzLmVuYWJsZURyYWdEcm9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5ncmlkc3Rlci5pc0luaXRpYWxpemVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIucmVuZGVyKCk7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLnVwZGF0ZUNhY2hlZEl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ0FmdGVyVmlld0luaXQoKSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzaXphYmxlICYmIHRoaXMuaXRlbS5yZXNpemFibGUpIHtcbiAgICAgICAgICAgIHRoaXMuZW5hYmxlUmVzaXphYmxlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKSB7XG4gICAgICAgIGlmICghdGhpcy5ncmlkc3Rlci5ncmlkTGlzdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXJlbmRlciA9IGZhbHNlO1xuXG4gICAgICAgIFsndycsIC4uLk9iamVjdC5rZXlzKEdyaWRMaXN0SXRlbS5XX1BST1BFUlRZX01BUCkubWFwKGJyZWFrcG9pbnQgPT4gR3JpZExpc3RJdGVtLldfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdKV1cbiAgICAgICAgLmZpbHRlcihwcm9wTmFtZSA9PiBjaGFuZ2VzW3Byb3BOYW1lXSAmJiAhY2hhbmdlc1twcm9wTmFtZV0uaXNGaXJzdENoYW5nZSgpKVxuICAgICAgICAuZm9yRWFjaCgocHJvcE5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgaWYgKGNoYW5nZXNbcHJvcE5hbWVdLmN1cnJlbnRWYWx1ZSA+IHRoaXMub3B0aW9ucy5tYXhXaWR0aCkge1xuICAgICAgICAgICAgICAgIHRoaXNbcHJvcE5hbWVdID0gdGhpcy5vcHRpb25zLm1heFdpZHRoO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpc1twcm9wTmFtZSArICdDaGFuZ2UnXS5lbWl0KHRoaXNbcHJvcE5hbWVdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXJlbmRlciA9IHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIFsnaCcsIC4uLk9iamVjdC5rZXlzKEdyaWRMaXN0SXRlbS5IX1BST1BFUlRZX01BUCkubWFwKGJyZWFrcG9pbnQgPT4gR3JpZExpc3RJdGVtLkhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdKV1cbiAgICAgICAgICAgIC5maWx0ZXIocHJvcE5hbWUgPT4gY2hhbmdlc1twcm9wTmFtZV0gJiYgIWNoYW5nZXNbcHJvcE5hbWVdLmlzRmlyc3RDaGFuZ2UoKSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChwcm9wTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNoYW5nZXNbcHJvcE5hbWVdLmN1cnJlbnRWYWx1ZSA+IHRoaXMub3B0aW9ucy5tYXhIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1twcm9wTmFtZV0gPSB0aGlzLm9wdGlvbnMubWF4SGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXNbcHJvcE5hbWUgKyAnQ2hhbmdlJ10uZW1pdCh0aGlzW3Byb3BOYW1lXSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXJlbmRlciA9IHRydWU7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICBbJ3gnLCAneScsXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKEdyaWRMaXN0SXRlbS5YX1BST1BFUlRZX01BUCkubWFwKGJyZWFrcG9pbnQgPT4gR3JpZExpc3RJdGVtLlhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdKSxcbiAgICAgICAgLi4uT2JqZWN0LmtleXMoR3JpZExpc3RJdGVtLllfUFJPUEVSVFlfTUFQKS5tYXAoYnJlYWtwb2ludCA9PiBHcmlkTGlzdEl0ZW0uWV9QUk9QRVJUWV9NQVBbYnJlYWtwb2ludF0pXVxuICAgICAgICAgICAgLmZpbHRlcihwcm9wTmFtZSA9PiBjaGFuZ2VzW3Byb3BOYW1lXSAmJiAhY2hhbmdlc1twcm9wTmFtZV0uaXNGaXJzdENoYW5nZSgpKVxuICAgICAgICAgICAgLmZvckVhY2goKHByb3BOYW1lOiBzdHJpbmcpID0+IHJlcmVuZGVyID0gdHJ1ZSk7XG5cbiAgICAgICAgaWYgKGNoYW5nZXNbJ2RyYWdBbmREcm9wJ10gJiYgIWNoYW5nZXNbJ2RyYWdBbmREcm9wJ10uaXNGaXJzdENoYW5nZSgpKSB7XG4gICAgICAgICAgICBpZiAoY2hhbmdlc1snZHJhZ0FuZERyb3AnXS5jdXJyZW50VmFsdWUgJiYgdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRyYWdBbmREcm9wKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmFibGVEcmFnRHJvcCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc2FibGVEcmFnZ2FibGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoY2hhbmdlc1sncmVzaXphYmxlJ10gJiYgIWNoYW5nZXNbJ3Jlc2l6YWJsZSddLmlzRmlyc3RDaGFuZ2UoKSkge1xuICAgICAgICAgICAgaWYgKGNoYW5nZXNbJ3Jlc2l6YWJsZSddLmN1cnJlbnRWYWx1ZSAmJiB0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzaXphYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmFibGVSZXNpemFibGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNhYmxlUmVzaXphYmxlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVyZW5kZXIgJiYgdGhpcy5ncmlkc3Rlci5ncmlkc3RlckNvbXBvbmVudC5pc1JlYWR5KSB7XG4gICAgICAgICAgICB0aGlzLmdyaWRzdGVyLmRlYm91bmNlUmVuZGVyU3ViamVjdC5uZXh0KG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmdPbkRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIucmVtb3ZlSXRlbSh0aGlzLml0ZW0pO1xuICAgICAgICB0aGlzLmdyaWRzdGVyLml0ZW1SZW1vdmVTdWJqZWN0Lm5leHQodGhpcy5pdGVtKTtcblxuICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZm9yRWFjaCgoc3ViOiBTdWJzY3JpcHRpb24pID0+IHtcbiAgICAgICAgICAgIHN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNhYmxlRHJhZ2dhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzYWJsZVJlc2l6YWJsZSgpO1xuICAgIH1cblxuICAgIHVwZGF0ZUVsZW1lbmV0UG9zaXRpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMudXNlQ1NTVHJhbnNmb3Jtcykge1xuICAgICAgICAgICAgdXRpbHMuc2V0VHJhbnNmb3JtKHRoaXMuJGVsZW1lbnQsIHt4OiB0aGlzLl9wb3NpdGlvblgsIHk6IHRoaXMuX3Bvc2l0aW9uWX0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbHMuc2V0Q3NzRWxlbWVudFBvc2l0aW9uKHRoaXMuJGVsZW1lbnQsIHt4OiB0aGlzLl9wb3NpdGlvblgsIHk6IHRoaXMuX3Bvc2l0aW9uWX0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0UG9zaXRpb25zT25JdGVtKCkge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbS5oYXNQb3NpdGlvbnModGhpcy5ncmlkc3Rlci5vcHRpb25zLmJyZWFrcG9pbnQpKSB7XG4gICAgICAgICAgICB0aGlzLnNldFBvc2l0aW9uc0ZvckdyaWQodGhpcy5ncmlkc3Rlci5vcHRpb25zKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXIuZ3JpZHN0ZXJPcHRpb25zLnJlc3BvbnNpdmVPcHRpb25zXG4gICAgICAgICAgICAuZmlsdGVyKChvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSA9PiAhdGhpcy5pdGVtLmhhc1Bvc2l0aW9ucyhvcHRpb25zLmJyZWFrcG9pbnQpKVxuICAgICAgICAgICAgLmZvckVhY2goKG9wdGlvbnM6IElHcmlkc3Rlck9wdGlvbnMpID0+IHRoaXMuc2V0UG9zaXRpb25zRm9yR3JpZChvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGVuYWJsZVJlc2l6YWJsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVzaXplU3Vic2NyaXB0aW9ucy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdldFJlc2l6ZUhhbmRsZXJzKCkuZm9yRWFjaCgoaGFuZGxlcikgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IHRoaXMuZ2V0UmVzaXplRGlyZWN0aW9uKGhhbmRsZXIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaGFzUmVzaXphYmxlSGFuZGxlKGRpcmVjdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkcmFnZ2FibGUgPSBuZXcgRHJhZ2dhYmxlKGhhbmRsZXIsIHRoaXMuZ2V0UmVzaXphYmxlT3B0aW9ucygpKTtcblxuICAgICAgICAgICAgICAgIGxldCBzdGFydEV2ZW50O1xuICAgICAgICAgICAgICAgIGxldCBzdGFydERhdGE7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnNvclRvRWxlbWVudFBvc2l0aW9uO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgZHJhZ1N0YXJ0U3ViID0gZHJhZ2dhYmxlLmRyYWdTdGFydFxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChldmVudDogRHJhZ2dhYmxlRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNSZXNpemluZyA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnREYXRhID0gdGhpcy5jcmVhdGVSZXNpemVTdGFydE9iamVjdChkaXJlY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uID0gZXZlbnQuZ2V0UmVsYXRpdmVDb29yZGluYXRlcyh0aGlzLiRlbGVtZW50KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub25SZXNpemVTdGFydCh0aGlzLml0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25TdGFydCgncmVzaXplJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkcmFnU3ViID0gZHJhZ2dhYmxlLmRyYWdNb3ZlXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKGV2ZW50OiBEcmFnZ2FibGVFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2Nyb2xsRGF0YSA9IHRoaXMuZ3JpZHN0ZXIuZ3JpZHN0ZXJTY3JvbGxEYXRhO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc2l6ZUVsZW1lbnQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydERhdGEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeDogZXZlbnQuY2xpZW50WCAtIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uLnggLSB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyUmVjdC5sZWZ0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB5OiBldmVudC5jbGllbnRZIC0gY3Vyc29yVG9FbGVtZW50UG9zaXRpb24ueSAtIHRoaXMuZ3JpZHN0ZXIuZ3JpZHN0ZXJSZWN0LnRvcFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3ZlRXZlbnQ6IGV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjcm9sbERpZmZYOiBzY3JvbGxEYXRhLnNjcm9sbExlZnQgLSBzdGFydERhdGEuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY3JvbGxEaWZmWTogc2Nyb2xsRGF0YS5zY3JvbGxUb3AgLSBzdGFydERhdGEuc2Nyb2xsVG9wXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vblJlc2l6ZURyYWcodGhpcy5pdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBkcmFnU3RvcFN1YiA9IGRyYWdnYWJsZS5kcmFnU3RvcFxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNSZXNpemluZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vblJlc2l6ZVN0b3AodGhpcy5pdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uRW5kKCdyZXNpemUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMucmVzaXplU3Vic2NyaXB0aW9ucyA9IHRoaXMucmVzaXplU3Vic2NyaXB0aW9ucy5jb25jYXQoW2RyYWdTdGFydFN1YiwgZHJhZ1N1YiwgZHJhZ1N0b3BTdWJdKTtcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNhYmxlUmVzaXphYmxlKCkge1xuICAgICAgICB0aGlzLnJlc2l6ZVN1YnNjcmlwdGlvbnMuZm9yRWFjaCgoc3ViOiBTdWJzY3JpcHRpb24pID0+IHtcbiAgICAgICAgICAgIHN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZXNpemVTdWJzY3JpcHRpb25zID0gW107XG5cbiAgICAgICAgW10uZm9yRWFjaC5jYWxsKHRoaXMuJGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLmdyaWRzdGVyLWl0ZW0tcmVzaXphYmxlLWhhbmRsZXInKSwgKGhhbmRsZXIpID0+IHtcbiAgICAgICAgICAgIGhhbmRsZXIuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZW5hYmxlRHJhZ0Ryb3AoKSB7XG4gICAgICAgIGlmICh0aGlzLmRyYWdTdWJzY3JpcHRpb25zLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuem9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgICAgICAgICBsZXQgY3Vyc29yVG9FbGVtZW50UG9zaXRpb247XG5cbiAgICAgICAgICAgIGNvbnN0IGRyYWdnYWJsZSA9IG5ldyBEcmFnZ2FibGUodGhpcy4kZWxlbWVudCwgdGhpcy5nZXREcmFnZ2FibGVPcHRpb25zKCkpO1xuXG4gICAgICAgICAgICBjb25zdCBkcmFnU3RhcnRTdWIgPSBkcmFnZ2FibGUuZHJhZ1N0YXJ0XG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZXZlbnQ6IERyYWdnYWJsZUV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuem9uZS5ydW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vblN0YXJ0KHRoaXMuaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vblN0YXJ0KCdkcmFnJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnNvclRvRWxlbWVudFBvc2l0aW9uID0gZXZlbnQuZ2V0UmVsYXRpdmVDb29yZGluYXRlcyh0aGlzLiRlbGVtZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRyYWdTdWIgPSBkcmFnZ2FibGUuZHJhZ01vdmVcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChldmVudDogRHJhZ2dhYmxlRXZlbnQpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IChldmVudC5jbGllbnRZIC0gY3Vyc29yVG9FbGVtZW50UG9zaXRpb24ueSAtXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyUmVjdC50b3ApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IChldmVudC5jbGllbnRYIC0gY3Vyc29yVG9FbGVtZW50UG9zaXRpb24ueCAtXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLmdyaWRzdGVyUmVjdC5sZWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVFbGVtZW5ldFBvc2l0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5vbkRyYWcodGhpcy5pdGVtKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgY29uc3QgZHJhZ1N0b3BTdWIgPSBkcmFnZ2FibGUuZHJhZ1N0b3BcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy56b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9uU3RvcCh0aGlzLml0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkc3Rlci5kZWJvdW5jZVJlbmRlclN1YmplY3QubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkVuZCgnZHJhZycpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5kcmFnU3Vic2NyaXB0aW9ucyA9IHRoaXMuZHJhZ1N1YnNjcmlwdGlvbnMuY29uY2F0KFtkcmFnU3RhcnRTdWIsIGRyYWdTdWIsIGRyYWdTdG9wU3ViXSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNhYmxlRHJhZ2dhYmxlKCkge1xuICAgICAgICB0aGlzLmRyYWdTdWJzY3JpcHRpb25zLmZvckVhY2goKHN1YjogU3Vic2NyaXB0aW9uKSA9PiB7XG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZHJhZ1N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJlc2l6ZUhhbmRsZXJzKCk6IEhUTUxFbGVtZW50W10gIHtcbiAgICAgICAgcmV0dXJuIFtdLmZpbHRlci5jYWxsKHRoaXMuJGVsZW1lbnQuY2hpbGRyZW5bMF0uY2hpbGRyZW4sIChlbCkgPT4ge1xuXG4gICAgICAgICAgICByZXR1cm4gZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdncmlkc3Rlci1pdGVtLXJlc2l6YWJsZS1oYW5kbGVyJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RHJhZ2dhYmxlT3B0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIHsgc2Nyb2xsRGlyZWN0aW9uOiB0aGlzLmdyaWRzdGVyLm9wdGlvbnMuZGlyZWN0aW9uLCAuLi50aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJlc2l6YWJsZU9wdGlvbnMoKSB7XG4gICAgICAgIGNvbnN0IHJlc2l6YWJsZU9wdGlvbnM6IGFueSA9IHt9O1xuXG4gICAgICAgIGlmICh0aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMuc2Nyb2xsIHx8IHRoaXMuZ3JpZHN0ZXIuZHJhZ2dhYmxlT3B0aW9ucy5zY3JvbGwgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICByZXNpemFibGVPcHRpb25zLnNjcm9sbCA9IHRoaXMuZ3JpZHN0ZXIuZHJhZ2dhYmxlT3B0aW9ucy5zY3JvbGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZ3JpZHN0ZXIuZHJhZ2dhYmxlT3B0aW9ucy5zY3JvbGxFZGdlKSB7XG4gICAgICAgICAgICByZXNpemFibGVPcHRpb25zLnNjcm9sbEVkZ2UgPSB0aGlzLmdyaWRzdGVyLmRyYWdnYWJsZU9wdGlvbnMuc2Nyb2xsRWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc2l6YWJsZU9wdGlvbnMuc2Nyb2xsRGlyZWN0aW9uID0gdGhpcy5ncmlkc3Rlci5vcHRpb25zLmRpcmVjdGlvbjtcblxuICAgICAgICByZXR1cm4gcmVzaXphYmxlT3B0aW9ucztcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhc1Jlc2l6YWJsZUhhbmRsZShkaXJlY3Rpb246IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBpc0l0ZW1SZXNpemFibGUgPSB0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzaXphYmxlICYmIHRoaXMuaXRlbS5yZXNpemFibGU7XG4gICAgICAgIGNvbnN0IHJlc2l6ZUhhbmRsZXMgPSB0aGlzLmdyaWRzdGVyLm9wdGlvbnMucmVzaXplSGFuZGxlcztcblxuICAgICAgICByZXR1cm4gaXNJdGVtUmVzaXphYmxlICYmICghcmVzaXplSGFuZGxlcyB8fCAocmVzaXplSGFuZGxlcyAmJiAhIXJlc2l6ZUhhbmRsZXNbZGlyZWN0aW9uXSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0UG9zaXRpb25zRm9yR3JpZChvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSB7XG4gICAgICAgIGxldCB4LCB5O1xuXG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5maW5kUG9zaXRpb24ob3B0aW9ucyk7XG4gICAgICAgIHggPSBvcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnID8gcG9zaXRpb25bMF0gOiBwb3NpdGlvblsxXTtcbiAgICAgICAgeSA9IG9wdGlvbnMuZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcgPyBwb3NpdGlvblsxXSA6IHBvc2l0aW9uWzBdO1xuXG4gICAgICAgIHRoaXMuaXRlbS5zZXRWYWx1ZVgoeCwgb3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgdGhpcy5pdGVtLnNldFZhbHVlWSh5LCBvcHRpb25zLmJyZWFrcG9pbnQpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5pdGVtLnRyaWdnZXJDaGFuZ2VYKG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgICAgICB0aGlzLml0ZW0udHJpZ2dlckNoYW5nZVkob3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmaW5kUG9zaXRpb24ob3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucyk6IEFycmF5PG51bWJlcj4ge1xuICAgICAgICBjb25zdCBncmlkTGlzdCA9IG5ldyBHcmlkTGlzdChcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIuaXRlbXMubWFwKGl0ZW0gPT4gaXRlbS5jb3B5Rm9yQnJlYWtwb2ludChvcHRpb25zLmJyZWFrcG9pbnQpKSxcbiAgICAgICAgICAgIG9wdGlvbnNcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gZ3JpZExpc3QuZmluZFBvc2l0aW9uRm9ySXRlbSh0aGlzLml0ZW0sIHt4OiAwLCB5OiAwfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjcmVhdGVSZXNpemVTdGFydE9iamVjdChkaXJlY3Rpb246IHN0cmluZykge1xuICAgICAgICBjb25zdCBzY3JvbGxEYXRhID0gdGhpcy5ncmlkc3Rlci5ncmlkc3RlclNjcm9sbERhdGE7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRvcDogdGhpcy5wb3NpdGlvblksXG4gICAgICAgICAgICBsZWZ0OiB0aGlzLnBvc2l0aW9uWCxcbiAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQodGhpcy4kZWxlbWVudC5zdHlsZS5oZWlnaHQsIDEwKSxcbiAgICAgICAgICAgIHdpZHRoOiBwYXJzZUludCh0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoLCAxMCksXG4gICAgICAgICAgICBtaW5YOiBNYXRoLm1heCh0aGlzLml0ZW0ueCArIHRoaXMuaXRlbS53IC0gdGhpcy5vcHRpb25zLm1heFdpZHRoLCAwKSxcbiAgICAgICAgICAgIG1heFg6IHRoaXMuaXRlbS54ICsgdGhpcy5pdGVtLncgLSB0aGlzLm9wdGlvbnMubWluV2lkdGgsXG4gICAgICAgICAgICBtaW5ZOiBNYXRoLm1heCh0aGlzLml0ZW0ueSArIHRoaXMuaXRlbS5oIC0gdGhpcy5vcHRpb25zLm1heEhlaWdodCwgMCksXG4gICAgICAgICAgICBtYXhZOiB0aGlzLml0ZW0ueSArIHRoaXMuaXRlbS5oIC0gdGhpcy5vcHRpb25zLm1pbkhlaWdodCxcbiAgICAgICAgICAgIG1pblc6IHRoaXMub3B0aW9ucy5taW5XaWR0aCxcbiAgICAgICAgICAgIG1heFc6IE1hdGgubWluKFxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5tYXhXaWR0aCxcbiAgICAgICAgICAgICAgICAodGhpcy5ncmlkc3Rlci5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ3ZlcnRpY2FsJyAmJiBkaXJlY3Rpb24uaW5kZXhPZigndycpIDwgMCkgP1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXIub3B0aW9ucy5sYW5lcyAtIHRoaXMuaXRlbS54IDogdGhpcy5vcHRpb25zLm1heFdpZHRoLFxuICAgICAgICAgICAgICAgIGRpcmVjdGlvbi5pbmRleE9mKCd3JykgPj0gMCA/XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtLnggKyB0aGlzLml0ZW0udyA6IHRoaXMub3B0aW9ucy5tYXhXaWR0aFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIG1pbkg6IHRoaXMub3B0aW9ucy5taW5IZWlnaHQsXG4gICAgICAgICAgICBtYXhIOiBNYXRoLm1pbihcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMubWF4SGVpZ2h0LFxuICAgICAgICAgICAgICAgICh0aGlzLmdyaWRzdGVyLm9wdGlvbnMuZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcgJiYgZGlyZWN0aW9uLmluZGV4T2YoJ24nKSA8IDApID9cbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRzdGVyLm9wdGlvbnMubGFuZXMgLSB0aGlzLml0ZW0ueSA6IHRoaXMub3B0aW9ucy5tYXhIZWlnaHQsXG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uLmluZGV4T2YoJ24nKSA+PSAwID9cbiAgICAgICAgICAgICAgICB0aGlzLml0ZW0ueSArIHRoaXMuaXRlbS5oIDogdGhpcy5vcHRpb25zLm1heEhlaWdodFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHNjcm9sbExlZnQ6IHNjcm9sbERhdGEuc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIHNjcm9sbFRvcDogc2Nyb2xsRGF0YS5zY3JvbGxUb3BcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uRW5kKGFjdGlvblR5cGU6IHN0cmluZyk6IHZvaWQge1xuICAgICAgICB0aGlzLmVuZC5lbWl0KHthY3Rpb246IGFjdGlvblR5cGUsIGl0ZW06IHRoaXMuaXRlbX0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25TdGFydChhY3Rpb25UeXBlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zdGFydC5lbWl0KHthY3Rpb246IGFjdGlvblR5cGUsIGl0ZW06IHRoaXMuaXRlbX0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFzc2lnbiBjbGFzcyBmb3Igc2hvcnQgd2hpbGUgdG8gcHJldmVudCBhbmltYXRpb24gb2YgZ3JpZCBpdGVtIGNvbXBvbmVudFxuICAgICAqL1xuICAgIHByaXZhdGUgcHJldmVudEFuaW1hdGlvbigpOiBHcmlkc3Rlckl0ZW1Db21wb25lbnQge1xuICAgICAgICB0aGlzLiRlbGVtZW50LmNsYXNzTGlzdC5hZGQoJ25vLXRyYW5zaXRpb24nKTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ25vLXRyYW5zaXRpb24nKTtcbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJlc2l6ZURpcmVjdGlvbihoYW5kbGVyOiBFbGVtZW50KTogc3RyaW5nIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IGhhbmRsZXIuY2xhc3NMaXN0Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBpZiAoaGFuZGxlci5jbGFzc0xpc3RbaV0ubWF0Y2goJ2hhbmRsZS0nKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyLmNsYXNzTGlzdFtpXS5zcGxpdCgnLScpWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNpemVFbGVtZW50KGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIC8vIG5vcnRoXG4gICAgICAgIGlmIChjb25maWcuZGlyZWN0aW9uLmluZGV4T2YoJ24nKSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZVRvTm9ydGgoY29uZmlnKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB3ZXN0XG4gICAgICAgIGlmIChjb25maWcuZGlyZWN0aW9uLmluZGV4T2YoJ3cnKSA+PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2l6ZVRvV2VzdChjb25maWcpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVhc3RcbiAgICAgICAgaWYgKGNvbmZpZy5kaXJlY3Rpb24uaW5kZXhPZignZScpID49IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplVG9FYXN0KGNvbmZpZyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc291dGhcbiAgICAgICAgaWYgKGNvbmZpZy5kaXJlY3Rpb24uaW5kZXhPZigncycpID49IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVzaXplVG9Tb3V0aChjb25maWcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNpemVUb05vcnRoKGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGNvbmZpZy5zdGFydERhdGEuaGVpZ2h0ICsgY29uZmlnLnN0YXJ0RXZlbnQuY2xpZW50WSAtXG4gICAgICAgICAgICBjb25maWcubW92ZUV2ZW50LmNsaWVudFkgLSBjb25maWcuc2Nyb2xsRGlmZlk7XG5cbiAgICAgICAgaWYgKGhlaWdodCA8IChjb25maWcuc3RhcnREYXRhLm1pbkggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1pbkhlaWdodCgnbicsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGVpZ2h0ID4gKGNvbmZpZy5zdGFydERhdGEubWF4SCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF4SGVpZ2h0KCduJywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb25ZID0gY29uZmlnLnBvc2l0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLmhlaWdodCA9IGhlaWdodCArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHJlc2l6ZVRvV2VzdChjb25maWc6IGFueSk6IHZvaWQge1xuICAgICAgICBjb25zdCB3aWR0aCA9IGNvbmZpZy5zdGFydERhdGEud2lkdGggKyBjb25maWcuc3RhcnRFdmVudC5jbGllbnRYIC1cbiAgICAgICAgICAgIGNvbmZpZy5tb3ZlRXZlbnQuY2xpZW50WCAtIGNvbmZpZy5zY3JvbGxEaWZmWDtcblxuICAgICAgICBpZiAod2lkdGggPCAoY29uZmlnLnN0YXJ0RGF0YS5taW5XICogdGhpcy5ncmlkc3Rlci5jZWxsV2lkdGgpKSB7XG4gICAgICAgICAgICB0aGlzLnNldE1pbldpZHRoKCd3JywgY29uZmlnKTtcbiAgICAgICAgfSBlbHNlIGlmICh3aWR0aCA+IChjb25maWcuc3RhcnREYXRhLm1heFcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF4V2lkdGgoJ3cnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblggPSBjb25maWcucG9zaXRpb24ueDtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVuZXRQb3NpdGlvbigpO1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzaXplVG9FYXN0KGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gY29uZmlnLnN0YXJ0RGF0YS53aWR0aCArIGNvbmZpZy5tb3ZlRXZlbnQuY2xpZW50WCAtXG4gICAgICAgICAgICBjb25maWcuc3RhcnRFdmVudC5jbGllbnRYICsgY29uZmlnLnNjcm9sbERpZmZYO1xuXG4gICAgICAgIGlmICh3aWR0aCA+IChjb25maWcuc3RhcnREYXRhLm1heFcgKiB0aGlzLmdyaWRzdGVyLmNlbGxXaWR0aCkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0TWF4V2lkdGgoJ2UnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKHdpZHRoIDwgKGNvbmZpZy5zdGFydERhdGEubWluVyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSkge1xuICAgICAgICAgICAgdGhpcy5zZXRNaW5XaWR0aCgnZScsIGNvbmZpZyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZXNpemVUb1NvdXRoKGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9IGNvbmZpZy5zdGFydERhdGEuaGVpZ2h0ICsgY29uZmlnLm1vdmVFdmVudC5jbGllbnRZIC1cbiAgICAgICAgICAgIGNvbmZpZy5zdGFydEV2ZW50LmNsaWVudFkgKyBjb25maWcuc2Nyb2xsRGlmZlk7XG5cbiAgICAgICAgaWYgKGhlaWdodCA+IGNvbmZpZy5zdGFydERhdGEubWF4SCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zZXRNYXhIZWlnaHQoJ3MnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlaWdodCA8IGNvbmZpZy5zdGFydERhdGEubWluSCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5zZXRNaW5IZWlnaHQoJ3MnLCBjb25maWcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRNaW5IZWlnaHQoZGlyZWN0aW9uOiBzdHJpbmcsIGNvbmZpZzogYW55KTogdm9pZCB7XG4gICAgICAgIGlmIChkaXJlY3Rpb24gPT09ICduJykge1xuICAgICAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS5oZWlnaHQgPSAoY29uZmlnLnN0YXJ0RGF0YS5taW5IICogdGhpcy5ncmlkc3Rlci5jZWxsSGVpZ2h0KSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWSA9IGNvbmZpZy5zdGFydERhdGEubWF4WSAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKGNvbmZpZy5zdGFydERhdGEubWluSCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkgKyAncHgnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRNaW5XaWR0aChkaXJlY3Rpb246IHN0cmluZywgY29uZmlnOiBhbnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3cnKSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoID0gKGNvbmZpZy5zdGFydERhdGEubWluVyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IGNvbmZpZy5zdGFydERhdGEubWF4WCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFbGVtZW5ldFBvc2l0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoID0gKGNvbmZpZy5zdGFydERhdGEubWluVyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldE1heEhlaWdodChkaXJlY3Rpb246IHN0cmluZywgY29uZmlnOiBhbnkpOiB2b2lkIHtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uID09PSAnbicpIHtcbiAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gKGNvbmZpZy5zdGFydERhdGEubWF4SCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbEhlaWdodCkgKyAncHgnO1xuICAgICAgICAgICAgdGhpcy5wb3NpdGlvblkgPSBjb25maWcuc3RhcnREYXRhLm1pblkgKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLmhlaWdodCA9IChjb25maWcuc3RhcnREYXRhLm1heEggKiB0aGlzLmdyaWRzdGVyLmNlbGxIZWlnaHQpICsgJ3B4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0TWF4V2lkdGgoZGlyZWN0aW9uOiBzdHJpbmcsIGNvbmZpZzogYW55KTogdm9pZCB7XG5cbiAgICAgICAgaWYgKGRpcmVjdGlvbiA9PT0gJ3cnKSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoID0gKGNvbmZpZy5zdGFydERhdGEubWF4VyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSArICdweCc7XG4gICAgICAgICAgICB0aGlzLnBvc2l0aW9uWCA9IGNvbmZpZy5zdGFydERhdGEubWluWCAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVFbGVtZW5ldFBvc2l0aW9uKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLndpZHRoID0gKGNvbmZpZy5zdGFydERhdGEubWF4VyAqIHRoaXMuZ3JpZHN0ZXIuY2VsbFdpZHRoKSArICdweCc7XG4gICAgICAgIH1cbiAgICB9XG59XG4iXX0=