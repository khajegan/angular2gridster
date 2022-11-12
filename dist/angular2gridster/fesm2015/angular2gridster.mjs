import * as i0 from '@angular/core';
import { Injectable, EventEmitter, Component, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, ViewChild, HostBinding, ElementRef, Inject, Directive, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, merge, of, fromEvent, Subscription } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, filter, tap, scan, share, switchMap, takeUntil, publish, take, skip } from 'rxjs/operators';

const utils = {
    setCssElementPosition: function ($element, position) {
        $element.style.left = position.x + 'px';
        $element.style.top = position.y + 'px';
    },
    resetCSSElementPosition: function ($element) {
        $element.style.left = '';
        $element.style.top = '';
    },
    setTransform: function ($element, position) {
        const left = position.x;
        const top = position.y;
        // Replace unitless items with px
        const translate = `translate(${left}px,${top}px)`;
        $element.style['transform'] = translate;
        $element.style['WebkitTransform'] = translate;
        $element.style['MozTransform'] = translate;
        $element.style['msTransform'] = translate;
        $element.style['OTransform'] = translate;
    },
    resetTransform: function ($element) {
        $element.style['transform'] = '';
        $element.style['WebkitTransform'] = '';
        $element.style['MozTransform'] = '';
        $element.style['msTransform'] = '';
        $element.style['OTransform'] = '';
    },
    clearSelection: () => {
        if (document['selection']) {
            document['selection'].empty();
        }
        else if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    },
    isElementFitContainer: function (element, containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        return elRect.left > containerRect.left &&
            elRect.right < containerRect.right &&
            elRect.top > containerRect.top &&
            elRect.bottom < containerRect.bottom;
    },
    isElementIntersectContainer: function (element, containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        const elWidth = elRect.right - elRect.left;
        const elHeight = elRect.bottom - elRect.top;
        return (elRect.left + (elWidth / 2)) > containerRect.left &&
            (elRect.right - (elWidth / 2)) < containerRect.right &&
            (elRect.top + (elHeight / 2)) > containerRect.top &&
            (elRect.bottom - (elHeight / 2)) < containerRect.bottom;
    },
    isElementTouchContainer: function (element, containerEl) {
        const containerRect = containerEl.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        return elRect.right > containerRect.left &&
            elRect.bottom > containerRect.top &&
            elRect.left < containerRect.right &&
            elRect.top < containerRect.bottom;
    },
    isCursorAboveElement: function (event, element) {
        const elRect = element.getBoundingClientRect();
        return event.pageX > elRect.left &&
            event.pageX < elRect.right &&
            event.pageY > elRect.top &&
            event.pageY < elRect.bottom;
    },
    getElementOuterHeight: function ($element) {
        const styleObj = window.getComputedStyle($element);
        // NOTE: Manually calculating height because IE's `clientHeight` isn't always
        // reliable.
        return parseFloat(styleObj.getPropertyValue('height')) +
            parseFloat(styleObj.getPropertyValue('padding-top')) +
            parseFloat(styleObj.getPropertyValue('padding-bottom'));
    },
    getRelativeCoordinates: (element, parentElement) => {
        const parentElementRect = parentElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        return {
            top: elementRect.top - parentElementRect.top,
            left: elementRect.left - parentElementRect.left
        };
    },
    getScrollableContainer(node) {
        const regex = /(auto|scroll)/;
        const parents = (_node, ps) => {
            if (_node.parentNode === null) {
                return ps;
            }
            return parents(_node.parentNode, ps.concat([_node]));
        };
        const style = (_node, prop) => {
            return getComputedStyle(_node, null).getPropertyValue(prop);
        };
        const overflow = _node => {
            return (style(_node, 'overflow') + style(_node, 'overflow-y') + style(_node, 'overflow-x'));
        };
        const scroll = _node => regex.test(overflow(_node));
        /* eslint-disable consistent-return */
        const scrollParent = _node => {
            if (!(_node instanceof HTMLElement || _node instanceof SVGElement)) {
                return;
            }
            const ps = parents(_node.parentNode, []);
            for (let i = 0; i < ps.length; i += 1) {
                if (scroll(ps[i])) {
                    return ps[i];
                }
            }
            return document.scrollingElement || document.documentElement;
        };
        return scrollParent(node);
    }
};

const GridCol = function (lanes) {
    for (let i = 0; i < lanes; i++) {
        this.push(null);
    }
};
// Extend the Array prototype
GridCol.prototype = [];
/**
 * A GridList manages the two-dimensional positions from a list of items,
 * within a virtual matrix.
 *
 * The GridList's main function is to convert the item positions from one
 * grid size to another, maintaining as much of their order as possible.
 *
 * The GridList's second function is to handle collisions when moving an item
 * over another.
 *
 * The positioning algorithm places items in columns. Starting from left to
 * right, going through each column top to bottom.
 *
 * The size of an item is expressed using the number of cols and rows it
 * takes up within the grid (w and h)
 *
 * The position of an item is express using the col and row position within
 * the grid (x and y)
 *
 * An item is an object of structure:
 * {
 *   w: 3, h: 1,
 *   x: 0, y: 1
 * }
 */
