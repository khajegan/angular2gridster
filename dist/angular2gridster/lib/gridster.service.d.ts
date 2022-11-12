import { Subject } from 'rxjs';
import { GridList } from './gridList/gridList';
import { IGridsterOptions } from './IGridsterOptions';
import { IGridsterDraggableOptions } from './IGridsterDraggableOptions';
import { GridListItem } from './gridList/GridListItem';
import { GridsterComponent } from './gridster.component';
import { GridsterOptions } from './GridsterOptions';
import * as i0 from "@angular/core";
export declare class GridsterService {
    $element: HTMLElement;
    gridList: GridList;
    items: Array<GridListItem>;
    _items: Array<GridListItem>;
    _itemsMap: {
        [breakpoint: string]: Array<GridListItem>;
    };
    disabledItems: Array<GridListItem>;
    options: IGridsterOptions;
    draggableOptions: IGridsterDraggableOptions;
    gridsterRect: ClientRect;
    gridsterScrollData: {
        scrollTop: number;
        scrollLeft: number;
    };
    gridsterOptions: GridsterOptions;
    gridsterComponent: GridsterComponent;
    debounceRenderSubject: Subject<unknown>;
    $positionHighlight: HTMLElement;
    maxItemWidth: number;
    maxItemHeight: number;
    cellWidth: number;
    cellHeight: number;
    itemRemoveSubject: Subject<GridListItem>;
    private _fontSize;
    private previousDragPosition;
    private previousDragSize;
    private currentElement;
    private _maxGridCols;
    private isInit;
    constructor();
    isInitialized(): boolean;
    /**
     * Must be called before init
     * @param item
     */
    registerItem(item: GridListItem): GridListItem;
    init(gridsterComponent: GridsterComponent): void;
    start(): void;
    initGridList(): void;
    render(): void;
    reflow(): void;
    fixItemsPositions(): void;
    removeItem(item: GridListItem): void;
    onResizeStart(item: GridListItem): void;
    onResizeDrag(item: GridListItem): void;
    onResizeStop(item: GridListItem): void;
    onStart(item: GridListItem): void;
    onDrag(item: GridListItem): void;
    cancel(): void;
    onDragOut(item: GridListItem): void;
    onStop(item: GridListItem): void;
    calculateCellSize(): void;
    applyPositionToItems(increaseGridsterSize?: any): void;
    refreshLines(): void;
    private removeItemFromCache;
    private copyItems;
    /**
     * Update maxItemWidth and maxItemHeight vales according to current state of items
     */
    private updateMaxItemSize;
    /**
     * Update items properties of previously cached items
     */
    private restoreCachedItems;
    /**
     * If item should react on grid
     * @param GridListItem item
     * @returns boolean
     */
    private isValidGridItem;
    private calculateCellWidth;
    private calculateCellHeight;
    private applySizeToItems;
    private isCurrentElement;
    private snapItemSizeToGrid;
    private generateItemPosition;
    private snapItemPositionToGrid;
    private dragSizeChanged;
    private dragPositionChanged;
    private highlightPositionForItem;
    updateCachedItems(): void;
    private triggerOnChange;
    private removePositionHighlight;
    static ɵfac: i0.ɵɵFactoryDeclaration<GridsterService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<GridsterService>;
}
