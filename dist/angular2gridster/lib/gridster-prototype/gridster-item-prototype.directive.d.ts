import { ElementRef, EventEmitter, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GridsterPrototypeService } from './gridster-prototype.service';
import { GridListItem } from '../gridList/GridListItem';
import { GridsterService } from '../gridster.service';
import * as i0 from "@angular/core";
export declare class GridsterItemPrototypeDirective implements OnInit, OnDestroy {
    private zone;
    private elementRef;
    private gridsterPrototype;
    drop: EventEmitter<any>;
    start: EventEmitter<any>;
    cancel: EventEmitter<any>;
    enter: EventEmitter<any>;
    out: EventEmitter<any>;
    data: any;
    config: any;
    x: number;
    y: number;
    w: number;
    wSm: number;
    wMd: number;
    wLg: number;
    wXl: number;
    h: number;
    hSm: number;
    hMd: number;
    hLg: number;
    hXl: number;
    positionX: number;
    positionY: number;
    autoSize: boolean;
    $element: HTMLElement;
    /**
     * Mouse drag observable
     */
    drag: Observable<any>;
    /**
     * Subscribtion for drag observable
     */
    dragSubscription: Subscription;
    isDragging: boolean;
    item: GridListItem;
    containerRectange: ClientRect;
    private dragContextGridster;
    private parentRect;
    private parentOffset;
    private subscribtions;
    get dragAndDrop(): boolean;
    get gridster(): GridsterService;
    constructor(zone: NgZone, elementRef: ElementRef, gridsterPrototype: GridsterPrototypeService);
    ngOnInit(): void;
    ngOnDestroy(): void;
    onDrop(gridster: GridsterService): void;
    onCancel(): void;
    onEnter(gridster: GridsterService): void;
    onOver(gridster: GridsterService): void;
    onOut(gridster: GridsterService): void;
    getPositionToGridster(gridster: GridsterService): {
        y: number;
        x: number;
    };
    setDragContextGridster(gridster: GridsterService): void;
    private getContainerCoordsToGridster;
    private enableDragDrop;
    private setElementPosition;
    private updateParentElementData;
    private onStart;
    private onDrag;
    private onStop;
    private provideDragElement;
    private fixStylesForRelativeElement;
    /**
     * When element is cloned and append to body it should have position absolute and coords set by original
     * relative prototype element position.
     */
    private fixStylesForBodyHelper;
    static ɵfac: i0.ɵɵFactoryDeclaration<GridsterItemPrototypeDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<GridsterItemPrototypeDirective, "[ngxGridsterItemPrototype]", never, { "data": { "alias": "data"; "required": false; }; "config": { "alias": "config"; "required": false; }; "w": { "alias": "w"; "required": false; }; "wSm": { "alias": "wSm"; "required": false; }; "wMd": { "alias": "wMd"; "required": false; }; "wLg": { "alias": "wLg"; "required": false; }; "wXl": { "alias": "wXl"; "required": false; }; "h": { "alias": "h"; "required": false; }; "hSm": { "alias": "hSm"; "required": false; }; "hMd": { "alias": "hMd"; "required": false; }; "hLg": { "alias": "hLg"; "required": false; }; "hXl": { "alias": "hXl"; "required": false; }; }, { "drop": "drop"; "start": "start"; "cancel": "cancel"; "enter": "enter"; "out": "out"; }, never, never, false, never>;
}