class GridList {
    constructor(items, options) {
        this.options = options;
        this.items = items;
        this.adjustSizeOfItems();
        this.generateGrid();
    }
    /**
     * Illustrates grid as text-based table, using a number identifier for each
     * item. E.g.
     *
     *  #|  0  1  2  3  4  5  6  7  8  9 10 11 12 13
     *  --------------------------------------------
     *  0| 00 02 03 04 04 06 08 08 08 12 12 13 14 16
     *  1| 01 -- 03 05 05 07 09 10 11 11 -- 13 15 --
     *
     * Warn: Does not work if items don't have a width or height specified
     * besides their position in the grid.
     */
    toString() {
        const widthOfGrid = this.grid.length;
        let output = '\n #|', border = '\n --', item, i, j;
        // Render the table header
        for (i = 0; i < widthOfGrid; i++) {
            output += ' ' + this.padNumber(i, ' ');
            border += '---';
        }
        output += border;
        // Render table contents row by row, as we go on the y axis
        for (i = 0; i < this.options.lanes; i++) {
            output += '\n' + this.padNumber(i, ' ') + '|';
            for (j = 0; j < widthOfGrid; j++) {
                output += ' ';
                item = this.grid[j][i];
                output += item
                    ? this.padNumber(this.items.indexOf(item), '0')
                    : '--';
            }
        }
        output += '\n';
        return output;
    }
    setOption(name, value) {
        this.options[name] = value;
    }
    /**
     * Build the grid structure from scratch, with the current item positions
     */
    generateGrid() {
        let i;
        this.resetGrid();
        for (i = 0; i < this.items.length; i++) {
            this.markItemPositionToGrid(this.items[i]);
        }
    }
    resizeGrid(lanes) {
        let currentColumn = 0;
        this.options.lanes = lanes;
        this.adjustSizeOfItems();
        this.sortItemsByPosition();
        this.resetGrid();
        // The items will be sorted based on their index within the this.items array,
        // that is their "1d position"
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i], position = this.getItemPosition(item);
            this.updateItemPosition(item, this.findPositionForItem(item, { x: currentColumn, y: 0 }));
            // New items should never be placed to the left of previous items
            currentColumn = Math.max(currentColumn, position.x);
        }
        this.pullItemsToLeft();
    }
    /**
     * This method has two options for the position we want for the item:
     * - Starting from a certain row/column number and only looking for
     *   positions to its right
     * - Accepting positions for a certain row number only (use-case: items
     *   being shifted to the left/right as a result of collisions)
     *
     * @param Object item
     * @param Object start Position from which to start
     *     the search.
     * @param number [fixedRow] If provided, we're going to try to find a
     *     position for the new item on it. If doesn't fit there, we're going
     *     to put it on the first row.
     *
     * @returns Array x and y.
     */
    findPositionForItem(item, start, fixedRow) {
        let x, y, position;
        // Start searching for a position from the horizontal position of the
        // rightmost item from the grid
        for (x = start.x; x < this.grid.length; x++) {
            if (fixedRow !== undefined) {
                position = [x, fixedRow];
                if (this.itemFitsAtPosition(item, position)) {
                    return position;
                }
            }
            else {
                for (y = start.y; y < this.options.lanes; y++) {
                    position = [x, y];
                    if (this.itemFitsAtPosition(item, position)) {
                        return position;
                    }
                }
            }
        }
        // If we've reached this point, we need to start a new column
        const newCol = this.grid.length;
        let newRow = 0;
        if (fixedRow !== undefined &&
            this.itemFitsAtPosition(item, [newCol, fixedRow])) {
            newRow = fixedRow;
        }
        return [newCol, newRow];
    }
    moveAndResize(item, newPosition, size) {
        const position = this.getItemPosition({
            x: newPosition[0],
            y: newPosition[1],
            w: item.w,
            h: item.h
        });
        const width = size.w || item.w, height = size.h || item.h;
        this.updateItemPosition(item, [position.x, position.y]);
        this.updateItemSize(item, width, height);
        this.resolveCollisions(item);
    }
    moveItemToPosition(item, newPosition) {
        const position = this.getItemPosition({
            x: newPosition[0],
            y: newPosition[1],
            w: item.w,
            h: item.h
        });
        this.updateItemPosition(item, [position.x, position.y]);
        this.resolveCollisions(item);
    }
    /**
     * Resize an item and resolve collisions.
     *
     * @param Object item A reference to an item that's part of the grid.
     * @param Object size
     * @param number [size.w=item.w] The new width.
     * @param number [size.h=item.h] The new height.
     */
    resizeItem(item, size) {
        const width = size.w || item.w, height = size.h || item.h;
        this.updateItemSize(item, width, height);
        this.pullItemsToLeft(item);
    }
    /**
     * Compare the current items against a previous snapshot and return only
     * the ones that changed their attributes in the meantime. This includes both
     * position (x, y) and size (w, h)
     *
     * Each item that is returned is not the GridListItem but the helper that holds GridListItem
     * and list of changed properties.
     */
    getChangedItems(initialItems, breakpoint) {
        return this.items
            .map((item) => {
            const changes = [];
            const oldValues = {};
            const initItem = initialItems.find(initItm => initItm.$element === item.$element);
            if (!initItem) {
                return { item, changes: ['x', 'y', 'w', 'h'], isNew: true };
            }
            const oldX = initItem.getValueX(breakpoint);
            if (item.getValueX(breakpoint) !== oldX) {
                changes.push('x');
                if (oldX || oldX === 0) {
                    oldValues.x = oldX;
                }
            }
            const oldY = initItem.getValueY(breakpoint);
            if (item.getValueY(breakpoint) !== oldY) {
                changes.push('y');
                if (oldY || oldY === 0) {
                    oldValues.y = oldY;
                }
            }
            if (item.getValueW(breakpoint) !==
                initItem.getValueW(breakpoint)) {
                changes.push('w');
                oldValues.w = initItem.w;
            }
            if (item.getValueH(breakpoint) !==
                initItem.getValueH(breakpoint)) {
                changes.push('h');
                oldValues.h = initItem.h;
            }
            return { item, oldValues, changes, isNew: false };
        })
            .filter((itemChange) => {
            return itemChange.changes.length;
        });
    }
    resolveCollisions(item) {
        if (!this.tryToResolveCollisionsLocally(item)) {
            this.pullItemsToLeft(item);
        }
        if (this.options.floating) {
            this.pullItemsToLeft();
        }
        else if (this.getItemsCollidingWithItem(item).length) {
            this.pullItemsToLeft();
        }
    }
    pushCollidingItems(fixedItem) {
        // Start a fresh grid with the fixed item already placed inside
        this.sortItemsByPosition();
        this.resetGrid();
        this.generateGrid();
        this.items
            .filter(item => !this.isItemFloating(item) && item !== fixedItem)
            .forEach(item => {
            if (!this.tryToResolveCollisionsLocally(item)) {
                this.pullItemsToLeft(item);
            }
        });
    }
    /**
     * Build the grid from scratch, by using the current item positions and
     * pulling them as much to the left as possible, removing as space between
     * them as possible.
     *
     * If a "fixed item" is provided, its position will be kept intact and the
     * rest of the items will be layed around it.
     */
    pullItemsToLeft(fixedItem) {
        if (this.options.direction === 'none') {
            return;
        }
        // Start a fresh grid with the fixed item already placed inside
        this.sortItemsByPosition();
        this.resetGrid();
        // Start the grid with the fixed item as the first positioned item
        if (fixedItem) {
            const fixedPosition = this.getItemPosition(fixedItem);
            this.updateItemPosition(fixedItem, [
                fixedPosition.x,
                fixedPosition.y
            ]);
        }
        this.items
            .filter((item) => {
            return !item.dragAndDrop && item !== fixedItem;
        })
            .forEach((item) => {
            const fixedPosition = this.getItemPosition(item);
            this.updateItemPosition(item, [
                fixedPosition.x,
                fixedPosition.y
            ]);
        });
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i], position = this.getItemPosition(item);
            // The fixed item keeps its exact position
            if ((fixedItem && item === fixedItem) ||
                !item.dragAndDrop ||
                (!this.options.floating &&
                    this.isItemFloating(item) &&
                    !this.getItemsCollidingWithItem(item).length)) {
                continue;
            }
            const x = this.findLeftMostPositionForItem(item), newPosition = this.findPositionForItem(item, { x: x, y: 0 }, position.y);
            this.updateItemPosition(item, newPosition);
        }
    }
    isOverFixedArea(x, y, w, h, item = null) {
        let itemData = { x, y, w, h };
        if (this.options.direction !== 'horizontal') {
            itemData = { x: y, y: x, w: h, h: w };
        }
        for (let i = itemData.x; i < itemData.x + itemData.w; i++) {
            for (let j = itemData.y; j < itemData.y + itemData.h; j++) {
                if (this.grid[i] &&
                    this.grid[i][j] &&
                    this.grid[i][j] !== item &&
                    !this.grid[i][j].dragAndDrop) {
                    return true;
                }
            }
        }
        return false;
    }
    checkItemAboveEmptyArea(item, newPosition) {
        let itemData = {
            x: newPosition.x,
            y: newPosition.y,
            w: item.w,
            h: item.h
        };
        if (!item.itemPrototype &&
            item.x === newPosition.x &&
            item.y === newPosition.y) {
            return true;
        }
        if (this.options.direction === 'horizontal') {
            itemData = {
                x: newPosition.y,
                y: newPosition.x,
                w: itemData.h,
                h: itemData.w
            };
        }
        return !this.checkItemsInArea(itemData.y, itemData.y + itemData.h - 1, itemData.x, itemData.x + itemData.w - 1, item);
    }
    fixItemsPositions(options) {
        // items with x, y that fits gird with size of options.lanes
        const validItems = this.items
            .filter((item) => item.itemComponent)
            .filter((item) => this.isItemValidForGrid(item, options));
        // items that x, y must be generated
        const invalidItems = this.items
            .filter((item) => item.itemComponent)
            .filter((item) => !this.isItemValidForGrid(item, options));
        const gridList = new GridList([], options);
        // put items with defined positions to the grid
        gridList.items = validItems.map((item) => {
            return item.copyForBreakpoint(options.breakpoint);
        });
        gridList.generateGrid();
        invalidItems.forEach(item => {
            // TODO: check if this change does not broke anything
            // const itemCopy = item.copy();
            const itemCopy = item.copyForBreakpoint(options.breakpoint);
            const position = gridList.findPositionForItem(itemCopy, {
                x: 0,
                y: 0
            });
            gridList.items.push(itemCopy);
            gridList.setItemPosition(itemCopy, position);
            gridList.markItemPositionToGrid(itemCopy);
        });
        gridList.pullItemsToLeft();
        gridList.pushCollidingItems();
        this.items.forEach((itm) => {
            const cachedItem = gridList.items.filter(cachedItm => {
                return cachedItm.$element === itm.$element;
            })[0];
            itm.setValueX(cachedItem.x, options.breakpoint);
            itm.setValueY(cachedItem.y, options.breakpoint);
            itm.setValueW(cachedItem.w, options.breakpoint);
            itm.setValueH(cachedItem.h, options.breakpoint);
            itm.autoSize = cachedItem.autoSize;
        });
    }
    deleteItemPositionFromGrid(item) {
        const position = this.getItemPosition(item);
        let x, y;
        for (x = position.x; x < position.x + position.w; x++) {
            // It can happen to try to remove an item from a position not generated
            // in the grid, probably when loading a persisted grid of items. No need
            // to create a column to be able to remove something from it, though
            if (!this.grid[x]) {
                continue;
            }
            for (y = position.y; y < position.y + position.h; y++) {
                // Don't clear the cell if it's been occupied by a different widget in
                // the meantime (e.g. when an item has been moved over this one, and
                // thus by continuing to clear this item's previous position you would
                // cancel the first item's move, leaving it without any position even)
                if (this.grid[x][y] === item) {
                    this.grid[x][y] = null;
                }
            }
        }
    }
    isItemFloating(item) {
        if (item.itemComponent && item.itemComponent.isDragging) {
            return false;
        }
        const position = this.getItemPosition(item);
        if (position.x === 0) {
            return false;
        }
        const rowBelowItem = this.grid[position.x - 1];
        return (rowBelowItem || [])
            .slice(position.y, position.y + position.h)
            .reduce((isFloating, cellItem) => {
            return isFloating && !cellItem;
        }, true);
    }
    isItemValidForGrid(item, options) {
        const itemData = options.direction === 'horizontal'
            ? {
                x: item.getValueY(options.breakpoint),
                y: item.getValueX(options.breakpoint),
                w: item.getValueH(options.breakpoint),
                h: Math.min(item.getValueW(this.options.breakpoint), options.lanes)
            }
            : {
                x: item.getValueX(options.breakpoint),
                y: item.getValueY(options.breakpoint),
                w: Math.min(item.getValueW(this.options.breakpoint), options.lanes),
                h: item.getValueH(options.breakpoint)
            };
        return (typeof itemData.x === 'number' &&
            typeof itemData.y === 'number' &&
            itemData.x + itemData.w <= options.lanes);
    }
    findDefaultPositionHorizontal(width, height) {
        for (const col of this.grid) {
            const colIdx = this.grid.indexOf(col);
            let rowIdx = 0;
            while (rowIdx < col.length - height + 1) {
                if (!this.checkItemsInArea(colIdx, colIdx + width - 1, rowIdx, rowIdx + height - 1)) {
                    return [colIdx, rowIdx];
                }
                rowIdx++;
            }
        }
        return [this.grid.length, 0];
    }
    findDefaultPositionVertical(width, height) {
        for (const row of this.grid) {
            const rowIdx = this.grid.indexOf(row);
            let colIdx = 0;
            while (colIdx < row.length - width + 1) {
                if (!this.checkItemsInArea(rowIdx, rowIdx + height - 1, colIdx, colIdx + width - 1)) {
                    return [colIdx, rowIdx];
                }
                colIdx++;
            }
        }
        return [0, this.grid.length];
    }
    checkItemsInArea(rowStart, rowEnd, colStart, colEnd, item) {
        for (let i = rowStart; i <= rowEnd; i++) {
            for (let j = colStart; j <= colEnd; j++) {
                if (this.grid[i] &&
                    this.grid[i][j] &&
                    (item ? this.grid[i][j] !== item : true)) {
                    return true;
                }
            }
        }
        return false;
    }
    sortItemsByPosition() {
        this.items.sort((item1, item2) => {
            const position1 = this.getItemPosition(item1), position2 = this.getItemPosition(item2);
            // Try to preserve columns.
            if (position1.x !== position2.x) {
                return position1.x - position2.x;
            }
            if (position1.y !== position2.y) {
                return position1.y - position2.y;
            }
            // The items are placed on the same position.
            return 0;
        });
    }
    /**
     * Some items can have 100% height or 100% width. Those dimmensions are
     * expressed as 0. We need to ensure a valid width and height for each of
     * those items as the number of items per lane.
     */
    adjustSizeOfItems() {
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            // This can happen only the first time items are checked.
            // We need the property to have a value for all the items so that the
            // `cloneItems` method will merge the properties properly. If we only set
            // it to the items that need it then the following can happen:
            //
            // cloneItems([{id: 1, autoSize: true}, {id: 2}],
            //            [{id: 2}, {id: 1, autoSize: true}]);
            //
            // will result in
            //
            // [{id: 1, autoSize: true}, {id: 2, autoSize: true}]
            if (item.autoSize === undefined) {
                item.autoSize = item.w === 0 || item.h === 0;
            }
            if (item.autoSize) {
                if (this.options.direction === 'horizontal') {
                    item.h = this.options.lanes;
                }
                else {
                    item.w = this.options.lanes;
                }
            }
        }
    }
    resetGrid() {
        this.grid = [];
    }
    /**
     * Check that an item wouldn't overlap with another one if placed at a
     * certain position within the grid
     */
    itemFitsAtPosition(item, newPosition) {
        const position = this.getItemPosition(item);
        let x, y;
        // No coordonate can be negative
        if (newPosition[0] < 0 || newPosition[1] < 0) {
            return false;
        }
        // Make sure the item isn't larger than the entire grid
        if (newPosition[1] + Math.min(position.h, this.options.lanes) >
            this.options.lanes) {
            return false;
        }
        if (this.isOverFixedArea(item.x, item.y, item.w, item.h)) {
            return false;
        }
        // Make sure the position doesn't overlap with an already positioned
        // item.
        for (x = newPosition[0]; x < newPosition[0] + position.w; x++) {
            const col = this.grid[x];
            // Surely a column that hasn't even been created yet is available
            if (!col) {
                continue;
            }
            for (y = newPosition[1]; y < newPosition[1] + position.h; y++) {
                // Any space occupied by an item can continue to be occupied by the
                // same item.
                if (col[y] && col[y] !== item) {
                    return false;
                }
            }
        }
        return true;
    }
    updateItemPosition(item, position) {
        if (item.x !== null && item.y !== null) {
            this.deleteItemPositionFromGrid(item);
        }
        this.setItemPosition(item, position);
        this.markItemPositionToGrid(item);
    }
    /**
     * @param Object item A reference to a grid item.
     * @param number width The new width.
     * @param number height The new height.
     */
    updateItemSize(item, width, height) {
        if (item.x !== null && item.y !== null) {
            this.deleteItemPositionFromGrid(item);
        }
        item.w = width;
        item.h = height;
        this.markItemPositionToGrid(item);
    }
    /**
     * Mark the grid cells that are occupied by an item. This prevents items
     * from overlapping in the grid
     */
    markItemPositionToGrid(item) {
        const position = this.getItemPosition(item);
        let x, y;
        // Ensure that the grid has enough columns to accomodate the current item.
        this.ensureColumns(position.x + position.w);
        for (x = position.x; x < position.x + position.w; x++) {
            for (y = position.y; y < position.y + position.h; y++) {
                this.grid[x][y] = item;
            }
        }
    }
    /**
     * Ensure that the grid has at least N columns available.
     */
    ensureColumns(N) {
        for (let i = 0; i < N; i++) {
            if (!this.grid[i]) {
                this.grid.push(new GridCol(this.options.lanes));
            }
        }
    }
    getItemsCollidingWithItem(item) {
        const collidingItems = [];
        for (let i = 0; i < this.items.length; i++) {
            if (item !== this.items[i] &&
                this.itemsAreColliding(item, this.items[i])) {
                collidingItems.push(i);
            }
        }
        return collidingItems;
    }
    itemsAreColliding(item1, item2) {
        const position1 = this.getItemPosition(item1), position2 = this.getItemPosition(item2);
        return !(position2.x >= position1.x + position1.w ||
            position2.x + position2.w <= position1.x ||
            position2.y >= position1.y + position1.h ||
            position2.y + position2.h <= position1.y);
    }
    /**
     * Attempt to resolve the collisions after moving an item over one or more
     * other items within the grid, by shifting the position of the colliding
     * items around the moving one. This might result in subsequent collisions,
     * in which case we will revert all position permutations. To be able to
     * revert to the initial item positions, we create a virtual grid in the
     * process
     */
    tryToResolveCollisionsLocally(item) {
        const collidingItems = this.getItemsCollidingWithItem(item);
        if (!collidingItems.length) {
            return true;
        }
        const _gridList = new GridList(this.items.map(itm => {
            return itm.copy();
        }), this.options);
        let leftOfItem;
        let rightOfItem;
        let aboveOfItem;
        let belowOfItem;
        for (let i = 0; i < collidingItems.length; i++) {
            const collidingItem = _gridList.items[collidingItems[i]], collidingPosition = this.getItemPosition(collidingItem);
            // We use a simple algorithm for moving items around when collisions occur:
            // In this prioritized order, we try to move a colliding item around the
            // moving one:
            // 1. to its left side
            // 2. above it
            // 3. under it
            // 4. to its right side
            const position = this.getItemPosition(item);
            leftOfItem = [
                position.x - collidingPosition.w,
                collidingPosition.y
            ];
            rightOfItem = [position.x + position.w, collidingPosition.y];
            aboveOfItem = [
                collidingPosition.x,
                position.y - collidingPosition.h
            ];
            belowOfItem = [collidingPosition.x, position.y + position.h];
            if (_gridList.itemFitsAtPosition(collidingItem, leftOfItem)) {
                _gridList.updateItemPosition(collidingItem, leftOfItem);
            }
            else if (_gridList.itemFitsAtPosition(collidingItem, aboveOfItem)) {
                _gridList.updateItemPosition(collidingItem, aboveOfItem);
            }
            else if (_gridList.itemFitsAtPosition(collidingItem, belowOfItem)) {
                _gridList.updateItemPosition(collidingItem, belowOfItem);
            }
            else if (_gridList.itemFitsAtPosition(collidingItem, rightOfItem)) {
                _gridList.updateItemPosition(collidingItem, rightOfItem);
            }
            else {
                // Collisions failed, we must use the pullItemsToLeft method to arrange
                // the other items around this item with fixed position. This is our
                // plan B for when local collision resolving fails.
                return false;
            }
        }
        // If we reached this point it means we managed to resolve the collisions
        // from one single iteration, just by moving the colliding items around. So
        // we accept this scenario and merge the branched-out grid instance into the
        // original one
        this.items.forEach((itm, idx) => {
            const cachedItem = _gridList.items.filter(cachedItm => {
                return cachedItm.$element === itm.$element;
            })[0];
            itm.x = cachedItem.x;
            itm.y = cachedItem.y;
            itm.w = cachedItem.w;
            itm.h = cachedItem.h;
            itm.autoSize = cachedItem.autoSize;
        });
        this.generateGrid();
        return true;
    }
    /**
     * When pulling items to the left, we need to find the leftmost position for
     * an item, with two considerations in mind:
     * - preserving its current row
     * - preserving the previous horizontal order between items
     */
    findLeftMostPositionForItem(item) {
        let tail = 0;
        const position = this.getItemPosition(item);
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = position.y; j < position.y + position.h; j++) {
                const otherItem = this.grid[i][j];
                if (!otherItem) {
                    continue;
                }
                const otherPosition = this.getItemPosition(otherItem);
                if (this.items.indexOf(otherItem) < this.items.indexOf(item)) {
                    tail = otherPosition.x + otherPosition.w;
                }
            }
        }
        return tail;
    }
    findItemByPosition(x, y) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i].x === x && this.items[i].y === y) {
                return this.items[i];
            }
        }
    }
    getItemByAttribute(key, value) {
        for (let i = 0; i < this.items.length; i++) {
            if (this.items[i][key] === value) {
                return this.items[i];
            }
        }
        return null;
    }
    padNumber(nr, prefix) {
        // Currently works for 2-digit numbers (<100)
        return nr >= 10 ? nr : prefix + nr;
    }
    /**
     * If the direction is vertical we need to rotate the grid 90 deg to the
     * left. Thus, we simulate the fact that items are being pulled to the top.
     *
     * Since the items have widths and heights, if we apply the classic
     * counter-clockwise 90 deg rotation
     *
     *     [0 -1]
     *     [1  0]
     *
     * then the top left point of an item will become the bottom left point of
     * the rotated item. To adjust for this, we need to subtract from the y
     * position the height of the original item - the width of the rotated item.
     *
     * However, if we do this then we'll reverse some actions: resizing the
     * width of an item will stretch the item to the left instead of to the
     * right; resizing an item that doesn't fit into the grid will push the
     * items around it instead of going on a new row, etc.
     *
     * We found it better to do a vertical flip of the grid after rotating it.
     * This restores the direction of the actions and greatly simplifies the
     * transformations.
     */
    getItemPosition(item) {
        if (this.options.direction === 'horizontal') {
            return item;
        }
        else {
            return {
                x: item.y,
                y: item.x,
                w: item.h,
                h: item.w
            };
        }
    }
    /**
     * See getItemPosition.
     */
    setItemPosition(item, position) {
        if (this.options.direction === 'horizontal') {
            item.x = position[0];
            item.y = position[1];
        }
        else {
            // We're supposed to subtract the rotated item's height which is actually
            // the non-rotated item's width.
            item.x = position[1];
            item.y = position[0];
        }
    }
}

