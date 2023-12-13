import { OnInit, AfterContentInit, OnDestroy, ElementRef, NgZone, EventEmitter } from '@angular/core';
import { GridsterService } from './gridster.service';
import { IGridsterOptions } from './IGridsterOptions';
import { IGridsterDraggableOptions } from './IGridsterDraggableOptions';
import { GridsterPrototypeService } from './gridster-prototype/gridster-prototype.service';
import { GridListItem } from './gridList/GridListItem';
import { GridsterOptions } from './GridsterOptions';
import * as i0 from "@angular/core";
export declare class GridsterComponent implements OnInit, AfterContentInit, OnDestroy {
    private zone;
    private gridsterPrototype;
    options: IGridsterOptions;
    optionsChange: EventEmitter<any>;
    ready: EventEmitter<any>;
    reflow: EventEmitter<any>;
    prototypeDrop: EventEmitter<{
        item: GridListItem;
    }>;
    prototypeEnter: EventEmitter<{
        item: GridListItem;
    }>;
    prototypeOut: EventEmitter<{
        item: GridListItem;
    }>;
    draggableOptions: IGridsterDraggableOptions;
    parent: GridsterComponent;
    $positionHighlight: any;
    isDragging: boolean;
    isResizing: boolean;
    isReady: boolean;
    gridster: GridsterService;
    $element: HTMLElement;
    gridsterOptions: GridsterOptions;
    isPrototypeEntered: boolean;
    private isDisabled;
    private subscription;
    constructor(zone: NgZone, elementRef: ElementRef, gridster: GridsterService, gridsterPrototype: GridsterPrototypeService);
    ngOnInit(): void;
    ngAfterContentInit(): void;
    ngOnDestroy(): void;
    /**
     * Change gridster config option and rebuild
     * @param string name
     * @param any value
     * @return GridsterComponent
     */
    setOption(name: string, value: any): this;
    reload(): this;
    reflowGridster(isInit?: boolean): void;
    updateGridsterElementData(): void;
    setReady(): void;
    adjustItemsHeightToContent(scrollableItemElementSelector?: string): void;
    disable(item: any): void;
    enable(): void;
    private getScrollPositionFromParents;
    /**
     * Connect gridster prototype item to gridster dragging hooks (onStart, onDrag, onStop).
     */
    private connectGridsterPrototype;
    private enableDraggable;
    private disableDraggable;
    private enableResizable;
    private disableResizable;
    static ɵfac: i0.ɵɵFactoryDeclaration<GridsterComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<GridsterComponent, "ngx-gridster", never, { "options": { "alias": "options"; "required": false; }; "draggableOptions": { "alias": "draggableOptions"; "required": false; }; "parent": { "alias": "parent"; "required": false; }; }, { "optionsChange": "optionsChange"; "ready": "ready"; "reflow": "reflow"; "prototypeDrop": "prototypeDrop"; "prototypeEnter": "prototypeEnter"; "prototypeOut": "prototypeOut"; }, never, ["*"], false, never>;
}
