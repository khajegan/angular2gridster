import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { GridList } from './gridList/gridList';
import * as i0 from "@angular/core";
export class GridsterService {
    constructor() {
        this.items = [];
        this._items = [];
        this._itemsMap = {};
        this.disabledItems = [];
        this.debounceRenderSubject = new Subject();
        this.itemRemoveSubject = new Subject();
        this.isInit = false;
        this.itemRemoveSubject.pipe(debounceTime(0)).subscribe(() => {
            this.gridList.pullItemsToLeft();
            this.render();
            this.updateCachedItems();
        });
        this.debounceRenderSubject.pipe(debounceTime(0)).subscribe(() => this.render());
    }
    isInitialized() {
        return this.isInit;
    }
    /**
     * Must be called before init
     * @param item
     */
    registerItem(item) {
        this.items.push(item);
        return item;
    }
    init(gridsterComponent) {
        this.gridsterComponent = gridsterComponent;
        this.draggableOptions = gridsterComponent.draggableOptions;
        this.gridsterOptions = gridsterComponent.gridsterOptions;
    }
    start() {
        this.updateMaxItemSize();
        // Used to highlight a position an element will land on upon drop
        if (this.$positionHighlight) {
            this.removePositionHighlight();
        }
        this.initGridList();
        this.isInit = true;
        setTimeout(() => {
            this.copyItems();
            this.fixItemsPositions();
            this.gridsterComponent.reflowGridster(true);
            this.gridsterComponent.setReady();
        });
    }
    initGridList() {
        // Create instance of GridList (decoupled lib for handling the grid
        // positioning and sorting post-drag and dropping)
        this.gridList = new GridList(this.items, this.options);
    }
    render() {
        this.updateMaxItemSize();
        this.gridList.generateGrid();
        this.applySizeToItems();
        this.applyPositionToItems();
        this.refreshLines();
    }
    reflow() {
        this.calculateCellSize();
        this.render();
    }
    fixItemsPositions() {
        if (this.options.responsiveSizes) {
            this.gridList.fixItemsPositions(this.options);
        }
        else {
            this.gridList.fixItemsPositions(this.gridsterOptions.basicOptions);
            this.gridsterOptions.responsiveOptions.forEach((options) => {
                this.gridList.fixItemsPositions(options);
            });
        }
        this.updateCachedItems();
    }
    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx >= 0) {
            this.items.splice(this.items.indexOf(item), 1);
        }
        this.gridList.deleteItemPositionFromGrid(item);
        this.removeItemFromCache(item);
    }
    onResizeStart(item) {
        this.currentElement = item.$element;
        this.copyItems();
        this._maxGridCols = this.gridList.grid.length;
        this.highlightPositionForItem(item);
        this.gridsterComponent.isResizing = true;
        this.refreshLines();
    }
    onResizeDrag(item) {
        const newSize = this.snapItemSizeToGrid(item);
        const sizeChanged = this.dragSizeChanged(newSize);
        const newPosition = this.snapItemPositionToGrid(item);
        const positionChanged = this.dragPositionChanged(newPosition);
        if (sizeChanged || positionChanged) {
            // Regenerate the grid with the positions from when the drag started
            this.restoreCachedItems();
            this.gridList.generateGrid();
            this.previousDragPosition = newPosition;
            this.previousDragSize = newSize;
            this.gridList.moveAndResize(item, newPosition, { w: newSize[0], h: newSize[1] });
            // Visually update item positions and highlight shape
            this.applyPositionToItems(true);
            this.highlightPositionForItem(item);
        }
    }
    onResizeStop(item) {
        this.currentElement = undefined;
        this.updateCachedItems();
        this.previousDragSize = null;
        this.removePositionHighlight();
        this.gridsterComponent.isResizing = false;
        this.gridList.pullItemsToLeft(item);
        this.debounceRenderSubject.next(null);
        this.fixItemsPositions();
    }
    onStart(item) {
        this.currentElement = item.$element;
        // itemCtrl.isDragging = true;
        // Create a deep copy of the items; we use them to revert the item
        // positions after each drag change, making an entire drag operation less
        // distructable
        this.copyItems();
        // Since dragging actually alters the grid, we need to establish the number
        // of cols (+1 extra) before the drag starts
        this._maxGridCols = this.gridList.grid.length;
        this.gridsterComponent.isDragging = true;
        this.gridsterComponent.updateGridsterElementData();
        this.refreshLines();
    }
    onDrag(item) {
        const newPosition = this.snapItemPositionToGrid(item);
        if (this.dragPositionChanged(newPosition)) {
            // Regenerate the grid with the positions from when the drag started
            this.restoreCachedItems();
            this.gridList.generateGrid();
            this.previousDragPosition = newPosition;
            if (this.options.direction === 'none' &&
                !this.gridList.checkItemAboveEmptyArea(item, { x: newPosition[0], y: newPosition[1] })) {
                return;
            }
            // Since the items list is a deep copy, we need to fetch the item
            // corresponding to this drag action again
            this.gridList.moveItemToPosition(item, newPosition);
            // Visually update item positions and highlight shape
            this.applyPositionToItems(true);
            this.highlightPositionForItem(item);
        }
    }
    cancel() {
        this.restoreCachedItems();
        this.previousDragPosition = null;
        this.updateMaxItemSize();
        this.applyPositionToItems();
        this.removePositionHighlight();
        this.currentElement = undefined;
        this.gridsterComponent.isDragging = false;
    }
    onDragOut(item) {
        this.cancel();
        const idx = this.items.indexOf(item);
        if (idx >= 0) {
            this.items.splice(idx, 1);
        }
        this.gridList.pullItemsToLeft();
        this.render();
    }
    onStop(item) {
        this.currentElement = undefined;
        this.updateCachedItems();
        this.previousDragPosition = null;
        this.removePositionHighlight();
        this.gridList.pullItemsToLeft(item);
        this.gridsterComponent.isDragging = false;
        this.refreshLines();
    }
    calculateCellSize() {
        if (this.options.direction === 'horizontal') {
            this.cellHeight = this.calculateCellHeight();
            this.cellWidth = this.options.cellWidth || this.cellHeight * this.options.widthHeightRatio;
        }
        else {
            this.cellWidth = this.calculateCellWidth();
            this.cellHeight = this.options.cellHeight || this.cellWidth / this.options.widthHeightRatio;
        }
        if (this.options.heightToFontSizeRatio) {
            this._fontSize = this.cellHeight * this.options.heightToFontSizeRatio;
        }
    }
    applyPositionToItems(increaseGridsterSize) {
        if (!this.options.shrink) {
            increaseGridsterSize = true;
        }
        // TODO: Implement group separators
        for (let i = 0; i < this.items.length; i++) {
            // Don't interfere with the positions of the dragged items
            if (this.isCurrentElement(this.items[i].$element)) {
                continue;
            }
            this.items[i].applyPosition(this);
        }
        const child = this.gridsterComponent.$element.firstChild;
        // Update the width of the entire grid container with enough room on the
        // right to allow dragging items to the end of the grid.
        if (this.options.direction === 'horizontal') {
            const increaseWidthWith = (increaseGridsterSize) ? this.maxItemWidth : 0;
            child.style.height = '';
            child.style.width = ((this.gridList.grid.length + increaseWidthWith) * this.cellWidth) + 'px';
        }
        else if (this.gridList.grid.length) {
            const increaseHeightWith = (increaseGridsterSize) ? this.maxItemHeight : 0;
            child.style.height = ((this.gridList.grid.length + increaseHeightWith) * this.cellHeight) + 'px';
            child.style.width = '';
        }
    }
    refreshLines() {
        const gridsterContainer = this.gridsterComponent.$element.firstChild;
        if (this.options.lines && this.options.lines.visible &&
            (this.gridsterComponent.isDragging || this.gridsterComponent.isResizing || this.options.lines.always)) {
            const linesColor = this.options.lines.color || '#d8d8d8';
            const linesBgColor = this.options.lines.backgroundColor || 'transparent';
            const linesWidth = this.options.lines.width || 1;
            const bgPosition = linesWidth / 2;
            gridsterContainer.style.backgroundSize = `${this.cellWidth}px ${this.cellHeight}px`;
            gridsterContainer.style.backgroundPosition = `-${bgPosition}px -${bgPosition}px`;
            gridsterContainer.style.backgroundImage = `
                linear-gradient(to right, ${linesColor} ${linesWidth}px, ${linesBgColor} ${linesWidth}px),
                linear-gradient(to bottom, ${linesColor} ${linesWidth}px, ${linesBgColor} ${linesWidth}px)
            `;
        }
        else {
            gridsterContainer.style.backgroundSize = '';
            gridsterContainer.style.backgroundPosition = '';
            gridsterContainer.style.backgroundImage = '';
        }
    }
    removeItemFromCache(item) {
        this._items = this._items
            .filter(cachedItem => cachedItem.$element !== item.$element);
        Object.keys(this._itemsMap)
            .forEach((breakpoint) => {
            this._itemsMap[breakpoint] = this._itemsMap[breakpoint]
                .filter(cachedItem => cachedItem.$element !== item.$element);
        });
    }
    copyItems() {
        this._items = this.items
            .filter(item => this.isValidGridItem(item))
            .map((item) => {
            return item.copyForBreakpoint(null);
        });
        this.gridsterOptions.responsiveOptions.forEach((options) => {
            this._itemsMap[options.breakpoint] = this.items
                .filter(item => this.isValidGridItem(item))
                .map((item) => {
                return item.copyForBreakpoint(options.breakpoint);
            });
        });
    }
    /**
     * Update maxItemWidth and maxItemHeight vales according to current state of items
     */
    updateMaxItemSize() {
        this.maxItemWidth = Math.max.apply(null, this.items.map((item) => {
            return item.w;
        }));
        this.maxItemHeight = Math.max.apply(null, this.items.map((item) => {
            return item.h;
        }));
    }
    /**
     * Update items properties of previously cached items
     */
    restoreCachedItems() {
        const items = this.options.breakpoint ? this._itemsMap[this.options.breakpoint] : this._items;
        this.items
            .filter(item => this.isValidGridItem(item))
            .forEach((item) => {
            const cachedItem = items.filter(cachedItm => {
                return cachedItm.$element === item.$element;
            })[0];
            item.x = cachedItem.x;
            item.y = cachedItem.y;
            item.w = cachedItem.w;
            item.h = cachedItem.h;
            item.autoSize = cachedItem.autoSize;
        });
    }
    /**
     * If item should react on grid
     * @param GridListItem item
     * @returns boolean
     */
    isValidGridItem(item) {
        if (this.options.direction === 'none') {
            return !!item.itemComponent;
        }
        return true;
    }
    calculateCellWidth() {
        const gridsterWidth = parseFloat(window.getComputedStyle(this.gridsterComponent.$element).width);
        return gridsterWidth / this.options.lanes;
    }
    calculateCellHeight() {
        const gridsterHeight = parseFloat(window.getComputedStyle(this.gridsterComponent.$element).height);
        return gridsterHeight / this.options.lanes;
    }
    applySizeToItems() {
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].applySize();
            if (this.options.heightToFontSizeRatio) {
                this.items[i].$element.style['font-size'] = this._fontSize;
            }
        }
    }
    isCurrentElement(element) {
        if (!this.currentElement) {
            return false;
        }
        return element === this.currentElement;
    }
    snapItemSizeToGrid(item) {
        const itemSize = {
            width: parseInt(item.$element.style.width, 10) - 1,
            height: parseInt(item.$element.style.height, 10) - 1
        };
        let colSize = Math.round(itemSize.width / this.cellWidth);
        let rowSize = Math.round(itemSize.height / this.cellHeight);
        // Keep item minimum 1
        colSize = Math.max(colSize, 1);
        rowSize = Math.max(rowSize, 1);
        // check if element is pinned
        if (this.gridList.isOverFixedArea(item.x, item.y, colSize, rowSize, item)) {
            return [item.w, item.h];
        }
        return [colSize, rowSize];
    }
    generateItemPosition(item) {
        let position;
        if (item.itemPrototype) {
            const coords = item.itemPrototype.getPositionToGridster(this);
            position = {
                x: Math.round(coords.x / this.cellWidth),
                y: Math.round(coords.y / this.cellHeight)
            };
        }
        else {
            position = {
                x: Math.round(item.positionX / this.cellWidth),
                y: Math.round(item.positionY / this.cellHeight)
            };
        }
        return position;
    }
    snapItemPositionToGrid(item) {
        const position = this.generateItemPosition(item);
        let col = position.x;
        let row = position.y;
        // Keep item position within the grid and don't let the item create more
        // than one extra column
        col = Math.max(col, 0);
        row = Math.max(row, 0);
        if (this.options.direction === 'horizontal') {
            col = Math.min(col, this._maxGridCols);
        }
        else {
            col = Math.min(col, Math.max(0, this.options.lanes - item.w));
        }
        // check if element is pinned
        if (this.gridList.isOverFixedArea(col, row, item.w, item.h)) {
            return [item.x, item.y];
        }
        return [col, row];
    }
    dragSizeChanged(newSize) {
        if (!this.previousDragSize) {
            return true;
        }
        return (newSize[0] !== this.previousDragSize[0] ||
            newSize[1] !== this.previousDragSize[1]);
    }
    dragPositionChanged(newPosition) {
        if (!this.previousDragPosition) {
            return true;
        }
        return (newPosition[0] !== this.previousDragPosition[0] ||
            newPosition[1] !== this.previousDragPosition[1]);
    }
    highlightPositionForItem(item) {
        const size = item.calculateSize(this);
        const position = item.calculatePosition(this);
        this.$positionHighlight.style.width = size.width + 'px';
        this.$positionHighlight.style.height = size.height + 'px';
        this.$positionHighlight.style.left = position.left + 'px';
        this.$positionHighlight.style.top = position.top + 'px';
        this.$positionHighlight.style.display = '';
        if (this.options.heightToFontSizeRatio) {
            this.$positionHighlight.style['font-size'] = this._fontSize;
        }
    }
    updateCachedItems() {
        // Notify the user with the items that changed since the previous snapshot
        this.triggerOnChange(null);
        this.gridsterOptions.responsiveOptions.forEach((options) => {
            this.triggerOnChange(options.breakpoint);
        });
        this.copyItems();
    }
    triggerOnChange(breakpoint) {
        const items = breakpoint ? this._itemsMap[breakpoint] : this._items;
        const changeItems = this.gridList.getChangedItems(items || [], breakpoint);
        changeItems
            .filter((itemChange) => {
            return itemChange.item.itemComponent;
        })
            .forEach((itemChange) => {
            if (itemChange.changes.indexOf('x') >= 0) {
                itemChange.item.triggerChangeX(breakpoint);
            }
            if (itemChange.changes.indexOf('y') >= 0) {
                itemChange.item.triggerChangeY(breakpoint);
            }
            if (itemChange.changes.indexOf('w') >= 0) {
                itemChange.item.triggerChangeW(breakpoint);
            }
            if (itemChange.changes.indexOf('h') >= 0) {
                itemChange.item.triggerChangeH(breakpoint);
            }
            // should be called only once (not for each breakpoint)
            itemChange.item.itemComponent.change.emit({
                item: itemChange.item,
                oldValues: itemChange.oldValues || {},
                isNew: itemChange.isNew,
                changes: itemChange.changes,
                breakpoint: breakpoint
            });
        });
    }
    removePositionHighlight() {
        this.$positionHighlight.style.display = 'none';
    }
}
GridsterService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
GridsterService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXIuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXIyZ3JpZHN0ZXIvc3JjL2xpYi9ncmlkc3Rlci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0MsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMvQixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFOUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHFCQUFxQixDQUFDOztBQVEvQyxNQUFNLE9BQU8sZUFBZTtJQTJDeEI7UUF0Q0EsVUFBSyxHQUF3QixFQUFFLENBQUM7UUFDaEMsV0FBTSxHQUF3QixFQUFFLENBQUM7UUFDakMsY0FBUyxHQUFrRCxFQUFFLENBQUM7UUFDOUQsa0JBQWEsR0FBd0IsRUFBRSxDQUFDO1FBWXhDLDBCQUFxQixHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7UUFVL0Isc0JBQWlCLEdBQTBCLElBQUksT0FBTyxFQUFFLENBQUM7UUFXeEQsV0FBTSxHQUFHLEtBQUssQ0FBQztRQUduQixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDeEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUM3QixDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxD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Q0FBQztnQkFDdEMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxJQUFJO2dCQUNyQixTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVMsSUFBSSxFQUFFO2dCQUNyQyxLQUFLLEVBQUUsVUFBVSxDQUFDLEtBQUs7Z0JBQ3ZCLE9BQU8sRUFBRSxVQUFVLENBQUMsT0FBTztnQkFDM0IsVUFBVSxFQUFFLFVBQVU7YUFDekIsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBRU8sdUJBQXVCO1FBQzNCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztJQUNuRCxDQUFDOzs2R0Fwa0JRLGVBQWU7aUhBQWYsZUFBZTs0RkFBZixlQUFlO2tCQUQzQixVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgU3ViamVjdCB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgZGVib3VuY2VUaW1lIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuXG5pbXBvcnQgeyBHcmlkTGlzdCB9IGZyb20gJy4vZ3JpZExpc3QvZ3JpZExpc3QnO1xuaW1wb3J0IHsgSUdyaWRzdGVyT3B0aW9ucyB9IGZyb20gJy4vSUdyaWRzdGVyT3B0aW9ucyc7XG5pbXBvcnQgeyBJR3JpZHN0ZXJEcmFnZ2FibGVPcHRpb25zIH0gZnJvbSAnLi9JR3JpZHN0ZXJEcmFnZ2FibGVPcHRpb25zJztcbmltcG9ydCB7IEdyaWRMaXN0SXRlbSB9IGZyb20gJy4vZ3JpZExpc3QvR3JpZExpc3RJdGVtJztcbmltcG9ydCB7IEdyaWRzdGVyQ29tcG9uZW50IH0gZnJvbSAnLi9ncmlkc3Rlci5jb21wb25lbnQnO1xuaW1wb3J0IHsgR3JpZHN0ZXJPcHRpb25zIH0gZnJvbSAnLi9Hcmlkc3Rlck9wdGlvbnMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJTZXJ2aWNlIHtcbiAgICAkZWxlbWVudDogSFRNTEVsZW1lbnQ7XG5cbiAgICBncmlkTGlzdDogR3JpZExpc3Q7XG5cbiAgICBpdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPiA9IFtdO1xuICAgIF9pdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPiA9IFtdO1xuICAgIF9pdGVtc01hcDogeyBbYnJlYWtwb2ludDogc3RyaW5nXTogQXJyYXk8R3JpZExpc3RJdGVtPiB9ID0ge307XG4gICAgZGlzYWJsZWRJdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPiA9IFtdO1xuXG4gICAgb3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucztcbiAgICBkcmFnZ2FibGVPcHRpb25zOiBJR3JpZHN0ZXJEcmFnZ2FibGVPcHRpb25zO1xuXG4gICAgZ3JpZHN0ZXJSZWN0OiBDbGllbnRSZWN0O1xuICAgIGdyaWRzdGVyU2Nyb2xsRGF0YTogeyBzY3JvbGxUb3A6IG51bWJlciwgc2Nyb2xsTGVmdDogbnVtYmVyIH07XG5cbiAgICBncmlkc3Rlck9wdGlvbnM6IEdyaWRzdGVyT3B0aW9ucztcblxuICAgIGdyaWRzdGVyQ29tcG9uZW50OiBHcmlkc3RlckNvbXBvbmVudDtcblxuICAgIGRlYm91bmNlUmVuZGVyU3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgICBwdWJsaWMgJHBvc2l0aW9uSGlnaGxpZ2h0OiBIVE1MRWxlbWVudDtcblxuICAgIHB1YmxpYyBtYXhJdGVtV2lkdGg6IG51bWJlcjtcbiAgICBwdWJsaWMgbWF4SXRlbUhlaWdodDogbnVtYmVyO1xuXG4gICAgcHVibGljIGNlbGxXaWR0aDogbnVtYmVyO1xuICAgIHB1YmxpYyBjZWxsSGVpZ2h0OiBudW1iZXI7XG5cbiAgICBwdWJsaWMgaXRlbVJlbW92ZVN1YmplY3Q6IFN1YmplY3Q8R3JpZExpc3RJdGVtPiA9IG5ldyBTdWJqZWN0KCk7XG5cbiAgICBwcml2YXRlIF9mb250U2l6ZTogbnVtYmVyO1xuXG4gICAgcHJpdmF0ZSBwcmV2aW91c0RyYWdQb3NpdGlvbjogQXJyYXk8bnVtYmVyPjtcbiAgICBwcml2YXRlIHByZXZpb3VzRHJhZ1NpemU6IEFycmF5PG51bWJlcj47XG5cbiAgICBwcml2YXRlIGN1cnJlbnRFbGVtZW50OiBIVE1MRWxlbWVudDtcblxuICAgIHByaXZhdGUgX21heEdyaWRDb2xzOiBudW1iZXI7XG5cbiAgICBwcml2YXRlIGlzSW5pdCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaXRlbVJlbW92ZVN1YmplY3QucGlwZShkZWJvdW5jZVRpbWUoMCkpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdyaWRMaXN0LnB1bGxJdGVtc1RvTGVmdCgpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FjaGVkSXRlbXMoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5kZWJvdW5jZVJlbmRlclN1YmplY3QucGlwZShkZWJvdW5jZVRpbWUoMCkpLnN1YnNjcmliZSgoKSA9PiB0aGlzLnJlbmRlcigpKTtcbiAgICB9XG5cbiAgICBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0luaXQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTXVzdCBiZSBjYWxsZWQgYmVmb3JlIGluaXRcbiAgICAgKiBAcGFyYW0gaXRlbVxuICAgICAqL1xuICAgIHJlZ2lzdGVySXRlbShpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcblxuICAgICAgICB0aGlzLml0ZW1zLnB1c2goaXRlbSk7XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cblxuICAgIGluaXQoZ3JpZHN0ZXJDb21wb25lbnQ6IEdyaWRzdGVyQ29tcG9uZW50KSB7XG5cbiAgICAgICAgdGhpcy5ncmlkc3RlckNvbXBvbmVudCA9IGdyaWRzdGVyQ29tcG9uZW50O1xuXG4gICAgICAgIHRoaXMuZHJhZ2dhYmxlT3B0aW9ucyA9IGdyaWRzdGVyQ29tcG9uZW50LmRyYWdnYWJsZU9wdGlvbnM7XG5cbiAgICAgICAgdGhpcy5ncmlkc3Rlck9wdGlvbnMgPSBncmlkc3RlckNvbXBvbmVudC5ncmlkc3Rlck9wdGlvbnM7XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWF4SXRlbVNpemUoKTtcblxuICAgICAgICAvLyBVc2VkIHRvIGhpZ2hsaWdodCBhIHBvc2l0aW9uIGFuIGVsZW1lbnQgd2lsbCBsYW5kIG9uIHVwb24gZHJvcFxuICAgICAgICBpZiAodGhpcy4kcG9zaXRpb25IaWdobGlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlUG9zaXRpb25IaWdobGlnaHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdEdyaWRMaXN0KCk7XG5cbiAgICAgICAgdGhpcy5pc0luaXQgPSB0cnVlO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jb3B5SXRlbXMoKTtcbiAgICAgICAgICAgIHRoaXMuZml4SXRlbXNQb3NpdGlvbnMoKTtcblxuICAgICAgICAgICAgdGhpcy5ncmlkc3RlckNvbXBvbmVudC5yZWZsb3dHcmlkc3Rlcih0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXJDb21wb25lbnQuc2V0UmVhZHkoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5pdEdyaWRMaXN0KCkge1xuICAgICAgICAvLyBDcmVhdGUgaW5zdGFuY2Ugb2YgR3JpZExpc3QgKGRlY291cGxlZCBsaWIgZm9yIGhhbmRsaW5nIHRoZSBncmlkXG4gICAgICAgIC8vIHBvc2l0aW9uaW5nIGFuZCBzb3J0aW5nIHBvc3QtZHJhZyBhbmQgZHJvcHBpbmcpXG4gICAgICAgIHRoaXMuZ3JpZExpc3QgPSBuZXcgR3JpZExpc3QodGhpcy5pdGVtcywgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlTWF4SXRlbVNpemUoKTtcbiAgICAgICAgdGhpcy5ncmlkTGlzdC5nZW5lcmF0ZUdyaWQoKTtcbiAgICAgICAgdGhpcy5hcHBseVNpemVUb0l0ZW1zKCk7XG4gICAgICAgIHRoaXMuYXBwbHlQb3NpdGlvblRvSXRlbXMoKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoTGluZXMoKTtcbiAgICB9XG5cbiAgICByZWZsb3coKSB7XG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ2VsbFNpemUoKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9XG5cbiAgICBmaXhJdGVtc1Bvc2l0aW9ucygpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yZXNwb25zaXZlU2l6ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZExpc3QuZml4SXRlbXNQb3NpdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3JpZExpc3QuZml4SXRlbXNQb3NpdGlvbnModGhpcy5ncmlkc3Rlck9wdGlvbnMuYmFzaWNPcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMuZ3JpZHN0ZXJPcHRpb25zLnJlc3BvbnNpdmVPcHRpb25zLmZvckVhY2goKG9wdGlvbnM6IElHcmlkc3Rlck9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRMaXN0LmZpeEl0ZW1zUG9zaXRpb25zKG9wdGlvbnMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUNhY2hlZEl0ZW1zKCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlSXRlbShpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xuXG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgICAgdGhpcy5pdGVtcy5zcGxpY2UodGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZ3JpZExpc3QuZGVsZXRlSXRlbVBvc2l0aW9uRnJvbUdyaWQoaXRlbSk7XG4gICAgICAgIHRoaXMucmVtb3ZlSXRlbUZyb21DYWNoZShpdGVtKTtcbiAgICB9XG5cbiAgICBvblJlc2l6ZVN0YXJ0KGl0ZW06IEdyaWRMaXN0SXRlbSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRFbGVtZW50ID0gaXRlbS4kZWxlbWVudDtcblxuICAgICAgICB0aGlzLmNvcHlJdGVtcygpO1xuXG4gICAgICAgIHRoaXMuX21heEdyaWRDb2xzID0gdGhpcy5ncmlkTGlzdC5ncmlkLmxlbmd0aDtcblxuICAgICAgICB0aGlzLmhpZ2hsaWdodFBvc2l0aW9uRm9ySXRlbShpdGVtKTtcblxuICAgICAgICB0aGlzLmdyaWRzdGVyQ29tcG9uZW50LmlzUmVzaXppbmcgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMucmVmcmVzaExpbmVzKCk7XG4gICAgfVxuXG4gICAgb25SZXNpemVEcmFnKGl0ZW06IEdyaWRMaXN0SXRlbSkge1xuICAgICAgICBjb25zdCBuZXdTaXplID0gdGhpcy5zbmFwSXRlbVNpemVUb0dyaWQoaXRlbSk7XG4gICAgICAgIGNvbnN0IHNpemVDaGFuZ2VkID0gdGhpcy5kcmFnU2l6ZUNoYW5nZWQobmV3U2l6ZSk7XG4gICAgICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gdGhpcy5zbmFwSXRlbVBvc2l0aW9uVG9HcmlkKGl0ZW0pO1xuICAgICAgICBjb25zdCBwb3NpdGlvbkNoYW5nZWQgPSB0aGlzLmRyYWdQb3NpdGlvbkNoYW5nZWQobmV3UG9zaXRpb24pO1xuXG4gICAgICAgIGlmIChzaXplQ2hhbmdlZCB8fCBwb3NpdGlvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIC8vIFJlZ2VuZXJhdGUgdGhlIGdyaWQgd2l0aCB0aGUgcG9zaXRpb25zIGZyb20gd2hlbiB0aGUgZHJhZyBzdGFydGVkXG4gICAgICAgICAgICB0aGlzLnJlc3RvcmVDYWNoZWRJdGVtcygpO1xuICAgICAgICAgICAgdGhpcy5ncmlkTGlzdC5nZW5lcmF0ZUdyaWQoKTtcblxuICAgICAgICAgICAgdGhpcy5wcmV2aW91c0RyYWdQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uO1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c0RyYWdTaXplID0gbmV3U2l6ZTtcblxuICAgICAgICAgICAgdGhpcy5ncmlkTGlzdC5tb3ZlQW5kUmVzaXplKGl0ZW0sIG5ld1Bvc2l0aW9uLCB7dzogbmV3U2l6ZVswXSwgaDogbmV3U2l6ZVsxXX0pO1xuXG4gICAgICAgICAgICAvLyBWaXN1YWxseSB1cGRhdGUgaXRlbSBwb3NpdGlvbnMgYW5kIGhpZ2hsaWdodCBzaGFwZVxuICAgICAgICAgICAgdGhpcy5hcHBseVBvc2l0aW9uVG9JdGVtcyh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0UG9zaXRpb25Gb3JJdGVtKGl0ZW0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb25SZXNpemVTdG9wKGl0ZW06IEdyaWRMaXN0SXRlbSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLnVwZGF0ZUNhY2hlZEl0ZW1zKCk7XG4gICAgICAgIHRoaXMucHJldmlvdXNEcmFnU2l6ZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5yZW1vdmVQb3NpdGlvbkhpZ2hsaWdodCgpO1xuXG4gICAgICAgIHRoaXMuZ3JpZHN0ZXJDb21wb25lbnQuaXNSZXNpemluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuZ3JpZExpc3QucHVsbEl0ZW1zVG9MZWZ0KGl0ZW0pO1xuICAgICAgICB0aGlzLmRlYm91bmNlUmVuZGVyU3ViamVjdC5uZXh0KG51bGwpO1xuXG4gICAgICAgIHRoaXMuZml4SXRlbXNQb3NpdGlvbnMoKTtcbiAgICB9XG5cbiAgICBvblN0YXJ0KGl0ZW06IEdyaWRMaXN0SXRlbSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRFbGVtZW50ID0gaXRlbS4kZWxlbWVudDtcbiAgICAgICAgLy8gaXRlbUN0cmwuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIC8vIENyZWF0ZSBhIGRlZXAgY29weSBvZiB0aGUgaXRlbXM7IHdlIHVzZSB0aGVtIHRvIHJldmVydCB0aGUgaXRlbVxuICAgICAgICAvLyBwb3NpdGlvbnMgYWZ0ZXIgZWFjaCBkcmFnIGNoYW5nZSwgbWFraW5nIGFuIGVudGlyZSBkcmFnIG9wZXJhdGlvbiBsZXNzXG4gICAgICAgIC8vIGRpc3RydWN0YWJsZVxuICAgICAgICB0aGlzLmNvcHlJdGVtcygpO1xuXG4gICAgICAgIC8vIFNpbmNlIGRyYWdnaW5nIGFjdHVhbGx5IGFsdGVycyB0aGUgZ3JpZCwgd2UgbmVlZCB0byBlc3RhYmxpc2ggdGhlIG51bWJlclxuICAgICAgICAvLyBvZiBjb2xzICgrMSBleHRyYSkgYmVmb3JlIHRoZSBkcmFnIHN0YXJ0c1xuXG4gICAgICAgIHRoaXMuX21heEdyaWRDb2xzID0gdGhpcy5ncmlkTGlzdC5ncmlkLmxlbmd0aDtcblxuICAgICAgICB0aGlzLmdyaWRzdGVyQ29tcG9uZW50LmlzRHJhZ2dpbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLmdyaWRzdGVyQ29tcG9uZW50LnVwZGF0ZUdyaWRzdGVyRWxlbWVudERhdGEoKTtcblxuICAgICAgICB0aGlzLnJlZnJlc2hMaW5lcygpO1xuICAgIH1cblxuICAgIG9uRHJhZyhpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgY29uc3QgbmV3UG9zaXRpb24gPSB0aGlzLnNuYXBJdGVtUG9zaXRpb25Ub0dyaWQoaXRlbSk7XG5cbiAgICAgICAgaWYgKHRoaXMuZHJhZ1Bvc2l0aW9uQ2hhbmdlZChuZXdQb3NpdGlvbikpIHtcblxuICAgICAgICAgICAgLy8gUmVnZW5lcmF0ZSB0aGUgZ3JpZCB3aXRoIHRoZSBwb3NpdGlvbnMgZnJvbSB3aGVuIHRoZSBkcmFnIHN0YXJ0ZWRcbiAgICAgICAgICAgIHRoaXMucmVzdG9yZUNhY2hlZEl0ZW1zKCk7XG4gICAgICAgICAgICB0aGlzLmdyaWRMaXN0LmdlbmVyYXRlR3JpZCgpO1xuXG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzRHJhZ1Bvc2l0aW9uID0gbmV3UG9zaXRpb247XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ25vbmUnICYmXG4gICAgICAgICAgICAgICAgIXRoaXMuZ3JpZExpc3QuY2hlY2tJdGVtQWJvdmVFbXB0eUFyZWEoaXRlbSwge3g6IG5ld1Bvc2l0aW9uWzBdLCB5OiBuZXdQb3NpdGlvblsxXX0pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBTaW5jZSB0aGUgaXRlbXMgbGlzdCBpcyBhIGRlZXAgY29weSwgd2UgbmVlZCB0byBmZXRjaCB0aGUgaXRlbVxuICAgICAgICAgICAgLy8gY29ycmVzcG9uZGluZyB0byB0aGlzIGRyYWcgYWN0aW9uIGFnYWluXG4gICAgICAgICAgICB0aGlzLmdyaWRMaXN0Lm1vdmVJdGVtVG9Qb3NpdGlvbihpdGVtLCBuZXdQb3NpdGlvbik7XG5cbiAgICAgICAgICAgIC8vIFZpc3VhbGx5IHVwZGF0ZSBpdGVtIHBvc2l0aW9ucyBhbmQgaGlnaGxpZ2h0IHNoYXBlXG4gICAgICAgICAgICB0aGlzLmFwcGx5UG9zaXRpb25Ub0l0ZW1zKHRydWUpO1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRQb3NpdGlvbkZvckl0ZW0oaXRlbSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUNhY2hlZEl0ZW1zKCk7XG4gICAgICAgIHRoaXMucHJldmlvdXNEcmFnUG9zaXRpb24gPSBudWxsO1xuICAgICAgICB0aGlzLnVwZGF0ZU1heEl0ZW1TaXplKCk7XG4gICAgICAgIHRoaXMuYXBwbHlQb3NpdGlvblRvSXRlbXMoKTtcbiAgICAgICAgdGhpcy5yZW1vdmVQb3NpdGlvbkhpZ2hsaWdodCgpO1xuICAgICAgICB0aGlzLmN1cnJlbnRFbGVtZW50ID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLmdyaWRzdGVyQ29tcG9uZW50LmlzRHJhZ2dpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvbkRyYWdPdXQgKGl0ZW06IEdyaWRMaXN0SXRlbSkge1xuXG4gICAgICAgIHRoaXMuY2FuY2VsKCk7XG5cbiAgICAgICAgY29uc3QgaWR4ID0gdGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pO1xuICAgICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgICAgIHRoaXMuaXRlbXMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmdyaWRMaXN0LnB1bGxJdGVtc1RvTGVmdCgpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIG9uU3RvcChpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgdGhpcy5jdXJyZW50RWxlbWVudCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy51cGRhdGVDYWNoZWRJdGVtcygpO1xuICAgICAgICB0aGlzLnByZXZpb3VzRHJhZ1Bvc2l0aW9uID0gbnVsbDtcblxuICAgICAgICB0aGlzLnJlbW92ZVBvc2l0aW9uSGlnaGxpZ2h0KCk7XG5cbiAgICAgICAgdGhpcy5ncmlkTGlzdC5wdWxsSXRlbXNUb0xlZnQoaXRlbSk7XG5cbiAgICAgICAgdGhpcy5ncmlkc3RlckNvbXBvbmVudC5pc0RyYWdnaW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5yZWZyZXNoTGluZXMoKTtcbiAgICB9XG5cbiAgICBjYWxjdWxhdGVDZWxsU2l6ZSgpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgdGhpcy5jZWxsSGVpZ2h0ID0gdGhpcy5jYWxjdWxhdGVDZWxsSGVpZ2h0KCk7XG4gICAgICAgICAgICB0aGlzLmNlbGxXaWR0aCA9IHRoaXMub3B0aW9ucy5jZWxsV2lkdGggfHwgdGhpcy5jZWxsSGVpZ2h0ICogdGhpcy5vcHRpb25zLndpZHRoSGVpZ2h0UmF0aW87XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNlbGxXaWR0aCA9IHRoaXMuY2FsY3VsYXRlQ2VsbFdpZHRoKCk7XG4gICAgICAgICAgICB0aGlzLmNlbGxIZWlnaHQgPSB0aGlzLm9wdGlvbnMuY2VsbEhlaWdodCB8fCB0aGlzLmNlbGxXaWR0aCAvIHRoaXMub3B0aW9ucy53aWR0aEhlaWdodFJhdGlvO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaGVpZ2h0VG9Gb250U2l6ZVJhdGlvKSB7XG4gICAgICAgICAgICB0aGlzLl9mb250U2l6ZSA9IHRoaXMuY2VsbEhlaWdodCAqIHRoaXMub3B0aW9ucy5oZWlnaHRUb0ZvbnRTaXplUmF0aW87XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhcHBseVBvc2l0aW9uVG9JdGVtcyhpbmNyZWFzZUdyaWRzdGVyU2l6ZT8pIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hyaW5rKSB7XG4gICAgICAgICAgICBpbmNyZWFzZUdyaWRzdGVyU2l6ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50IGdyb3VwIHNlcGFyYXRvcnNcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBEb24ndCBpbnRlcmZlcmUgd2l0aCB0aGUgcG9zaXRpb25zIG9mIHRoZSBkcmFnZ2VkIGl0ZW1zXG4gICAgICAgICAgICBpZiAodGhpcy5pc0N1cnJlbnRFbGVtZW50KHRoaXMuaXRlbXNbaV0uJGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmFwcGx5UG9zaXRpb24odGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjaGlsZCA9IDxIVE1MRWxlbWVudD50aGlzLmdyaWRzdGVyQ29tcG9uZW50LiRlbGVtZW50LmZpcnN0Q2hpbGQ7XG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgd2lkdGggb2YgdGhlIGVudGlyZSBncmlkIGNvbnRhaW5lciB3aXRoIGVub3VnaCByb29tIG9uIHRoZVxuICAgICAgICAvLyByaWdodCB0byBhbGxvdyBkcmFnZ2luZyBpdGVtcyB0byB0aGUgZW5kIG9mIHRoZSBncmlkLlxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICBjb25zdCBpbmNyZWFzZVdpZHRoV2l0aCA9IChpbmNyZWFzZUdyaWRzdGVyU2l6ZSkgPyB0aGlzLm1heEl0ZW1XaWR0aCA6IDA7XG4gICAgICAgICAgICBjaGlsZC5zdHlsZS5oZWlnaHQgPSAnJztcbiAgICAgICAgICAgIGNoaWxkLnN0eWxlLndpZHRoID0gKCh0aGlzLmdyaWRMaXN0LmdyaWQubGVuZ3RoICsgaW5jcmVhc2VXaWR0aFdpdGgpICogdGhpcy5jZWxsV2lkdGgpICsgJ3B4JztcblxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZ3JpZExpc3QuZ3JpZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGluY3JlYXNlSGVpZ2h0V2l0aCA9IChpbmNyZWFzZUdyaWRzdGVyU2l6ZSkgPyB0aGlzLm1heEl0ZW1IZWlnaHQgOiAwO1xuICAgICAgICAgICAgY2hpbGQuc3R5bGUuaGVpZ2h0ID0gKCh0aGlzLmdyaWRMaXN0LmdyaWQubGVuZ3RoICsgaW5jcmVhc2VIZWlnaHRXaXRoKSAqIHRoaXMuY2VsbEhlaWdodCkgKyAncHgnO1xuICAgICAgICAgICAgY2hpbGQuc3R5bGUud2lkdGggPSAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlZnJlc2hMaW5lcygpIHtcbiAgICAgICAgY29uc3QgZ3JpZHN0ZXJDb250YWluZXIgPSA8SFRNTEVsZW1lbnQ+dGhpcy5ncmlkc3RlckNvbXBvbmVudC4kZWxlbWVudC5maXJzdENoaWxkO1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubGluZXMgJiYgdGhpcy5vcHRpb25zLmxpbmVzLnZpc2libGUgJiZcbiAgICAgICAgICAgICh0aGlzLmdyaWRzdGVyQ29tcG9uZW50LmlzRHJhZ2dpbmcgfHwgdGhpcy5ncmlkc3RlckNvbXBvbmVudC5pc1Jlc2l6aW5nIHx8IHRoaXMub3B0aW9ucy5saW5lcy5hbHdheXMpKSB7XG4gICAgICAgICAgICBjb25zdCBsaW5lc0NvbG9yID0gdGhpcy5vcHRpb25zLmxpbmVzLmNvbG9yIHx8ICcjZDhkOGQ4JztcbiAgICAgICAgICAgIGNvbnN0IGxpbmVzQmdDb2xvciA9IHRoaXMub3B0aW9ucy5saW5lcy5iYWNrZ3JvdW5kQ29sb3IgfHwgJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIGNvbnN0IGxpbmVzV2lkdGggPSB0aGlzLm9wdGlvbnMubGluZXMud2lkdGggfHwgMTtcbiAgICAgICAgICAgIGNvbnN0IGJnUG9zaXRpb24gPSBsaW5lc1dpZHRoIC8gMjtcblxuICAgICAgICAgICAgZ3JpZHN0ZXJDb250YWluZXIuc3R5bGUuYmFja2dyb3VuZFNpemUgPSBgJHt0aGlzLmNlbGxXaWR0aH1weCAke3RoaXMuY2VsbEhlaWdodH1weGA7XG4gICAgICAgICAgICBncmlkc3RlckNvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb24gPSBgLSR7YmdQb3NpdGlvbn1weCAtJHtiZ1Bvc2l0aW9ufXB4YDtcbiAgICAgICAgICAgIGdyaWRzdGVyQ29udGFpbmVyLnN0eWxlLmJhY2tncm91bmRJbWFnZSA9IGBcbiAgICAgICAgICAgICAgICBsaW5lYXItZ3JhZGllbnQodG8gcmlnaHQsICR7bGluZXNDb2xvcn0gJHtsaW5lc1dpZHRofXB4LCAke2xpbmVzQmdDb2xvcn0gJHtsaW5lc1dpZHRofXB4KSxcbiAgICAgICAgICAgICAgICBsaW5lYXItZ3JhZGllbnQodG8gYm90dG9tLCAke2xpbmVzQ29sb3J9ICR7bGluZXNXaWR0aH1weCwgJHtsaW5lc0JnQ29sb3J9ICR7bGluZXNXaWR0aH1weClcbiAgICAgICAgICAgIGA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncmlkc3RlckNvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kU2l6ZSA9ICcnO1xuICAgICAgICAgICAgZ3JpZHN0ZXJDb250YWluZXIuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gJyc7XG4gICAgICAgICAgICBncmlkc3RlckNvbnRhaW5lci5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2UgPSAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVtb3ZlSXRlbUZyb21DYWNoZShpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgdGhpcy5faXRlbXMgPSB0aGlzLl9pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcihjYWNoZWRJdGVtID0+IGNhY2hlZEl0ZW0uJGVsZW1lbnQgIT09IGl0ZW0uJGVsZW1lbnQpO1xuXG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuX2l0ZW1zTWFwKVxuICAgICAgICAgICAgLmZvckVhY2goKGJyZWFrcG9pbnQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2l0ZW1zTWFwW2JyZWFrcG9pbnRdID0gdGhpcy5faXRlbXNNYXBbYnJlYWtwb2ludF1cbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcihjYWNoZWRJdGVtID0+IGNhY2hlZEl0ZW0uJGVsZW1lbnQgIT09IGl0ZW0uJGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb3B5SXRlbXMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2l0ZW1zID0gdGhpcy5pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+IHRoaXMuaXNWYWxpZEdyaWRJdGVtKGl0ZW0pKVxuICAgICAgICAgICAgLm1hcCgoaXRlbTogR3JpZExpc3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uY29weUZvckJyZWFrcG9pbnQobnVsbCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmdyaWRzdGVyT3B0aW9ucy5yZXNwb25zaXZlT3B0aW9ucy5mb3JFYWNoKChvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtc01hcFtvcHRpb25zLmJyZWFrcG9pbnRdID0gdGhpcy5pdGVtc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoaXRlbSA9PiB0aGlzLmlzVmFsaWRHcmlkSXRlbShpdGVtKSlcbiAgICAgICAgICAgICAgICAubWFwKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0uY29weUZvckJyZWFrcG9pbnQob3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXBkYXRlIG1heEl0ZW1XaWR0aCBhbmQgbWF4SXRlbUhlaWdodCB2YWxlcyBhY2NvcmRpbmcgdG8gY3VycmVudCBzdGF0ZSBvZiBpdGVtc1xuICAgICAqL1xuICAgIHByaXZhdGUgdXBkYXRlTWF4SXRlbVNpemUoKSB7XG4gICAgICAgIHRoaXMubWF4SXRlbVdpZHRoID0gTWF0aC5tYXguYXBwbHkoXG4gICAgICAgICAgICBudWxsLCB0aGlzLml0ZW1zLm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnc7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMubWF4SXRlbUhlaWdodCA9IE1hdGgubWF4LmFwcGx5KFxuICAgICAgICAgICAgbnVsbCwgdGhpcy5pdGVtcy5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5oO1xuICAgICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSBpdGVtcyBwcm9wZXJ0aWVzIG9mIHByZXZpb3VzbHkgY2FjaGVkIGl0ZW1zXG4gICAgICovXG4gICAgcHJpdmF0ZSByZXN0b3JlQ2FjaGVkSXRlbXMoKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5vcHRpb25zLmJyZWFrcG9pbnQgPyB0aGlzLl9pdGVtc01hcFt0aGlzLm9wdGlvbnMuYnJlYWtwb2ludF0gOiB0aGlzLl9pdGVtcztcblxuICAgICAgICB0aGlzLml0ZW1zXG4gICAgICAgICAgICAuZmlsdGVyKGl0ZW0gPT4gdGhpcy5pc1ZhbGlkR3JpZEl0ZW0oaXRlbSkpXG4gICAgICAgICAgICAuZm9yRWFjaCgoaXRlbTogR3JpZExpc3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2FjaGVkSXRlbTogR3JpZExpc3RJdGVtID0gaXRlbXMuZmlsdGVyKGNhY2hlZEl0bSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZWRJdG0uJGVsZW1lbnQgPT09IGl0ZW0uJGVsZW1lbnQ7XG4gICAgICAgICAgICAgICAgfSlbMF07XG5cbiAgICAgICAgICAgICAgICBpdGVtLnggPSBjYWNoZWRJdGVtLng7XG4gICAgICAgICAgICAgICAgaXRlbS55ID0gY2FjaGVkSXRlbS55O1xuXG4gICAgICAgICAgICAgICAgaXRlbS53ID0gY2FjaGVkSXRlbS53O1xuICAgICAgICAgICAgICAgIGl0ZW0uaCA9IGNhY2hlZEl0ZW0uaDtcbiAgICAgICAgICAgICAgICBpdGVtLmF1dG9TaXplID0gY2FjaGVkSXRlbS5hdXRvU2l6ZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIGl0ZW0gc2hvdWxkIHJlYWN0IG9uIGdyaWRcbiAgICAgKiBAcGFyYW0gR3JpZExpc3RJdGVtIGl0ZW1cbiAgICAgKiBAcmV0dXJucyBib29sZWFuXG4gICAgICovXG4gICAgcHJpdmF0ZSBpc1ZhbGlkR3JpZEl0ZW0oaXRlbTogR3JpZExpc3RJdGVtKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09PSAnbm9uZScpIHtcbiAgICAgICAgICAgIHJldHVybiAhIWl0ZW0uaXRlbUNvbXBvbmVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGN1bGF0ZUNlbGxXaWR0aCgpIHtcbiAgICAgICAgY29uc3QgZ3JpZHN0ZXJXaWR0aCA9IHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5ncmlkc3RlckNvbXBvbmVudC4kZWxlbWVudCkud2lkdGgpO1xuXG4gICAgICAgIHJldHVybiBncmlkc3RlcldpZHRoIC8gdGhpcy5vcHRpb25zLmxhbmVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2FsY3VsYXRlQ2VsbEhlaWdodCgpIHtcbiAgICAgICAgY29uc3QgZ3JpZHN0ZXJIZWlnaHQgPSBwYXJzZUZsb2F0KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKHRoaXMuZ3JpZHN0ZXJDb21wb25lbnQuJGVsZW1lbnQpLmhlaWdodCk7XG5cbiAgICAgICAgcmV0dXJuIGdyaWRzdGVySGVpZ2h0IC8gdGhpcy5vcHRpb25zLmxhbmVzO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXBwbHlTaXplVG9JdGVtcygpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLml0ZW1zW2ldLmFwcGx5U2l6ZSgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhlaWdodFRvRm9udFNpemVSYXRpbykge1xuICAgICAgICAgICAgICAgIHRoaXMuaXRlbXNbaV0uJGVsZW1lbnQuc3R5bGVbJ2ZvbnQtc2l6ZSddID0gdGhpcy5fZm9udFNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGlzQ3VycmVudEVsZW1lbnQoZWxlbWVudCkge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudCA9PT0gdGhpcy5jdXJyZW50RWxlbWVudDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNuYXBJdGVtU2l6ZVRvR3JpZChpdGVtOiBHcmlkTGlzdEl0ZW0pOiBBcnJheTxudW1iZXI+IHtcbiAgICAgICAgY29uc3QgaXRlbVNpemUgPSB7XG4gICAgICAgICAgICB3aWR0aDogcGFyc2VJbnQoaXRlbS4kZWxlbWVudC5zdHlsZS53aWR0aCwgMTApIC0gMSxcbiAgICAgICAgICAgIGhlaWdodDogcGFyc2VJbnQoaXRlbS4kZWxlbWVudC5zdHlsZS5oZWlnaHQsIDEwKSAtIDFcbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgY29sU2l6ZSA9IE1hdGgucm91bmQoaXRlbVNpemUud2lkdGggLyB0aGlzLmNlbGxXaWR0aCk7XG4gICAgICAgIGxldCByb3dTaXplID0gTWF0aC5yb3VuZChpdGVtU2l6ZS5oZWlnaHQgLyB0aGlzLmNlbGxIZWlnaHQpO1xuXG4gICAgICAgIC8vIEtlZXAgaXRlbSBtaW5pbXVtIDFcbiAgICAgICAgY29sU2l6ZSA9IE1hdGgubWF4KGNvbFNpemUsIDEpO1xuICAgICAgICByb3dTaXplID0gTWF0aC5tYXgocm93U2l6ZSwgMSk7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgZWxlbWVudCBpcyBwaW5uZWRcbiAgICAgICAgaWYgKHRoaXMuZ3JpZExpc3QuaXNPdmVyRml4ZWRBcmVhKGl0ZW0ueCwgaXRlbS55LCBjb2xTaXplLCByb3dTaXplLCBpdGVtKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtpdGVtLncsIGl0ZW0uaF07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW2NvbFNpemUsIHJvd1NpemVdO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2VuZXJhdGVJdGVtUG9zaXRpb24oaXRlbTogR3JpZExpc3RJdGVtKTogeyB4OiBudW1iZXIsIHk6IG51bWJlciB9IHtcbiAgICAgICAgbGV0IHBvc2l0aW9uO1xuXG4gICAgICAgIGlmIChpdGVtLml0ZW1Qcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvb3JkcyA9IGl0ZW0uaXRlbVByb3RvdHlwZS5nZXRQb3NpdGlvblRvR3JpZHN0ZXIodGhpcyk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB4OiBNYXRoLnJvdW5kKGNvb3Jkcy54IC8gdGhpcy5jZWxsV2lkdGgpLFxuICAgICAgICAgICAgICAgIHk6IE1hdGgucm91bmQoY29vcmRzLnkgLyB0aGlzLmNlbGxIZWlnaHQpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcG9zaXRpb24gPSB7XG4gICAgICAgICAgICAgICAgeDogTWF0aC5yb3VuZChpdGVtLnBvc2l0aW9uWCAvIHRoaXMuY2VsbFdpZHRoKSxcbiAgICAgICAgICAgICAgICB5OiBNYXRoLnJvdW5kKGl0ZW0ucG9zaXRpb25ZIC8gdGhpcy5jZWxsSGVpZ2h0KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNuYXBJdGVtUG9zaXRpb25Ub0dyaWQoaXRlbTogR3JpZExpc3RJdGVtKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5nZW5lcmF0ZUl0ZW1Qb3NpdGlvbihpdGVtKTtcbiAgICAgICAgbGV0IGNvbCA9IHBvc2l0aW9uLng7XG4gICAgICAgIGxldCByb3cgPSBwb3NpdGlvbi55O1xuXG4gICAgICAgIC8vIEtlZXAgaXRlbSBwb3NpdGlvbiB3aXRoaW4gdGhlIGdyaWQgYW5kIGRvbid0IGxldCB0aGUgaXRlbSBjcmVhdGUgbW9yZVxuICAgICAgICAvLyB0aGFuIG9uZSBleHRyYSBjb2x1bW5cbiAgICAgICAgY29sID0gTWF0aC5tYXgoY29sLCAwKTtcbiAgICAgICAgcm93ID0gTWF0aC5tYXgocm93LCAwKTtcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnKSB7XG4gICAgICAgICAgICBjb2wgPSBNYXRoLm1pbihjb2wsIHRoaXMuX21heEdyaWRDb2xzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbCA9IE1hdGgubWluKGNvbCwgTWF0aC5tYXgoMCwgdGhpcy5vcHRpb25zLmxhbmVzIC0gaXRlbS53KSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjaGVjayBpZiBlbGVtZW50IGlzIHBpbm5lZFxuICAgICAgICBpZiAodGhpcy5ncmlkTGlzdC5pc092ZXJGaXhlZEFyZWEoY29sLCByb3csIGl0ZW0udywgaXRlbS5oKSkge1xuICAgICAgICAgICAgcmV0dXJuIFtpdGVtLngsIGl0ZW0ueV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW2NvbCwgcm93XTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRyYWdTaXplQ2hhbmdlZChuZXdTaXplKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghdGhpcy5wcmV2aW91c0RyYWdTaXplKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG5ld1NpemVbMF0gIT09IHRoaXMucHJldmlvdXNEcmFnU2l6ZVswXSB8fFxuICAgICAgICAgICAgbmV3U2l6ZVsxXSAhPT0gdGhpcy5wcmV2aW91c0RyYWdTaXplWzFdKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRyYWdQb3NpdGlvbkNoYW5nZWQobmV3UG9zaXRpb24pOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCF0aGlzLnByZXZpb3VzRHJhZ1Bvc2l0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG5ld1Bvc2l0aW9uWzBdICE9PSB0aGlzLnByZXZpb3VzRHJhZ1Bvc2l0aW9uWzBdIHx8XG4gICAgICAgICAgICBuZXdQb3NpdGlvblsxXSAhPT0gdGhpcy5wcmV2aW91c0RyYWdQb3NpdGlvblsxXSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoaWdobGlnaHRQb3NpdGlvbkZvckl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCBzaXplID0gaXRlbS5jYWxjdWxhdGVTaXplKHRoaXMpO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGl0ZW0uY2FsY3VsYXRlUG9zaXRpb24odGhpcyk7XG5cbiAgICAgICAgdGhpcy4kcG9zaXRpb25IaWdobGlnaHQuc3R5bGUud2lkdGggPSBzaXplLndpZHRoICsgJ3B4JztcbiAgICAgICAgdGhpcy4kcG9zaXRpb25IaWdobGlnaHQuc3R5bGUuaGVpZ2h0ID0gc2l6ZS5oZWlnaHQgKyAncHgnO1xuICAgICAgICB0aGlzLiRwb3NpdGlvbkhpZ2hsaWdodC5zdHlsZS5sZWZ0ID0gcG9zaXRpb24ubGVmdCArICdweCc7XG4gICAgICAgIHRoaXMuJHBvc2l0aW9uSGlnaGxpZ2h0LnN0eWxlLnRvcCA9IHBvc2l0aW9uLnRvcCArICdweCc7XG4gICAgICAgIHRoaXMuJHBvc2l0aW9uSGlnaGxpZ2h0LnN0eWxlLmRpc3BsYXkgPSAnJztcblxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmhlaWdodFRvRm9udFNpemVSYXRpbykge1xuICAgICAgICAgICAgdGhpcy4kcG9zaXRpb25IaWdobGlnaHQuc3R5bGVbJ2ZvbnQtc2l6ZSddID0gdGhpcy5fZm9udFNpemU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ2FjaGVkSXRlbXMoKSB7XG4gICAgICAgIC8vIE5vdGlmeSB0aGUgdXNlciB3aXRoIHRoZSBpdGVtcyB0aGF0IGNoYW5nZWQgc2luY2UgdGhlIHByZXZpb3VzIHNuYXBzaG90XG4gICAgICAgIHRoaXMudHJpZ2dlck9uQ2hhbmdlKG51bGwpO1xuICAgICAgICB0aGlzLmdyaWRzdGVyT3B0aW9ucy5yZXNwb25zaXZlT3B0aW9ucy5mb3JFYWNoKChvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJPbkNoYW5nZShvcHRpb25zLmJyZWFrcG9pbnQpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNvcHlJdGVtcygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJpZ2dlck9uQ2hhbmdlKGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gYnJlYWtwb2ludCA/IHRoaXMuX2l0ZW1zTWFwW2JyZWFrcG9pbnRdIDogdGhpcy5faXRlbXM7XG4gICAgICAgIGNvbnN0IGNoYW5nZUl0ZW1zID0gdGhpcy5ncmlkTGlzdC5nZXRDaGFuZ2VkSXRlbXMoaXRlbXMgfHwgW10sIGJyZWFrcG9pbnQpO1xuXG4gICAgICAgIGNoYW5nZUl0ZW1zXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtQ2hhbmdlOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbUNoYW5nZS5pdGVtLml0ZW1Db21wb25lbnQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZvckVhY2goKGl0ZW1DaGFuZ2U6IGFueSkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1DaGFuZ2UuY2hhbmdlcy5pbmRleE9mKCd4JykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQ2hhbmdlLml0ZW0udHJpZ2dlckNoYW5nZVgoYnJlYWtwb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpdGVtQ2hhbmdlLmNoYW5nZXMuaW5kZXhPZigneScpID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbUNoYW5nZS5pdGVtLnRyaWdnZXJDaGFuZ2VZKGJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXRlbUNoYW5nZS5jaGFuZ2VzLmluZGV4T2YoJ3cnKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1DaGFuZ2UuaXRlbS50cmlnZ2VyQ2hhbmdlVyhicmVha3BvaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1DaGFuZ2UuY2hhbmdlcy5pbmRleE9mKCdoJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtQ2hhbmdlLml0ZW0udHJpZ2dlckNoYW5nZUgoYnJlYWtwb2ludCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlIChub3QgZm9yIGVhY2ggYnJlYWtwb2ludClcbiAgICAgICAgICAgICAgICBpdGVtQ2hhbmdlLml0ZW0uaXRlbUNvbXBvbmVudC5jaGFuZ2UuZW1pdCh7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW06IGl0ZW1DaGFuZ2UuaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWVzOiBpdGVtQ2hhbmdlLm9sZFZhbHVlcyB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgaXNOZXc6IGl0ZW1DaGFuZ2UuaXNOZXcsXG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXM6IGl0ZW1DaGFuZ2UuY2hhbmdlcyxcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtwb2ludDogYnJlYWtwb2ludFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVQb3NpdGlvbkhpZ2hsaWdodCgpIHtcbiAgICAgICAgdGhpcy4kcG9zaXRpb25IaWdobGlnaHQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICB9XG5cbn1cbiJdfQ==