class GridsterService {
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
GridsterService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
GridsterService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });

class GridsterOptions {
    constructor(config, gridsterElement) {
        this.defaults = {
            lanes: 5,
            direction: 'horizontal',
            widthHeightRatio: 1,
            shrink: false,
            responsiveView: true,
            responsiveSizes: false,
            responsiveToParent: false,
            dragAndDrop: true,
            resizable: false,
            useCSSTransforms: false,
            floating: true,
            tolerance: 'pointer'
        };
        this.responsiveOptions = [];
        this.breakpointsMap = {
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200 // Extra large
        };
        const responsiveContainer = config.responsiveToParent ? gridsterElement : window;
        this.basicOptions = config;
        this.responsiveOptions = this.extendResponsiveOptions(config.responsiveOptions || []);
        this.change = merge(of(this.getOptionsByWidth(this.getElementWidth(responsiveContainer))), fromEvent(window, 'resize').pipe(debounceTime(config.responsiveDebounce || 0), map((event) => this.getOptionsByWidth(this.getElementWidth(responsiveContainer))))).pipe(distinctUntilChanged(null, (options) => options.minWidth));
    }
    getOptionsByWidth(width) {
        let i = 0;
        let options = Object.assign({}, this.defaults, this.basicOptions);
        while (this.responsiveOptions[i]) {
            if (this.responsiveOptions[i].minWidth <= width) {
                options = this.responsiveOptions[i];
            }
            i++;
        }
        return options;
    }
    extendResponsiveOptions(responsiveOptions) {
        return responsiveOptions
            // responsive options are valid only with "breakpoint" property
            .filter(options => options.breakpoint)
            // set default minWidth if not given
            .map((options) => {
            return Object.assign({
                minWidth: this.breakpointsMap[options.breakpoint] || 0
            }, options);
        })
            .sort((curr, next) => curr.minWidth - next.minWidth)
            .map((options) => Object.assign({}, this.defaults, this.basicOptions, options));
    }
    getElementWidth($element) {
        if ($element === window) {
            return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        }
        return $element.clientWidth;
    }
}

class GridsterPrototypeService {
    constructor() {
        this.isDragging = false;
        this.dragSubject = new Subject();
        this.dragStartSubject = new Subject();
        this.dragStopSubject = new Subject();
    }
    observeDropOver(gridster) {
        return this.dragStopSubject.pipe(filter((data) => {
            const gridsterEl = gridster.gridsterComponent.$element;
            const isOverNestedGridster = [].slice.call(gridsterEl.querySelectorAll('gridster'))
                .reduce((isOverGridster, nestedGridsterEl) => {
                return isOverGridster ||
                    this.isOverGridster(data.item, nestedGridsterEl, data.event, gridster.options);
            }, false);
            if (isOverNestedGridster) {
                return false;
            }
            return this.isOverGridster(data.item, gridsterEl, data.event, gridster.options);
        }), tap((data) => {
            // TODO: what we should provide as a param?
            // prototype.drop.emit({item: prototype.item});
            data.item.onDrop(gridster);
        }));
    }
    observeDropOut(gridster) {
        return this.dragStopSubject.pipe(filter((data) => {
            const gridsterEl = gridster.gridsterComponent.$element;
            return !this.isOverGridster(data.item, gridsterEl, data.event, gridster.options);
        }), tap((data) => {
            // TODO: what we should provide as a param?
            data.item.onCancel();
        }));
    }
    observeDragOver(gridster) {
        const over = this.dragSubject.pipe(map((data) => {
            const gridsterEl = gridster.gridsterComponent.$element;
            return {
                item: data.item,
                event: data.event,
                isOver: this.isOverGridster(data.item, gridsterEl, data.event, gridster.options),
                isDrop: false
            };
        }));
        const drop = this.dragStopSubject.pipe(map((data) => {
            const gridsterEl = gridster.gridsterComponent.$element;
            return {
                item: data.item,
                event: data.event,
                isOver: this.isOverGridster(data.item, gridsterEl, data.event, gridster.options),
                isDrop: true
            };
        }));
        const dragExt = merge(
        // dragStartSubject is connected in case when item prototype is placed above gridster
        // and drag enter is not fired
        this.dragStartSubject.pipe(map(() => ({ item: null, isOver: false, isDrop: false }))), over, drop).pipe(scan((prev, next) => {
            return {
                item: next.item,
                event: next.event,
                isOver: next.isOver,
                isEnter: prev.isOver === false && next.isOver === true,
                isOut: prev.isOver === true && next.isOver === false && !prev.isDrop,
                isDrop: next.isDrop
            };
        }), filter((data) => {
            return !data.isDrop;
        }), share());
        const dragEnter = this.createDragEnterObservable(dragExt, gridster);
        const dragOut = this.createDragOutObservable(dragExt, gridster);
        const dragOver = dragEnter
            .pipe(switchMap(() => this.dragSubject.pipe(takeUntil(dragOut))), map((data) => data.item));
        return { dragEnter, dragOut, dragOver };
    }
    dragItemStart(item, event) {
        this.isDragging = true;
        this.dragStartSubject.next({ item, event });
    }
    dragItemStop(item, event) {
        this.isDragging = false;
        this.dragStopSubject.next({ item, event });
    }
    updatePrototypePosition(item, event) {
        this.dragSubject.next({ item, event });
    }
    /**
     * Creates observable that is fired on dragging over gridster container.
     */
    createDragOverObservable(dragIsOver, gridster) {
        return dragIsOver.pipe(filter((data) => data.isOver && !data.isEnter && !data.isOut), map((data) => data.item), tap((item) => item.onOver(gridster)));
    }
    /**
     * Creates observable that is fired on drag enter gridster container.
     */
    createDragEnterObservable(dragIsOver, gridster) {
        return dragIsOver.pipe(filter((data) => data.isEnter), map((data) => data.item), tap((item) => item.onEnter(gridster)));
    }
    /**
     * Creates observable that is fired on drag out gridster container.
     */
    createDragOutObservable(dragIsOver, gridster) {
        return dragIsOver.pipe(filter((data) => data.isOut), map((data) => data.item), tap((item) => item.onOut(gridster)));
    }
    /**
     * Checks whether "element" position fits inside "containerEl" position.
     * It checks if "element" is totally covered by "containerEl" area.
     */
    isOverGridster(item, gridsterEl, event, options) {
        const el = item.$element;
        const parentItem = gridsterEl.parentElement &&
            gridsterEl.parentElement.closest('gridster-item');
        if (parentItem) {
            return this.isOverGridster(item, parentItem, event, options);
        }
        switch (options.tolerance) {
            case 'fit':
                return utils.isElementFitContainer(el, gridsterEl);
            case 'intersect':
                return utils.isElementIntersectContainer(el, gridsterEl);
            case 'touch':
                return utils.isElementTouchContainer(el, gridsterEl);
            default:
                return utils.isCursorAboveElement(event, gridsterEl);
        }
    }
}
GridsterPrototypeService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterPrototypeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
GridsterPrototypeService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterPrototypeService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterPrototypeService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });

class GridsterComponent {
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
GridsterComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterComponent, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: GridsterService }, { token: GridsterPrototypeService }], target: i0.ɵɵFactoryTarget.Component });
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
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: GridsterService }, { type: GridsterPrototypeService }]; }, propDecorators: { options: [{
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

class GridListItem {
    get $element() {
        return this.getItem().$element;
    }
    get x() {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        return this.getValueX(breakpoint);
    }
    set x(value) {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        this.setValueX(value, breakpoint);
    }
    get y() {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        return this.getValueY(breakpoint);
    }
    set y(value) {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        this.setValueY(value, breakpoint);
    }
    get w() {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        return this.getValueW(breakpoint);
    }
    set w(value) {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        this.setValueW(value, breakpoint);
    }
    get h() {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        return this.getValueH(breakpoint);
    }
    set h(value) {
        const item = this.getItem();
        const breakpoint = item.gridster ? item.gridster.options.breakpoint : null;
        this.setValueH(value, breakpoint);
    }
    get autoSize() {
        return this.getItem().autoSize;
    }
    set autoSize(value) {
        this.getItem().autoSize = value;
    }
    get dragAndDrop() {
        return !!this.getItem().dragAndDrop;
    }
    get resizable() {
        return !!this.getItem().resizable;
    }
    get positionX() {
        const item = this.itemComponent || this.itemPrototype;
        if (!item) {
            return null;
        }
        return item.positionX;
    }
    get positionY() {
        const item = this.itemComponent || this.itemPrototype;
        if (!item) {
            return null;
        }
        return item.positionY;
    }
    setFromGridsterItem(item) {
        if (this.isItemSet()) {
            throw new Error('GridListItem is already set.');
        }
        this.itemComponent = item;
        return this;
    }
    setFromGridsterItemPrototype(item) {
        if (this.isItemSet()) {
            throw new Error('GridListItem is already set.');
        }
        this.itemPrototype = item;
        return this;
    }
    setFromObjectLiteral(item) {
        if (this.isItemSet()) {
            throw new Error('GridListItem is already set.');
        }
        this.itemObject = item;
        return this;
    }
    copy() {
        const itemCopy = new GridListItem();
        return itemCopy.setFromObjectLiteral({
            $element: this.$element,
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            autoSize: this.autoSize,
            dragAndDrop: this.dragAndDrop,
            resizable: this.resizable
        });
    }
    copyForBreakpoint(breakpoint) {
        const itemCopy = new GridListItem();
        return itemCopy.setFromObjectLiteral({
            $element: this.$element,
            x: this.getValueX(breakpoint),
            y: this.getValueY(breakpoint),
            w: this.getValueW(breakpoint),
            h: this.getValueH(breakpoint),
            autoSize: this.autoSize,
            dragAndDrop: this.dragAndDrop,
            resizable: this.resizable
        });
    }
    getValueX(breakpoint) {
        const item = this.getItem();
        return item[this.getXProperty(breakpoint)];
    }
    getValueY(breakpoint) {
        const item = this.getItem();
        return item[this.getYProperty(breakpoint)];
    }
    getValueW(breakpoint) {
        const item = this.getItem();
        return item[this.getWProperty(breakpoint)] || 1;
    }
    getValueH(breakpoint) {
        const item = this.getItem();
        return item[this.getHProperty(breakpoint)] || 1;
    }
    setValueX(value, breakpoint) {
        const item = this.getItem();
        item[this.getXProperty(breakpoint)] = value;
    }
    setValueY(value, breakpoint) {
        const item = this.getItem();
        item[this.getYProperty(breakpoint)] = value;
    }
    setValueW(value, breakpoint) {
        const item = this.getItem();
        item[this.getWProperty(breakpoint)] = value;
    }
    setValueH(value, breakpoint) {
        const item = this.getItem();
        item[this.getHProperty(breakpoint)] = value;
    }
    triggerChangeX(breakpoint) {
        const item = this.itemComponent;
        if (item) {
            item[this.getXProperty(breakpoint) + 'Change'].emit(this.getValueX(breakpoint));
        }
    }
    triggerChangeY(breakpoint) {
        const item = this.itemComponent;
        if (item) {
            item[this.getYProperty(breakpoint) + 'Change'].emit(this.getValueY(breakpoint));
        }
    }
    triggerChangeW(breakpoint) {
        const item = this.itemComponent;
        if (item) {
            item[this.getWProperty(breakpoint) + 'Change'].emit(this.getValueW(breakpoint));
        }
    }
    triggerChangeH(breakpoint) {
        const item = this.itemComponent;
        if (item) {
            item[this.getHProperty(breakpoint) + 'Change'].emit(this.getValueH(breakpoint));
        }
    }
    hasPositions(breakpoint) {
        const x = this.getValueX(breakpoint);
        const y = this.getValueY(breakpoint);
        return (x || x === 0) && (y || y === 0);
    }
    applyPosition(gridster) {
        const position = this.calculatePosition(gridster);
        this.itemComponent.positionX = position.left;
        this.itemComponent.positionY = position.top;
        this.itemComponent.updateElemenetPosition();
    }
    calculatePosition(gridster) {
        if (!gridster && !this.itemComponent) {
            return { left: 0, top: 0 };
        }
        gridster = gridster || this.itemComponent.gridster;
        return {
            left: this.x * gridster.cellWidth,
            top: this.y * gridster.cellHeight
        };
    }
    applySize(gridster) {
        const size = this.calculateSize(gridster);
        this.$element.style.width = size.width + 'px';
        this.$element.style.height = size.height + 'px';
    }
    calculateSize(gridster) {
        if (!gridster && !this.itemComponent) {
            return { width: 0, height: 0 };
        }
        gridster = gridster || this.itemComponent.gridster;
        let width = this.getValueW(gridster.options.breakpoint);
        let height = this.getValueH(gridster.options.breakpoint);
        if (gridster.options.direction === 'vertical') {
            width = Math.min(width, gridster.options.lanes);
        }
        if (gridster.options.direction === 'horizontal') {
            height = Math.min(height, gridster.options.lanes);
        }
        return {
            width: width * gridster.cellWidth,
            height: height * gridster.cellHeight
        };
    }
    getXProperty(breakpoint) {
        if (breakpoint && this.itemComponent) {
            return GridListItem.X_PROPERTY_MAP[breakpoint];
        }
        else {
            return 'x';
        }
    }
    getYProperty(breakpoint) {
        if (breakpoint && this.itemComponent) {
            return GridListItem.Y_PROPERTY_MAP[breakpoint];
        }
        else {
            return 'y';
        }
    }
    getWProperty(breakpoint) {
        if (this.itemPrototype) {
            return this.itemPrototype[GridListItem.W_PROPERTY_MAP[breakpoint]] ?
                GridListItem.W_PROPERTY_MAP[breakpoint] : 'w';
        }
        const item = this.getItem();
        const responsiveSizes = item.gridster && item.gridster.options.responsiveSizes;
        if (breakpoint && responsiveSizes) {
            return GridListItem.W_PROPERTY_MAP[breakpoint];
        }
        else {
            return 'w';
        }
    }
    getHProperty(breakpoint) {
        if (this.itemPrototype) {
            return this.itemPrototype[GridListItem.H_PROPERTY_MAP[breakpoint]] ?
                GridListItem.H_PROPERTY_MAP[breakpoint] : 'h';
        }
        const item = this.getItem();
        const responsiveSizes = item.gridster && item.gridster.options.responsiveSizes;
        if (breakpoint && responsiveSizes) {
            return GridListItem.H_PROPERTY_MAP[breakpoint];
        }
        else {
            return 'h';
        }
    }
    getItem() {
        const item = this.itemComponent || this.itemPrototype || this.itemObject;
        if (!item) {
            throw new Error('GridListItem is not set.');
        }
        return item;
    }
    isItemSet() {
        return this.itemComponent || this.itemPrototype || this.itemObject;
    }
}
GridListItem.BREAKPOINTS = ['sm', 'md', 'lg', 'xl'];
GridListItem.X_PROPERTY_MAP = {
    sm: 'xSm',
    md: 'xMd',
    lg: 'xLg',
    xl: 'xXl'
};
GridListItem.Y_PROPERTY_MAP = {
    sm: 'ySm',
    md: 'yMd',
    lg: 'yLg',
    xl: 'yXl'
};
GridListItem.W_PROPERTY_MAP = {
    sm: 'wSm',
    md: 'wMd',
    lg: 'wLg',
    xl: 'wXl'
};
GridListItem.H_PROPERTY_MAP = {
    sm: 'hSm',
    md: 'hMd',
    lg: 'hLg',
    xl: 'hXl'
};

class DraggableEvent {
    constructor(event) {
        if (event.touches) {
            this.touchEvent = event;
            this.setDataFromTouchEvent(this.touchEvent);
        }
        else {
            this.mouseEvent = event;
            this.setDataFromMouseEvent(this.mouseEvent);
        }
    }
    isTouchEvent() {
        return !!this.touchEvent;
    }
    pauseEvent() {
        const event = this.touchEvent || this.mouseEvent;
        if (event.stopPropagation) {
            event.stopPropagation();
        }
        if (event.preventDefault) {
            event.preventDefault();
        }
        event.cancelBubble = true;
        event.returnValue = false;
        return false;
    }
    getRelativeCoordinates(container) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
        const rect = container.getBoundingClientRect();
        return {
            x: this.pageX - rect.left - scrollLeft,
            y: this.pageY - rect.top - scrollTop,
        };
    }
    setDataFromMouseEvent(event) {
        this.target = event.target;
        this.clientX = event.clientX;
        this.clientY = event.clientY;
        this.pageX = event.pageX;
        this.pageY = event.pageY;
        this.type = event.type;
    }
    setDataFromTouchEvent(event) {
        const touch = event.touches[0] || event.changedTouches[0];
        this.target = event.target;
        this.clientX = touch.clientX;
        this.clientY = touch.clientY;
        this.pageX = touch.pageX;
        this.pageY = touch.pageY;
        this.type = event.type;
    }
}

class Draggable {
    constructor(element, config = {}) {
        this.mousemove = merge(fromEvent(document, 'mousemove'), fromEvent(document, 'touchmove', { passive: false })).pipe(share());
        this.mouseup = merge(fromEvent(document, 'mouseup'), fromEvent(document, 'touchend'), fromEvent(document, 'touchcancel')).pipe(share());
        this.config = {
            handlerClass: null,
            scroll: true,
            scrollEdge: 36,
            scrollDirection: null
        };
        // reference to auto scrolling listeners
        this.autoScrollingInterval = [];
        this.element = element;
        this.mousedown = merge(fromEvent(element, 'mousedown'), fromEvent(element, 'touchstart')).pipe(share());
        this.config = Object.assign(Object.assign({}, this.config), config);
        this.dragStart = this.createDragStartObservable().pipe(share());
        this.dragMove = this.createDragMoveObservable(this.dragStart);
        this.dragStop = this.createDragStopObservable(this.dragStart);
        this.fixProblemWithDnDForIE(element);
        this.requestAnimationFrame =
            window.requestAnimationFrame || (callback => setTimeout(callback, 1000 / 60));
        this.cancelAnimationFrame = window.cancelAnimationFrame || (cafID => clearTimeout(cafID));
    }
    createDragStartObservable() {
        return this.mousedown.pipe(map(md => new DraggableEvent(md)), filter((event) => this.isDragingByHandler(event)), tap(e => {
            if (!e.isTouchEvent()) {
                e.pauseEvent();
            }
            if (document.activeElement) {
                document.activeElement.blur();
            }
            // prevents rendering performance issues while dragging item with selection inside
            utils.clearSelection();
        }), switchMap((startEvent) => {
            return this.mousemove.pipe(map(mm => new DraggableEvent(mm)), filter((moveEvent) => this.inRange(startEvent, moveEvent, 5)), map(() => startEvent), takeUntil(this.mouseup), take(1));
        }));
    }
    createDragMoveObservable(dragStart) {
        return dragStart.pipe(tap(event => {
            this.addTouchActionNone(event.target);
        }), switchMap(startEvent => {
            return this.mousemove.pipe(skip(1), map(mm => new DraggableEvent(mm)), tap(event => {
                event.pauseEvent();
                startEvent.pauseEvent();
            }), takeUntil(this.mouseup));
        }), filter(val => !!val), tap((event) => {
            if (this.config.scroll) {
                this.startScroll(this.element, event);
            }
        }));
    }
    createDragStopObservable(dragStart) {
        return dragStart.pipe(switchMap(() => {
            return this.mouseup.pipe(take(1));
        }), map(e => new DraggableEvent(e)), tap(e => {
            if (e.target) {
                this.removeTouchActionNone(e.target);
            }
            this.autoScrollingInterval.forEach(raf => this.cancelAnimationFrame(raf));
        }));
    }
    startScroll(item, event) {
        const scrollContainer = this.getScrollContainer(item);
        this.autoScrollingInterval.forEach(raf => this.cancelAnimationFrame(raf));
        if (scrollContainer) {
            this.startScrollForContainer(event, scrollContainer);
        }
        else {
            this.startScrollForWindow(event);
        }
    }
    startScrollForContainer(event, scrollContainer) {
        if (!this.config.scrollDirection || this.config.scrollDirection === 'vertical') {
            this.startScrollVerticallyForContainer(event, scrollContainer);
        }
        if (!this.config.scrollDirection || this.config.scrollDirection === 'horizontal') {
            this.startScrollHorizontallyForContainer(event, scrollContainer);
        }
    }
    startScrollVerticallyForContainer(event, scrollContainer) {
        if (event.pageY - this.getOffset(scrollContainer).top < this.config.scrollEdge) {
            this.startAutoScrolling(scrollContainer, -Draggable.SCROLL_SPEED, 'scrollTop');
        }
        else if (this.getOffset(scrollContainer).top +
            scrollContainer.getBoundingClientRect().height -
            event.pageY <
            this.config.scrollEdge) {
            this.startAutoScrolling(scrollContainer, Draggable.SCROLL_SPEED, 'scrollTop');
        }
    }
    startScrollHorizontallyForContainer(event, scrollContainer) {
        if (event.pageX - scrollContainer.getBoundingClientRect().left < this.config.scrollEdge) {
            this.startAutoScrolling(scrollContainer, -Draggable.SCROLL_SPEED, 'scrollLeft');
        }
        else if (this.getOffset(scrollContainer).left +
            scrollContainer.getBoundingClientRect().width -
            event.pageX <
            this.config.scrollEdge) {
            this.startAutoScrolling(scrollContainer, Draggable.SCROLL_SPEED, 'scrollLeft');
        }
    }
    startScrollForWindow(event) {
        if (!this.config.scrollDirection || this.config.scrollDirection === 'vertical') {
            this.startScrollVerticallyForWindow(event);
        }
        if (!this.config.scrollDirection || this.config.scrollDirection === 'horizontal') {
            this.startScrollHorizontallyForWindow(event);
        }
    }
    startScrollVerticallyForWindow(event) {
        const scrollingElement = document.scrollingElement || document.documentElement || document.body;
        // NOTE: Using `window.pageYOffset` here because IE doesn't have `window.scrollY`.
        if (event.pageY - window.pageYOffset < this.config.scrollEdge) {
            this.startAutoScrolling(scrollingElement, -Draggable.SCROLL_SPEED, 'scrollTop');
        }
        else if (window.innerHeight - (event.pageY - window.pageYOffset) <
            this.config.scrollEdge) {
            this.startAutoScrolling(scrollingElement, Draggable.SCROLL_SPEED, 'scrollTop');
        }
    }
    startScrollHorizontallyForWindow(event) {
        const scrollingElement = document.scrollingElement || document.documentElement || document.body;
        // NOTE: Using `window.pageXOffset` here because IE doesn't have `window.scrollX`.
        if (event.pageX - window.pageXOffset < this.config.scrollEdge) {
            this.startAutoScrolling(scrollingElement, -Draggable.SCROLL_SPEED, 'scrollLeft');
        }
        else if (window.innerWidth - (event.pageX - window.pageXOffset) <
            this.config.scrollEdge) {
            this.startAutoScrolling(scrollingElement, Draggable.SCROLL_SPEED, 'scrollLeft');
        }
    }
    getScrollContainer(node) {
        const nodeOuterHeight = utils.getElementOuterHeight(node);
        if (node.scrollHeight > Math.ceil(nodeOuterHeight)) {
            return node;
        }
        if (!new RegExp('(body|html)', 'i').test(node.parentNode.tagName)) {
            return this.getScrollContainer(node.parentNode);
        }
        return null;
    }
    startAutoScrolling(node, amount, direction) {
        this.autoScrollingInterval.push(this.requestAnimationFrame(function () {
            this.startAutoScrolling(node, amount, direction);
        }.bind(this)));
        return (node[direction] += amount * 0.25);
    }
    getOffset(el) {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left + this.getScroll('scrollLeft', 'pageXOffset'),
            top: rect.top + this.getScroll('scrollTop', 'pageYOffset')
        };
    }
    getScroll(scrollProp, offsetProp) {
        if (typeof window[offsetProp] !== 'undefined') {
            return window[offsetProp];
        }
        if (document.documentElement.clientHeight) {
            return document.documentElement[scrollProp];
        }
        return document.body[scrollProp];
    }
    isDragingByHandler(event) {
        if (!this.isValidDragHandler(event.target)) {
            return false;
        }
        return (!this.config.handlerClass ||
            (this.config.handlerClass &&
                this.hasElementWithClass(this.config.handlerClass, event.target)));
    }
    isValidDragHandler(targetEl) {
        return ['input', 'textarea'].indexOf(targetEl.tagName.toLowerCase()) === -1;
    }
    inRange(startEvent, moveEvent, range) {
        return (Math.abs(moveEvent.clientX - startEvent.clientX) > range ||
            Math.abs(moveEvent.clientY - startEvent.clientY) > range);
    }
    hasElementWithClass(className, target) {
        while (target !== this.element) {
            if (target.classList.contains(className)) {
                return true;
            }
            target = target.parentElement;
        }
        return false;
    }
    pauseEvent(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.cancelBubble = true;
        e.returnValue = false;
    }
    fixProblemWithDnDForIE(element) {
        if (this.isTouchDevice() && this.isIEorEdge() && element.style) {
            element.style['touch-action'] = 'none';
        }
    }
    removeTouchActionNone(element) {
        if (!element.style) {
            return;
        }
        element.style['touch-action'] = '';
    }
    addTouchActionNone(element) {
        if (!element.style) {
            return;
        }
        element.style['touch-action'] = 'none';
    }
    isTouchDevice() {
        return ('ontouchstart' in window || navigator.maxTouchPoints // works on most browsers
        ); // works on IE10/11 and Surface
    }
    isIEorEdge() {
        const ua = window.navigator.userAgent;
        const msie = ua.indexOf('MSIE ');
        if (msie > 0) {
            // IE 10 or older => return version number
            return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
        }
        const trident = ua.indexOf('Trident/');
        if (trident > 0) {
            // IE 11 => return version number
            const rv = ua.indexOf('rv:');
            return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
        }
        const edge = ua.indexOf('Edge/');
        if (edge > 0) {
            // Edge (IE 12+) => return version number
            return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
        }
        // other browser
        return false;
    }
}
Draggable.SCROLL_SPEED = 20;

class GridsterItemComponent {
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
        return Object.assign({ scrollDirection: this.gridster.options.direction }, this.gridster.draggableOptions);
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
GridsterItemComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterItemComponent, deps: [{ token: i0.NgZone }, { token: GridsterPrototypeService }, { token: ElementRef }, { token: GridsterService }], target: i0.ɵɵFactoryTarget.Component });
GridsterItemComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.7", type: GridsterItemComponent, selector: "ngx-gridster-item", inputs: { x: "x", y: "y", xSm: "xSm", ySm: "ySm", xMd: "xMd", yMd: "yMd", xLg: "xLg", yLg: "yLg", xXl: "xXl", yXl: "yXl", w: "w", h: "h", wSm: "wSm", hSm: "hSm", wMd: "wMd", hMd: "hMd", wLg: "wLg", hLg: "hLg", wXl: "wXl", hXl: "hXl", dragAndDrop: "dragAndDrop", resizable: "resizable", options: "options" }, outputs: { xChange: "xChange", yChange: "yChange", xSmChange: "xSmChange", ySmChange: "ySmChange", xMdChange: "xMdChange", yMdChange: "yMdChange", xLgChange: "xLgChange", yLgChange: "yLgChange", xXlChange: "xXlChange", yXlChange: "yXlChange", wChange: "wChange", hChange: "hChange", wSmChange: "wSmChange", hSmChange: "hSmChange", wMdChange: "wMdChange", hMdChange: "hMdChange", wLgChange: "wLgChange", hLgChange: "hLgChange", wXlChange: "wXlChange", hXlChange: "hXlChange", change: "change", start: "start", end: "end" }, host: { properties: { "class.is-dragging": "this.isDragging", "class.is-resizing": "this.isResizing" } }, usesOnChanges: true, ngImport: i0, template: `<div class="gridster-item-inner">
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
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterItemComponent, decorators: [{
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
        }], ctorParameters: function () {
        return [{ type: i0.NgZone }, { type: GridsterPrototypeService }, { type: i0.ElementRef, decorators: [{
                        type: Inject,
                        args: [ElementRef]
                    }] }, { type: GridsterService, decorators: [{
                        type: Inject,
                        args: [GridsterService]
                    }] }];
    }, propDecorators: { x: [{
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

class GridsterItemPrototypeDirective {
    constructor(zone, elementRef, gridsterPrototype) {
        this.zone = zone;
        this.elementRef = elementRef;
        this.gridsterPrototype = gridsterPrototype;
        this.drop = new EventEmitter();
        this.start = new EventEmitter();
        this.cancel = new EventEmitter();
        this.enter = new EventEmitter();
        this.out = new EventEmitter();
        this.config = {};
        this.x = 0;
        this.y = 0;
        this.autoSize = false;
        this.isDragging = false;
        this.subscribtions = [];
        this.item = (new GridListItem()).setFromGridsterItemPrototype(this);
    }
    // must be set to true because of item dragAndDrop configuration
    get dragAndDrop() {
        return true;
    }
    get gridster() {
        return this.dragContextGridster;
    }
    ngOnInit() {
        this.wSm = this.wSm || this.w;
        this.hSm = this.hSm || this.h;
        this.wMd = this.wMd || this.w;
        this.hMd = this.hMd || this.h;
        this.wLg = this.wLg || this.w;
        this.hLg = this.hLg || this.h;
        this.wXl = this.wXl || this.w;
        this.hXl = this.hXl || this.h;
        this.zone.runOutsideAngular(() => {
            this.enableDragDrop();
        });
    }
    ngOnDestroy() {
        this.subscribtions.forEach((sub) => {
            sub.unsubscribe();
        });
    }
    onDrop(gridster) {
        if (!this.config.helper) {
            this.$element.parentNode.removeChild(this.$element);
        }
        this.drop.emit({
            item: this.item,
            gridster: gridster
        });
    }
    onCancel() {
        this.cancel.emit({ item: this.item });
    }
    onEnter(gridster) {
        this.enter.emit({
            item: this.item,
            gridster: gridster
        });
    }
    onOver(gridster) { }
    onOut(gridster) {
        this.out.emit({
            item: this.item,
            gridster: gridster
        });
    }
    getPositionToGridster(gridster) {
        const relativeContainerCoords = this.getContainerCoordsToGridster(gridster);
        return {
            y: this.positionY - relativeContainerCoords.top,
            x: this.positionX - relativeContainerCoords.left
        };
    }
    setDragContextGridster(gridster) {
        this.dragContextGridster = gridster;
    }
    getContainerCoordsToGridster(gridster) {
        return {
            left: gridster.gridsterRect.left - this.parentRect.left,
            top: gridster.gridsterRect.top - this.parentRect.top
        };
    }
    enableDragDrop() {
        let cursorToElementPosition;
        const draggable = new Draggable(this.elementRef.nativeElement);
        const dragStartSub = draggable.dragStart
            .subscribe((event) => {
            this.zone.run(() => {
                this.$element = this.provideDragElement();
                this.containerRectange = this.$element.parentElement.getBoundingClientRect();
                this.updateParentElementData();
                this.onStart(event);
                cursorToElementPosition = event.getRelativeCoordinates(this.$element);
            });
        });
        const dragSub = draggable.dragMove
            .subscribe((event) => {
            this.setElementPosition(this.$element, {
                x: event.clientX - cursorToElementPosition.x - this.parentRect.left,
                y: event.clientY - cursorToElementPosition.y - this.parentRect.top
            });
            this.onDrag(event);
        });
        const dragStopSub = draggable.dragStop
            .subscribe((event) => {
            this.zone.run(() => {
                this.onStop(event);
                this.$element = null;
            });
        });
        const scrollSub = fromEvent(document, 'scroll')
            .subscribe(() => {
            if (this.$element) {
                this.updateParentElementData();
            }
        });
        this.subscribtions = this.subscribtions.concat([dragStartSub, dragSub, dragStopSub, scrollSub]);
    }
    setElementPosition(element, position) {
        this.positionX = position.x;
        this.positionY = position.y;
        utils.setCssElementPosition(element, position);
    }
    updateParentElementData() {
        this.parentRect = this.$element.parentElement.getBoundingClientRect();
        this.parentOffset = {
            left: this.$element.parentElement.offsetLeft,
            top: this.$element.parentElement.offsetTop
        };
    }
    onStart(event) {
        this.isDragging = true;
        this.$element.style.pointerEvents = 'none';
        this.$element.style.position = 'absolute';
        this.gridsterPrototype.dragItemStart(this, event);
        this.start.emit({ item: this.item });
    }
    onDrag(event) {
        this.gridsterPrototype.updatePrototypePosition(this, event);
    }
    onStop(event) {
        this.gridsterPrototype.dragItemStop(this, event);
        this.isDragging = false;
        this.$element.style.pointerEvents = 'auto';
        this.$element.style.position = '';
        utils.resetCSSElementPosition(this.$element);
        if (this.config.helper) {
            this.$element.parentNode.removeChild(this.$element);
        }
    }
    provideDragElement() {
        let dragElement = this.elementRef.nativeElement;
        if (this.config.helper) {
            dragElement = (dragElement).cloneNode(true);
            document.body.appendChild(this.fixStylesForBodyHelper(dragElement));
        }
        else {
            this.fixStylesForRelativeElement(dragElement);
        }
        return dragElement;
    }
    fixStylesForRelativeElement(el) {
        if (window.getComputedStyle(el).position === 'absolute') {
            return el;
        }
        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        this.containerRectange = el.parentElement.getBoundingClientRect();
        el.style.position = 'absolute';
        this.setElementPosition(el, {
            x: rect.left - this.containerRectange.left,
            y: rect.top - this.containerRectange.top
        });
        return el;
    }
    /**
     * When element is cloned and append to body it should have position absolute and coords set by original
     * relative prototype element position.
     */
    fixStylesForBodyHelper(el) {
        const bodyRect = document.body.getBoundingClientRect();
        const rect = this.elementRef.nativeElement.getBoundingClientRect();
        el.style.position = 'absolute';
        this.setElementPosition(el, {
            x: rect.left - bodyRect.left,
            y: rect.top - bodyRect.top
        });
        return el;
    }
}
GridsterItemPrototypeDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterItemPrototypeDirective, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: GridsterPrototypeService }], target: i0.ɵɵFactoryTarget.Directive });
GridsterItemPrototypeDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.7", type: GridsterItemPrototypeDirective, selector: "[ngxGridsterItemPrototype]", inputs: { data: "data", config: "config", w: "w", wSm: "wSm", wMd: "wMd", wLg: "wLg", wXl: "wXl", h: "h", hSm: "hSm", hMd: "hMd", hLg: "hLg", hXl: "hXl" }, outputs: { drop: "drop", start: "start", cancel: "cancel", enter: "enter", out: "out" }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterItemPrototypeDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngxGridsterItemPrototype]'
                }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: GridsterPrototypeService }]; }, propDecorators: { drop: [{
                type: Output
            }], start: [{
                type: Output
            }], cancel: [{
                type: Output
            }], enter: [{
                type: Output
            }], out: [{
                type: Output
            }], data: [{
                type: Input
            }], config: [{
                type: Input
            }], w: [{
                type: Input
            }], wSm: [{
                type: Input
            }], wMd: [{
                type: Input
            }], wLg: [{
                type: Input
            }], wXl: [{
                type: Input
            }], h: [{
                type: Input
            }], hSm: [{
                type: Input
            }], hMd: [{
                type: Input
            }], hLg: [{
                type: Input
            }], hXl: [{
                type: Input
            }] } });

class GridsterModule {
    static forRoot() {
        return {
            ngModule: GridsterModule,
            providers: [GridsterPrototypeService]
        };
    }
}
GridsterModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
GridsterModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.2.7", ngImport: i0, type: GridsterModule, declarations: [GridsterComponent,
        GridsterItemComponent,
        GridsterItemPrototypeDirective], imports: [CommonModule], exports: [GridsterComponent,
        GridsterItemComponent,
        GridsterItemPrototypeDirective] });
GridsterModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterModule, imports: [CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.7", ngImport: i0, type: GridsterModule, decorators: [{
            type: NgModule,
            args: [{
                    imports: [
                        CommonModule
                    ],
                    declarations: [
                        GridsterComponent,
                        GridsterItemComponent,
                        GridsterItemPrototypeDirective
                    ],
                    exports: [
                        GridsterComponent,
                        GridsterItemComponent,
                        GridsterItemPrototypeDirective
                    ]
                }]
        }] });

/*
 * Public API Surface of gridster
 */

/**
 * Generated bundle index. Do not edit.
 */

export { GridListItem, GridsterComponent, GridsterItemComponent, GridsterItemPrototypeDirective, GridsterModule, GridsterOptions, GridsterPrototypeService, GridsterService };
//# sourceMappingURL=angular2gridster.mjs.map
