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
export class GridList {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZExpc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyMmdyaWRzdGVyL3NyYy9saWIvZ3JpZExpc3QvZ3JpZExpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsTUFBTSxPQUFPLEdBQUcsVUFBUyxLQUFLO0lBQzFCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNuQjtBQUNMLENBQUMsQ0FBQztBQUNGLDZCQUE2QjtBQUM3QixPQUFPLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUV2Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBd0JHO0FBQ0gsTUFBTSxPQUFPLFFBQVE7SUFNakIsWUFBWSxLQUEwQixFQUFFLE9BQXlCO1FBQzdELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBRXZCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRW5CLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBRXpCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7O09BV0c7SUFDSCxRQUFRO1FBQ0osTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDckMsSUFBSSxNQUFNLEdBQUcsT0FBTyxFQUNoQixNQUFNLEdBQUcsT0FBTyxFQUNoQixJQUFJLEVBQ0osQ0FBQyxFQUNELENBQUMsQ0FBQztRQUVOLDBCQUEwQjtRQUMxQixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM5QixNQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEdBQUcs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Q0FBQzthQUNaLENBQUM7U0FDTDtJQUNMLENBQUM7SUFFRDs7T0FFRztJQUNLLGVBQWUsQ0FBQyxJQUFJLEVBQUUsUUFBUTtRQUNsQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFlBQVksRUFBRTtZQUN6QyxJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QjthQUFNO1lBQ0gseUVBQXlFO1lBQ3pFLGdDQUFnQztZQUNoQyxJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyQixJQUFJLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QjtJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdyaWRMaXN0SXRlbSB9IGZyb20gJy4vR3JpZExpc3RJdGVtJztcbmltcG9ydCB7IElHcmlkc3Rlck9wdGlvbnMgfSBmcm9tICcuLi9JR3JpZHN0ZXJPcHRpb25zJztcblxuY29uc3QgR3JpZENvbCA9IGZ1bmN0aW9uKGxhbmVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsYW5lczsgaSsrKSB7XG4gICAgICAgIHRoaXMucHVzaChudWxsKTtcbiAgICB9XG59O1xuLy8gRXh0ZW5kIHRoZSBBcnJheSBwcm90b3R5cGVcbkdyaWRDb2wucHJvdG90eXBlID0gW107XG5cbi8qKlxuICogQSBHcmlkTGlzdCBtYW5hZ2VzIHRoZSB0d28tZGltZW5zaW9uYWwgcG9zaXRpb25zIGZyb20gYSBsaXN0IG9mIGl0ZW1zLFxuICogd2l0aGluIGEgdmlydHVhbCBtYXRyaXguXG4gKlxuICogVGhlIEdyaWRMaXN0J3MgbWFpbiBmdW5jdGlvbiBpcyB0byBjb252ZXJ0IHRoZSBpdGVtIHBvc2l0aW9ucyBmcm9tIG9uZVxuICogZ3JpZCBzaXplIHRvIGFub3RoZXIsIG1haW50YWluaW5nIGFzIG11Y2ggb2YgdGhlaXIgb3JkZXIgYXMgcG9zc2libGUuXG4gKlxuICogVGhlIEdyaWRMaXN0J3Mgc2Vjb25kIGZ1bmN0aW9uIGlzIHRvIGhhbmRsZSBjb2xsaXNpb25zIHdoZW4gbW92aW5nIGFuIGl0ZW1cbiAqIG92ZXIgYW5vdGhlci5cbiAqXG4gKiBUaGUgcG9zaXRpb25pbmcgYWxnb3JpdGhtIHBsYWNlcyBpdGVtcyBpbiBjb2x1bW5zLiBTdGFydGluZyBmcm9tIGxlZnQgdG9cbiAqIHJpZ2h0LCBnb2luZyB0aHJvdWdoIGVhY2ggY29sdW1uIHRvcCB0byBib3R0b20uXG4gKlxuICogVGhlIHNpemUgb2YgYW4gaXRlbSBpcyBleHByZXNzZWQgdXNpbmcgdGhlIG51bWJlciBvZiBjb2xzIGFuZCByb3dzIGl0XG4gKiB0YWtlcyB1cCB3aXRoaW4gdGhlIGdyaWQgKHcgYW5kIGgpXG4gKlxuICogVGhlIHBvc2l0aW9uIG9mIGFuIGl0ZW0gaXMgZXhwcmVzcyB1c2luZyB0aGUgY29sIGFuZCByb3cgcG9zaXRpb24gd2l0aGluXG4gKiB0aGUgZ3JpZCAoeCBhbmQgeSlcbiAqXG4gKiBBbiBpdGVtIGlzIGFuIG9iamVjdCBvZiBzdHJ1Y3R1cmU6XG4gKiB7XG4gKiAgIHc6IDMsIGg6IDEsXG4gKiAgIHg6IDAsIHk6IDFcbiAqIH1cbiAqL1xuZXhwb3J0IGNsYXNzIEdyaWRMaXN0IHtcbiAgICBpdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPjtcbiAgICBncmlkOiBBcnJheTxBcnJheTxHcmlkTGlzdEl0ZW0+PjtcblxuICAgIG9wdGlvbnM6IElHcmlkc3Rlck9wdGlvbnM7XG5cbiAgICBjb25zdHJ1Y3RvcihpdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPiwgb3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgICAgIHRoaXMuaXRlbXMgPSBpdGVtcztcblxuICAgICAgICB0aGlzLmFkanVzdFNpemVPZkl0ZW1zKCk7XG5cbiAgICAgICAgdGhpcy5nZW5lcmF0ZUdyaWQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbGx1c3RyYXRlcyBncmlkIGFzIHRleHQtYmFzZWQgdGFibGUsIHVzaW5nIGEgbnVtYmVyIGlkZW50aWZpZXIgZm9yIGVhY2hcbiAgICAgKiBpdGVtLiBFLmcuXG4gICAgICpcbiAgICAgKiAgI3wgIDAgIDEgIDIgIDMgIDQgIDUgIDYgIDcgIDggIDkgMTAgMTEgMTIgMTNcbiAgICAgKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgKiAgMHwgMDAgMDIgMDMgMDQgMDQgMDYgMDggMDggMDggMTIgMTIgMTMgMTQgMTZcbiAgICAgKiAgMXwgMDEgLS0gMDMgMDUgMDUgMDcgMDkgMTAgMTEgMTEgLS0gMTMgMTUgLS1cbiAgICAgKlxuICAgICAqIFdhcm46IERvZXMgbm90IHdvcmsgaWYgaXRlbXMgZG9uJ3QgaGF2ZSBhIHdpZHRoIG9yIGhlaWdodCBzcGVjaWZpZWRcbiAgICAgKiBiZXNpZGVzIHRoZWlyIHBvc2l0aW9uIGluIHRoZSBncmlkLlxuICAgICAqL1xuICAgIHRvU3RyaW5nKCkge1xuICAgICAgICBjb25zdCB3aWR0aE9mR3JpZCA9IHRoaXMuZ3JpZC5sZW5ndGg7XG4gICAgICAgIGxldCBvdXRwdXQgPSAnXFxuICN8JyxcbiAgICAgICAgICAgIGJvcmRlciA9ICdcXG4gLS0nLFxuICAgICAgICAgICAgaXRlbSxcbiAgICAgICAgICAgIGksXG4gICAgICAgICAgICBqO1xuXG4gICAgICAgIC8vIFJlbmRlciB0aGUgdGFibGUgaGVhZGVyXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB3aWR0aE9mR3JpZDsgaSsrKSB7XG4gICAgICAgICAgICBvdXRwdXQgKz0gJyAnICsgdGhpcy5wYWROdW1iZXIoaSwgJyAnKTtcbiAgICAgICAgICAgIGJvcmRlciArPSAnLS0tJztcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQgKz0gYm9yZGVyO1xuXG4gICAgICAgIC8vIFJlbmRlciB0YWJsZSBjb250ZW50cyByb3cgYnkgcm93LCBhcyB3ZSBnbyBvbiB0aGUgeSBheGlzXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm9wdGlvbnMubGFuZXM7IGkrKykge1xuICAgICAgICAgICAgb3V0cHV0ICs9ICdcXG4nICsgdGhpcy5wYWROdW1iZXIoaSwgJyAnKSArICd8JztcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB3aWR0aE9mR3JpZDsgaisrKSB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9ICcgJztcbiAgICAgICAgICAgICAgICBpdGVtID0gdGhpcy5ncmlkW2pdW2ldO1xuICAgICAgICAgICAgICAgIG91dHB1dCArPSBpdGVtXG4gICAgICAgICAgICAgICAgICAgID8gdGhpcy5wYWROdW1iZXIodGhpcy5pdGVtcy5pbmRleE9mKGl0ZW0pLCAnMCcpXG4gICAgICAgICAgICAgICAgICAgIDogJy0tJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQgKz0gJ1xcbic7XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfVxuXG4gICAgc2V0T3B0aW9uKG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICAgICAgICB0aGlzLm9wdGlvbnNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCB0aGUgZ3JpZCBzdHJ1Y3R1cmUgZnJvbSBzY3JhdGNoLCB3aXRoIHRoZSBjdXJyZW50IGl0ZW0gcG9zaXRpb25zXG4gICAgICovXG4gICAgZ2VuZXJhdGVHcmlkKCkge1xuICAgICAgICBsZXQgaTtcbiAgICAgICAgdGhpcy5yZXNldEdyaWQoKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubWFya0l0ZW1Qb3NpdGlvblRvR3JpZCh0aGlzLml0ZW1zW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlc2l6ZUdyaWQobGFuZXM6IG51bWJlcikge1xuICAgICAgICBsZXQgY3VycmVudENvbHVtbiA9IDA7XG5cbiAgICAgICAgdGhpcy5vcHRpb25zLmxhbmVzID0gbGFuZXM7XG4gICAgICAgIHRoaXMuYWRqdXN0U2l6ZU9mSXRlbXMoKTtcblxuICAgICAgICB0aGlzLnNvcnRJdGVtc0J5UG9zaXRpb24oKTtcbiAgICAgICAgdGhpcy5yZXNldEdyaWQoKTtcblxuICAgICAgICAvLyBUaGUgaXRlbXMgd2lsbCBiZSBzb3J0ZWQgYmFzZWQgb24gdGhlaXIgaW5kZXggd2l0aGluIHRoZSB0aGlzLml0ZW1zIGFycmF5LFxuICAgICAgICAvLyB0aGF0IGlzIHRoZWlyIFwiMWQgcG9zaXRpb25cIlxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLml0ZW1zW2ldLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24oaXRlbSk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlSXRlbVBvc2l0aW9uKFxuICAgICAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICAgICAgdGhpcy5maW5kUG9zaXRpb25Gb3JJdGVtKGl0ZW0sIHsgeDogY3VycmVudENvbHVtbiwgeTogMCB9KVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8gTmV3IGl0ZW1zIHNob3VsZCBuZXZlciBiZSBwbGFjZWQgdG8gdGhlIGxlZnQgb2YgcHJldmlvdXMgaXRlbXNcbiAgICAgICAgICAgIGN1cnJlbnRDb2x1bW4gPSBNYXRoLm1heChjdXJyZW50Q29sdW1uLCBwb3NpdGlvbi54KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHVsbEl0ZW1zVG9MZWZ0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaGFzIHR3byBvcHRpb25zIGZvciB0aGUgcG9zaXRpb24gd2Ugd2FudCBmb3IgdGhlIGl0ZW06XG4gICAgICogLSBTdGFydGluZyBmcm9tIGEgY2VydGFpbiByb3cvY29sdW1uIG51bWJlciBhbmQgb25seSBsb29raW5nIGZvclxuICAgICAqICAgcG9zaXRpb25zIHRvIGl0cyByaWdodFxuICAgICAqIC0gQWNjZXB0aW5nIHBvc2l0aW9ucyBmb3IgYSBjZXJ0YWluIHJvdyBudW1iZXIgb25seSAodXNlLWNhc2U6IGl0ZW1zXG4gICAgICogICBiZWluZyBzaGlmdGVkIHRvIHRoZSBsZWZ0L3JpZ2h0IGFzIGEgcmVzdWx0IG9mIGNvbGxpc2lvbnMpXG4gICAgICpcbiAgICAgKiBAcGFyYW0gT2JqZWN0IGl0ZW1cbiAgICAgKiBAcGFyYW0gT2JqZWN0IHN0YXJ0IFBvc2l0aW9uIGZyb20gd2hpY2ggdG8gc3RhcnRcbiAgICAgKiAgICAgdGhlIHNlYXJjaC5cbiAgICAgKiBAcGFyYW0gbnVtYmVyIFtmaXhlZFJvd10gSWYgcHJvdmlkZWQsIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBmaW5kIGFcbiAgICAgKiAgICAgcG9zaXRpb24gZm9yIHRoZSBuZXcgaXRlbSBvbiBpdC4gSWYgZG9lc24ndCBmaXQgdGhlcmUsIHdlJ3JlIGdvaW5nXG4gICAgICogICAgIHRvIHB1dCBpdCBvbiB0aGUgZmlyc3Qgcm93LlxuICAgICAqXG4gICAgICogQHJldHVybnMgQXJyYXkgeCBhbmQgeS5cbiAgICAgKi9cbiAgICBmaW5kUG9zaXRpb25Gb3JJdGVtKFxuICAgICAgICBpdGVtOiBHcmlkTGlzdEl0ZW0sXG4gICAgICAgIHN0YXJ0OiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0sXG4gICAgICAgIGZpeGVkUm93PzogbnVtYmVyXG4gICAgKTogQXJyYXk8bnVtYmVyPiB7XG4gICAgICAgIGxldCB4LCB5LCBwb3NpdGlvbjtcblxuICAgICAgICAvLyBTdGFydCBzZWFyY2hpbmcgZm9yIGEgcG9zaXRpb24gZnJvbSB0aGUgaG9yaXpvbnRhbCBwb3NpdGlvbiBvZiB0aGVcbiAgICAgICAgLy8gcmlnaHRtb3N0IGl0ZW0gZnJvbSB0aGUgZ3JpZFxuICAgICAgICBmb3IgKHggPSBzdGFydC54OyB4IDwgdGhpcy5ncmlkLmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICBpZiAoZml4ZWRSb3cgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gW3gsIGZpeGVkUm93XTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0ZW1GaXRzQXRQb3NpdGlvbihpdGVtLCBwb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh5ID0gc3RhcnQueTsgeSA8IHRoaXMub3B0aW9ucy5sYW5lczsgeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uID0gW3gsIHldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLml0ZW1GaXRzQXRQb3NpdGlvbihpdGVtLCBwb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlJ3ZlIHJlYWNoZWQgdGhpcyBwb2ludCwgd2UgbmVlZCB0byBzdGFydCBhIG5ldyBjb2x1bW5cbiAgICAgICAgY29uc3QgbmV3Q29sID0gdGhpcy5ncmlkLmxlbmd0aDtcbiAgICAgICAgbGV0IG5ld1JvdyA9IDA7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgZml4ZWRSb3cgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgdGhpcy5pdGVtRml0c0F0UG9zaXRpb24oaXRlbSwgW25ld0NvbCwgZml4ZWRSb3ddKVxuICAgICAgICApIHtcbiAgICAgICAgICAgIG5ld1JvdyA9IGZpeGVkUm93O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFtuZXdDb2wsIG5ld1Jvd107XG4gICAgfVxuXG4gICAgbW92ZUFuZFJlc2l6ZShcbiAgICAgICAgaXRlbTogR3JpZExpc3RJdGVtLFxuICAgICAgICBuZXdQb3NpdGlvbjogQXJyYXk8bnVtYmVyPixcbiAgICAgICAgc2l6ZTogeyB3OiBudW1iZXI7IGg6IG51bWJlciB9XG4gICAgKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24oe1xuICAgICAgICAgICAgeDogbmV3UG9zaXRpb25bMF0sXG4gICAgICAgICAgICB5OiBuZXdQb3NpdGlvblsxXSxcbiAgICAgICAgICAgIHc6IGl0ZW0udyxcbiAgICAgICAgICAgIGg6IGl0ZW0uaFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBzaXplLncgfHwgaXRlbS53LFxuICAgICAgICAgICAgaGVpZ2h0ID0gc2l6ZS5oIHx8IGl0ZW0uaDtcblxuICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1Qb3NpdGlvbihpdGVtLCBbcG9zaXRpb24ueCwgcG9zaXRpb24ueV0pO1xuICAgICAgICB0aGlzLnVwZGF0ZUl0ZW1TaXplKGl0ZW0sIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICAgIHRoaXMucmVzb2x2ZUNvbGxpc2lvbnMoaXRlbSk7XG4gICAgfVxuXG4gICAgbW92ZUl0ZW1Ub1Bvc2l0aW9uKGl0ZW06IEdyaWRMaXN0SXRlbSwgbmV3UG9zaXRpb246IEFycmF5PG51bWJlcj4pIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbih7XG4gICAgICAgICAgICB4OiBuZXdQb3NpdGlvblswXSxcbiAgICAgICAgICAgIHk6IG5ld1Bvc2l0aW9uWzFdLFxuICAgICAgICAgICAgdzogaXRlbS53LFxuICAgICAgICAgICAgaDogaXRlbS5oXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudXBkYXRlSXRlbVBvc2l0aW9uKGl0ZW0sIFtwb3NpdGlvbi54LCBwb3NpdGlvbi55XSk7XG4gICAgICAgIHRoaXMucmVzb2x2ZUNvbGxpc2lvbnMoaXRlbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVzaXplIGFuIGl0ZW0gYW5kIHJlc29sdmUgY29sbGlzaW9ucy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBPYmplY3QgaXRlbSBBIHJlZmVyZW5jZSB0byBhbiBpdGVtIHRoYXQncyBwYXJ0IG9mIHRoZSBncmlkLlxuICAgICAqIEBwYXJhbSBPYmplY3Qgc2l6ZVxuICAgICAqIEBwYXJhbSBudW1iZXIgW3NpemUudz1pdGVtLnddIFRoZSBuZXcgd2lkdGguXG4gICAgICogQHBhcmFtIG51bWJlciBbc2l6ZS5oPWl0ZW0uaF0gVGhlIG5ldyBoZWlnaHQuXG4gICAgICovXG4gICAgcmVzaXplSXRlbShpdGVtOiBHcmlkTGlzdEl0ZW0sIHNpemU6IHsgdzogbnVtYmVyOyBoOiBudW1iZXIgfSkge1xuICAgICAgICBjb25zdCB3aWR0aCA9IHNpemUudyB8fCBpdGVtLncsXG4gICAgICAgICAgICBoZWlnaHQgPSBzaXplLmggfHwgaXRlbS5oO1xuXG4gICAgICAgIHRoaXMudXBkYXRlSXRlbVNpemUoaXRlbSwgd2lkdGgsIGhlaWdodCk7XG5cbiAgICAgICAgdGhpcy5wdWxsSXRlbXNUb0xlZnQoaXRlbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcGFyZSB0aGUgY3VycmVudCBpdGVtcyBhZ2FpbnN0IGEgcHJldmlvdXMgc25hcHNob3QgYW5kIHJldHVybiBvbmx5XG4gICAgICogdGhlIG9uZXMgdGhhdCBjaGFuZ2VkIHRoZWlyIGF0dHJpYnV0ZXMgaW4gdGhlIG1lYW50aW1lLiBUaGlzIGluY2x1ZGVzIGJvdGhcbiAgICAgKiBwb3NpdGlvbiAoeCwgeSkgYW5kIHNpemUgKHcsIGgpXG4gICAgICpcbiAgICAgKiBFYWNoIGl0ZW0gdGhhdCBpcyByZXR1cm5lZCBpcyBub3QgdGhlIEdyaWRMaXN0SXRlbSBidXQgdGhlIGhlbHBlciB0aGF0IGhvbGRzIEdyaWRMaXN0SXRlbVxuICAgICAqIGFuZCBsaXN0IG9mIGNoYW5nZWQgcHJvcGVydGllcy5cbiAgICAgKi9cbiAgICBnZXRDaGFuZ2VkSXRlbXMoXG4gICAgICAgIGluaXRpYWxJdGVtczogQXJyYXk8R3JpZExpc3RJdGVtPixcbiAgICAgICAgYnJlYWtwb2ludD9cbiAgICApOiBBcnJheTx7XG4gICAgICAgIGl0ZW06IEdyaWRMaXN0SXRlbTtcbiAgICAgICAgY2hhbmdlczogQXJyYXk8c3RyaW5nPjtcbiAgICAgICAgaXNOZXc6IGJvb2xlYW47XG4gICAgfT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtc1xuICAgICAgICAgICAgLm1hcCgoaXRlbTogR3JpZExpc3RJdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhbmdlcyA9IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9sZFZhbHVlczoge1xuICAgICAgICAgICAgICAgICAgICB4PzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB5PzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICB3PzogbnVtYmVyO1xuICAgICAgICAgICAgICAgICAgICBoPzogbnVtYmVyO1xuICAgICAgICAgICAgICAgIH0gPSB7fTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbml0SXRlbSA9IGluaXRpYWxJdGVtcy5maW5kKFxuICAgICAgICAgICAgICAgICAgICBpbml0SXRtID0+IGluaXRJdG0uJGVsZW1lbnQgPT09IGl0ZW0uJGVsZW1lbnRcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpbml0SXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBpdGVtLCBjaGFuZ2VzOiBbJ3gnLCAneScsICd3JywgJ2gnXSwgaXNOZXc6IHRydWUgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBvbGRYID0gaW5pdEl0ZW0uZ2V0VmFsdWVYKGJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtLmdldFZhbHVlWChicmVha3BvaW50KSAhPT0gb2xkWCkge1xuICAgICAgICAgICAgICAgICAgICBjaGFuZ2VzLnB1c2goJ3gnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFggfHwgb2xkWCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWVzLnggPSBvbGRYO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkWSA9IGluaXRJdGVtLmdldFZhbHVlWShicmVha3BvaW50KTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbS5nZXRWYWx1ZVkoYnJlYWtwb2ludCkgIT09IG9sZFkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoKCd5Jyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRZIHx8IG9sZFkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlcy55ID0gb2xkWTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2V0VmFsdWVXKGJyZWFrcG9pbnQpICE9PVxuICAgICAgICAgICAgICAgICAgICBpbml0SXRlbS5nZXRWYWx1ZVcoYnJlYWtwb2ludClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlcy5wdXNoKCd3Jyk7XG4gICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlcy53ID0gaW5pdEl0ZW0udztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICBpdGVtLmdldFZhbHVlSChicmVha3BvaW50KSAhPT1cbiAgICAgICAgICAgICAgICAgICAgaW5pdEl0ZW0uZ2V0VmFsdWVIKGJyZWFrcG9pbnQpXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5nZXMucHVzaCgnaCcpO1xuICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZXMuaCA9IGluaXRJdGVtLmg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgaXRlbSwgb2xkVmFsdWVzLCBjaGFuZ2VzLCBpc05ldzogZmFsc2UgfTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICAgICAgIChpdGVtQ2hhbmdlOiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW06IEdyaWRMaXN0SXRlbTtcbiAgICAgICAgICAgICAgICAgICAgY2hhbmdlczogQXJyYXk8c3RyaW5nPjtcbiAgICAgICAgICAgICAgICB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtQ2hhbmdlLmNoYW5nZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgfVxuXG4gICAgcmVzb2x2ZUNvbGxpc2lvbnMoaXRlbTogR3JpZExpc3RJdGVtKSB7XG4gICAgICAgIGlmICghdGhpcy50cnlUb1Jlc29sdmVDb2xsaXNpb25zTG9jYWxseShpdGVtKSkge1xuICAgICAgICAgICAgdGhpcy5wdWxsSXRlbXNUb0xlZnQoaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5mbG9hdGluZykge1xuICAgICAgICAgICAgdGhpcy5wdWxsSXRlbXNUb0xlZnQoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdldEl0ZW1zQ29sbGlkaW5nV2l0aEl0ZW0oaXRlbSkubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnB1bGxJdGVtc1RvTGVmdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVzaENvbGxpZGluZ0l0ZW1zKGZpeGVkSXRlbT86IEdyaWRMaXN0SXRlbSkge1xuICAgICAgICAvLyBTdGFydCBhIGZyZXNoIGdyaWQgd2l0aCB0aGUgZml4ZWQgaXRlbSBhbHJlYWR5IHBsYWNlZCBpbnNpZGVcbiAgICAgICAgdGhpcy5zb3J0SXRlbXNCeVBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMucmVzZXRHcmlkKCk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKCk7XG5cbiAgICAgICAgdGhpcy5pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcihpdGVtID0+ICF0aGlzLmlzSXRlbUZsb2F0aW5nKGl0ZW0pICYmIGl0ZW0gIT09IGZpeGVkSXRlbSlcbiAgICAgICAgICAgIC5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy50cnlUb1Jlc29sdmVDb2xsaXNpb25zTG9jYWxseShpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1bGxJdGVtc1RvTGVmdChpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBCdWlsZCB0aGUgZ3JpZCBmcm9tIHNjcmF0Y2gsIGJ5IHVzaW5nIHRoZSBjdXJyZW50IGl0ZW0gcG9zaXRpb25zIGFuZFxuICAgICAqIHB1bGxpbmcgdGhlbSBhcyBtdWNoIHRvIHRoZSBsZWZ0IGFzIHBvc3NpYmxlLCByZW1vdmluZyBhcyBzcGFjZSBiZXR3ZWVuXG4gICAgICogdGhlbSBhcyBwb3NzaWJsZS5cbiAgICAgKlxuICAgICAqIElmIGEgXCJmaXhlZCBpdGVtXCIgaXMgcHJvdmlkZWQsIGl0cyBwb3NpdGlvbiB3aWxsIGJlIGtlcHQgaW50YWN0IGFuZCB0aGVcbiAgICAgKiByZXN0IG9mIHRoZSBpdGVtcyB3aWxsIGJlIGxheWVkIGFyb3VuZCBpdC5cbiAgICAgKi9cbiAgICBwdWxsSXRlbXNUb0xlZnQoZml4ZWRJdGVtPykge1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmRpcmVjdGlvbiA9PT0gJ25vbmUnKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdGFydCBhIGZyZXNoIGdyaWQgd2l0aCB0aGUgZml4ZWQgaXRlbSBhbHJlYWR5IHBsYWNlZCBpbnNpZGVcbiAgICAgICAgdGhpcy5zb3J0SXRlbXNCeVBvc2l0aW9uKCk7XG4gICAgICAgIHRoaXMucmVzZXRHcmlkKCk7XG5cbiAgICAgICAgLy8gU3RhcnQgdGhlIGdyaWQgd2l0aCB0aGUgZml4ZWQgaXRlbSBhcyB0aGUgZmlyc3QgcG9zaXRpb25lZCBpdGVtXG4gICAgICAgIGlmIChmaXhlZEl0ZW0pIHtcbiAgICAgICAgICAgIGNvbnN0IGZpeGVkUG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihmaXhlZEl0ZW0pO1xuICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtUG9zaXRpb24oZml4ZWRJdGVtLCBbXG4gICAgICAgICAgICAgICAgZml4ZWRQb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgIGZpeGVkUG9zaXRpb24ueVxuICAgICAgICAgICAgXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLml0ZW1zXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gIWl0ZW0uZHJhZ0FuZERyb3AgJiYgaXRlbSAhPT0gZml4ZWRJdGVtO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5mb3JFYWNoKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaXhlZFBvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24oaXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVJdGVtUG9zaXRpb24oaXRlbSwgW1xuICAgICAgICAgICAgICAgICAgICBmaXhlZFBvc2l0aW9uLngsXG4gICAgICAgICAgICAgICAgICAgIGZpeGVkUG9zaXRpb24ueVxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtc1tpXSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHRoaXMuZ2V0SXRlbVBvc2l0aW9uKGl0ZW0pO1xuXG4gICAgICAgICAgICAvLyBUaGUgZml4ZWQgaXRlbSBrZWVwcyBpdHMgZXhhY3QgcG9zaXRpb25cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAoZml4ZWRJdGVtICYmIGl0ZW0gPT09IGZpeGVkSXRlbSkgfHxcbiAgICAgICAgICAgICAgICAhaXRlbS5kcmFnQW5kRHJvcCB8fFxuICAgICAgICAgICAgICAgICghdGhpcy5vcHRpb25zLmZsb2F0aW5nICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNJdGVtRmxvYXRpbmcoaXRlbSkgJiZcbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuZ2V0SXRlbXNDb2xsaWRpbmdXaXRoSXRlbShpdGVtKS5sZW5ndGgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgeCA9IHRoaXMuZmluZExlZnRNb3N0UG9zaXRpb25Gb3JJdGVtKGl0ZW0pLFxuICAgICAgICAgICAgICAgIG5ld1Bvc2l0aW9uID0gdGhpcy5maW5kUG9zaXRpb25Gb3JJdGVtKFxuICAgICAgICAgICAgICAgICAgICBpdGVtLFxuICAgICAgICAgICAgICAgICAgICB7IHg6IHgsIHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb24ueVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlSXRlbVBvc2l0aW9uKGl0ZW0sIG5ld1Bvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlzT3ZlckZpeGVkQXJlYShcbiAgICAgICAgeDogbnVtYmVyLFxuICAgICAgICB5OiBudW1iZXIsXG4gICAgICAgIHc6IG51bWJlcixcbiAgICAgICAgaDogbnVtYmVyLFxuICAgICAgICBpdGVtOiBHcmlkTGlzdEl0ZW0gPSBudWxsXG4gICAgKTogYm9vbGVhbiB7XG4gICAgICAgIGxldCBpdGVtRGF0YSA9IHsgeCwgeSwgdywgaCB9O1xuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uICE9PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgIGl0ZW1EYXRhID0geyB4OiB5LCB5OiB4LCB3OiBoLCBoOiB3IH07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gaXRlbURhdGEueDsgaSA8IGl0ZW1EYXRhLnggKyBpdGVtRGF0YS53OyBpKyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IGogPSBpdGVtRGF0YS55OyBqIDwgaXRlbURhdGEueSArIGl0ZW1EYXRhLmg7IGorKykge1xuICAgICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncmlkW2ldICYmXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZFtpXVtqXSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRbaV1bal0gIT09IGl0ZW0gJiZcbiAgICAgICAgICAgICAgICAgICAgIXRoaXMuZ3JpZFtpXVtqXS5kcmFnQW5kRHJvcFxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNoZWNrSXRlbUFib3ZlRW1wdHlBcmVhKFxuICAgICAgICBpdGVtOiBHcmlkTGlzdEl0ZW0sXG4gICAgICAgIG5ld1Bvc2l0aW9uOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH1cbiAgICApIHtcbiAgICAgICAgbGV0IGl0ZW1EYXRhID0ge1xuICAgICAgICAgICAgeDogbmV3UG9zaXRpb24ueCxcbiAgICAgICAgICAgIHk6IG5ld1Bvc2l0aW9uLnksXG4gICAgICAgICAgICB3OiBpdGVtLncsXG4gICAgICAgICAgICBoOiBpdGVtLmhcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIWl0ZW0uaXRlbVByb3RvdHlwZSAmJlxuICAgICAgICAgICAgaXRlbS54ID09PSBuZXdQb3NpdGlvbi54ICYmXG4gICAgICAgICAgICBpdGVtLnkgPT09IG5ld1Bvc2l0aW9uLnlcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlyZWN0aW9uID09PSAnaG9yaXpvbnRhbCcpIHtcbiAgICAgICAgICAgIGl0ZW1EYXRhID0ge1xuICAgICAgICAgICAgICAgIHg6IG5ld1Bvc2l0aW9uLnksXG4gICAgICAgICAgICAgICAgeTogbmV3UG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICB3OiBpdGVtRGF0YS5oLFxuICAgICAgICAgICAgICAgIGg6IGl0ZW1EYXRhLndcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICF0aGlzLmNoZWNrSXRlbXNJbkFyZWEoXG4gICAgICAgICAgICBpdGVtRGF0YS55LFxuICAgICAgICAgICAgaXRlbURhdGEueSArIGl0ZW1EYXRhLmggLSAxLFxuICAgICAgICAgICAgaXRlbURhdGEueCxcbiAgICAgICAgICAgIGl0ZW1EYXRhLnggKyBpdGVtRGF0YS53IC0gMSxcbiAgICAgICAgICAgIGl0ZW1cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBmaXhJdGVtc1Bvc2l0aW9ucyhvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zKSB7XG4gICAgICAgIC8vIGl0ZW1zIHdpdGggeCwgeSB0aGF0IGZpdHMgZ2lyZCB3aXRoIHNpemUgb2Ygb3B0aW9ucy5sYW5lc1xuICAgICAgICBjb25zdCB2YWxpZEl0ZW1zID0gdGhpcy5pdGVtc1xuICAgICAgICAgICAgLmZpbHRlcigoaXRlbTogR3JpZExpc3RJdGVtKSA9PiBpdGVtLml0ZW1Db21wb25lbnQpXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+XG4gICAgICAgICAgICAgICAgdGhpcy5pc0l0ZW1WYWxpZEZvckdyaWQoaXRlbSwgb3B0aW9ucylcbiAgICAgICAgICAgICk7XG4gICAgICAgIC8vIGl0ZW1zIHRoYXQgeCwgeSBtdXN0IGJlIGdlbmVyYXRlZFxuICAgICAgICBjb25zdCBpbnZhbGlkSXRlbXMgPSB0aGlzLml0ZW1zXG4gICAgICAgICAgICAuZmlsdGVyKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+IGl0ZW0uaXRlbUNvbXBvbmVudClcbiAgICAgICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgICAgICAgKGl0ZW06IEdyaWRMaXN0SXRlbSkgPT4gIXRoaXMuaXNJdGVtVmFsaWRGb3JHcmlkKGl0ZW0sIG9wdGlvbnMpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGdyaWRMaXN0ID0gbmV3IEdyaWRMaXN0KFtdLCBvcHRpb25zKTtcblxuICAgICAgICAvLyBwdXQgaXRlbXMgd2l0aCBkZWZpbmVkIHBvc2l0aW9ucyB0byB0aGUgZ3JpZFxuICAgICAgICBncmlkTGlzdC5pdGVtcyA9IHZhbGlkSXRlbXMubWFwKChpdGVtOiBHcmlkTGlzdEl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmNvcHlGb3JCcmVha3BvaW50KG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyaWRMaXN0LmdlbmVyYXRlR3JpZCgpO1xuXG4gICAgICAgIGludmFsaWRJdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xuICAgICAgICAgICAgLy8gVE9ETzogY2hlY2sgaWYgdGhpcyBjaGFuZ2UgZG9lcyBub3QgYnJva2UgYW55dGhpbmdcbiAgICAgICAgICAgIC8vIGNvbnN0IGl0ZW1Db3B5ID0gaXRlbS5jb3B5KCk7XG4gICAgICAgICAgICBjb25zdCBpdGVtQ29weSA9IGl0ZW0uY29weUZvckJyZWFrcG9pbnQob3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gZ3JpZExpc3QuZmluZFBvc2l0aW9uRm9ySXRlbShpdGVtQ29weSwge1xuICAgICAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICAgICAgeTogMFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGdyaWRMaXN0Lml0ZW1zLnB1c2goaXRlbUNvcHkpO1xuICAgICAgICAgICAgZ3JpZExpc3Quc2V0SXRlbVBvc2l0aW9uKGl0ZW1Db3B5LCBwb3NpdGlvbik7XG4gICAgICAgICAgICBncmlkTGlzdC5tYXJrSXRlbVBvc2l0aW9uVG9HcmlkKGl0ZW1Db3B5KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JpZExpc3QucHVsbEl0ZW1zVG9MZWZ0KCk7XG4gICAgICAgIGdyaWRMaXN0LnB1c2hDb2xsaWRpbmdJdGVtcygpO1xuXG4gICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRtOiBHcmlkTGlzdEl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZEl0ZW0gPSBncmlkTGlzdC5pdGVtcy5maWx0ZXIoY2FjaGVkSXRtID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FjaGVkSXRtLiRlbGVtZW50ID09PSBpdG0uJGVsZW1lbnQ7XG4gICAgICAgICAgICB9KVswXTtcblxuICAgICAgICAgICAgaXRtLnNldFZhbHVlWChjYWNoZWRJdGVtLngsIG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgICAgICBpdG0uc2V0VmFsdWVZKGNhY2hlZEl0ZW0ueSwgb3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgICAgIGl0bS5zZXRWYWx1ZVcoY2FjaGVkSXRlbS53LCBvcHRpb25zLmJyZWFrcG9pbnQpO1xuICAgICAgICAgICAgaXRtLnNldFZhbHVlSChjYWNoZWRJdGVtLmgsIG9wdGlvbnMuYnJlYWtwb2ludCk7XG4gICAgICAgICAgICBpdG0uYXV0b1NpemUgPSBjYWNoZWRJdGVtLmF1dG9TaXplO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBkZWxldGVJdGVtUG9zaXRpb25Gcm9tR3JpZChpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihpdGVtKTtcbiAgICAgICAgbGV0IHgsIHk7XG5cbiAgICAgICAgZm9yICh4ID0gcG9zaXRpb24ueDsgeCA8IHBvc2l0aW9uLnggKyBwb3NpdGlvbi53OyB4KyspIHtcbiAgICAgICAgICAgIC8vIEl0IGNhbiBoYXBwZW4gdG8gdHJ5IHRvIHJlbW92ZSBhbiBpdGVtIGZyb20gYSBwb3NpdGlvbiBub3QgZ2VuZXJhdGVkXG4gICAgICAgICAgICAvLyBpbiB0aGUgZ3JpZCwgcHJvYmFibHkgd2hlbiBsb2FkaW5nIGEgcGVyc2lzdGVkIGdyaWQgb2YgaXRlbXMuIE5vIG5lZWRcbiAgICAgICAgICAgIC8vIHRvIGNyZWF0ZSBhIGNvbHVtbiB0byBiZSBhYmxlIHRvIHJlbW92ZSBzb21ldGhpbmcgZnJvbSBpdCwgdGhvdWdoXG4gICAgICAgICAgICBpZiAoIXRoaXMuZ3JpZFt4XSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKHkgPSBwb3NpdGlvbi55OyB5IDwgcG9zaXRpb24ueSArIHBvc2l0aW9uLmg7IHkrKykge1xuICAgICAgICAgICAgICAgIC8vIERvbid0IGNsZWFyIHRoZSBjZWxsIGlmIGl0J3MgYmVlbiBvY2N1cGllZCBieSBhIGRpZmZlcmVudCB3aWRnZXQgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgbWVhbnRpbWUgKGUuZy4gd2hlbiBhbiBpdGVtIGhhcyBiZWVuIG1vdmVkIG92ZXIgdGhpcyBvbmUsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHRodXMgYnkgY29udGludWluZyB0byBjbGVhciB0aGlzIGl0ZW0ncyBwcmV2aW91cyBwb3NpdGlvbiB5b3Ugd291bGRcbiAgICAgICAgICAgICAgICAvLyBjYW5jZWwgdGhlIGZpcnN0IGl0ZW0ncyBtb3ZlLCBsZWF2aW5nIGl0IHdpdGhvdXQgYW55IHBvc2l0aW9uIGV2ZW4pXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ3JpZFt4XVt5XSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRbeF1beV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgaXNJdGVtRmxvYXRpbmcoaXRlbSkge1xuICAgICAgICBpZiAoaXRlbS5pdGVtQ29tcG9uZW50ICYmIGl0ZW0uaXRlbUNvbXBvbmVudC5pc0RyYWdnaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihpdGVtKTtcblxuICAgICAgICBpZiAocG9zaXRpb24ueCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJvd0JlbG93SXRlbSA9IHRoaXMuZ3JpZFtwb3NpdGlvbi54IC0gMV07XG5cbiAgICAgICAgcmV0dXJuIChyb3dCZWxvd0l0ZW0gfHwgW10pXG4gICAgICAgICAgICAuc2xpY2UocG9zaXRpb24ueSwgcG9zaXRpb24ueSArIHBvc2l0aW9uLmgpXG4gICAgICAgICAgICAucmVkdWNlKChpc0Zsb2F0aW5nLCBjZWxsSXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBpc0Zsb2F0aW5nICYmICFjZWxsSXRlbTtcbiAgICAgICAgICAgIH0sIHRydWUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNJdGVtVmFsaWRGb3JHcmlkKGl0ZW06IEdyaWRMaXN0SXRlbSwgb3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucykge1xuICAgICAgICBjb25zdCBpdGVtRGF0YSA9XG4gICAgICAgICAgICBvcHRpb25zLmRpcmVjdGlvbiA9PT0gJ2hvcml6b250YWwnXG4gICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgeDogaXRlbS5nZXRWYWx1ZVkob3B0aW9ucy5icmVha3BvaW50KSxcbiAgICAgICAgICAgICAgICAgICAgICB5OiBpdGVtLmdldFZhbHVlWChvcHRpb25zLmJyZWFrcG9pbnQpLFxuICAgICAgICAgICAgICAgICAgICAgIHc6IGl0ZW0uZ2V0VmFsdWVIKG9wdGlvbnMuYnJlYWtwb2ludCksXG4gICAgICAgICAgICAgICAgICAgICAgaDogTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2V0VmFsdWVXKHRoaXMub3B0aW9ucy5icmVha3BvaW50KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sYW5lc1xuICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICB4OiBpdGVtLmdldFZhbHVlWChvcHRpb25zLmJyZWFrcG9pbnQpLFxuICAgICAgICAgICAgICAgICAgICAgIHk6IGl0ZW0uZ2V0VmFsdWVZKG9wdGlvbnMuYnJlYWtwb2ludCksXG4gICAgICAgICAgICAgICAgICAgICAgdzogTWF0aC5taW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uZ2V0VmFsdWVXKHRoaXMub3B0aW9ucy5icmVha3BvaW50KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5sYW5lc1xuICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgaDogaXRlbS5nZXRWYWx1ZUgob3B0aW9ucy5icmVha3BvaW50KVxuICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdHlwZW9mIGl0ZW1EYXRhLnggPT09ICdudW1iZXInICYmXG4gICAgICAgICAgICB0eXBlb2YgaXRlbURhdGEueSA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgICAgIGl0ZW1EYXRhLnggKyBpdGVtRGF0YS53IDw9IG9wdGlvbnMubGFuZXNcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGZpbmREZWZhdWx0UG9zaXRpb25Ib3Jpem9udGFsKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIGZvciAoY29uc3QgY29sIG9mIHRoaXMuZ3JpZCkge1xuICAgICAgICAgICAgY29uc3QgY29sSWR4ID0gdGhpcy5ncmlkLmluZGV4T2YoY29sKTtcbiAgICAgICAgICAgIGxldCByb3dJZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKHJvd0lkeCA8IGNvbC5sZW5ndGggLSBoZWlnaHQgKyAxKSB7XG4gICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAhdGhpcy5jaGVja0l0ZW1zSW5BcmVhKFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sSWR4LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sSWR4ICsgd2lkdGggLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm93SWR4LFxuICAgICAgICAgICAgICAgICAgICAgICAgcm93SWR4ICsgaGVpZ2h0IC0gMVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbY29sSWR4LCByb3dJZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByb3dJZHgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3RoaXMuZ3JpZC5sZW5ndGgsIDBdO1xuICAgIH1cblxuICAgIHByaXZhdGUgZmluZERlZmF1bHRQb3NpdGlvblZlcnRpY2FsKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHRoaXMuZ3JpZCkge1xuICAgICAgICAgICAgY29uc3Qgcm93SWR4ID0gdGhpcy5ncmlkLmluZGV4T2Yocm93KTtcbiAgICAgICAgICAgIGxldCBjb2xJZHggPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGNvbElkeCA8IHJvdy5sZW5ndGggLSB3aWR0aCArIDEpIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgICF0aGlzLmNoZWNrSXRlbXNJbkFyZWEoXG4gICAgICAgICAgICAgICAgICAgICAgICByb3dJZHgsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3dJZHggKyBoZWlnaHQgLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sSWR4LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29sSWR4ICsgd2lkdGggLSAxXG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFtjb2xJZHgsIHJvd0lkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbElkeCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbMCwgdGhpcy5ncmlkLmxlbmd0aF07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjaGVja0l0ZW1zSW5BcmVhKFxuICAgICAgICByb3dTdGFydDogbnVtYmVyLFxuICAgICAgICByb3dFbmQ6IG51bWJlcixcbiAgICAgICAgY29sU3RhcnQ6IG51bWJlcixcbiAgICAgICAgY29sRW5kOiBudW1iZXIsXG4gICAgICAgIGl0ZW0/OiBHcmlkTGlzdEl0ZW1cbiAgICApIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHJvd1N0YXJ0OyBpIDw9IHJvd0VuZDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gY29sU3RhcnQ7IGogPD0gY29sRW5kOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ3JpZFtpXSAmJlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdyaWRbaV1bal0gJiZcbiAgICAgICAgICAgICAgICAgICAgKGl0ZW0gPyB0aGlzLmdyaWRbaV1bal0gIT09IGl0ZW0gOiB0cnVlKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgc29ydEl0ZW1zQnlQb3NpdGlvbigpIHtcbiAgICAgICAgdGhpcy5pdGVtcy5zb3J0KChpdGVtMSwgaXRlbTIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uMSA9IHRoaXMuZ2V0SXRlbVBvc2l0aW9uKGl0ZW0xKSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjIgPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihpdGVtMik7XG5cbiAgICAgICAgICAgIC8vIFRyeSB0byBwcmVzZXJ2ZSBjb2x1bW5zLlxuICAgICAgICAgICAgaWYgKHBvc2l0aW9uMS54ICE9PSBwb3NpdGlvbjIueCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3NpdGlvbjEueCAtIHBvc2l0aW9uMi54O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocG9zaXRpb24xLnkgIT09IHBvc2l0aW9uMi55KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvc2l0aW9uMS55IC0gcG9zaXRpb24yLnk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZSBpdGVtcyBhcmUgcGxhY2VkIG9uIHRoZSBzYW1lIHBvc2l0aW9uLlxuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNvbWUgaXRlbXMgY2FuIGhhdmUgMTAwJSBoZWlnaHQgb3IgMTAwJSB3aWR0aC4gVGhvc2UgZGltbWVuc2lvbnMgYXJlXG4gICAgICogZXhwcmVzc2VkIGFzIDAuIFdlIG5lZWQgdG8gZW5zdXJlIGEgdmFsaWQgd2lkdGggYW5kIGhlaWdodCBmb3IgZWFjaCBvZlxuICAgICAqIHRob3NlIGl0ZW1zIGFzIHRoZSBudW1iZXIgb2YgaXRlbXMgcGVyIGxhbmUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBhZGp1c3RTaXplT2ZJdGVtcygpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtc1tpXTtcblxuICAgICAgICAgICAgLy8gVGhpcyBjYW4gaGFwcGVuIG9ubHkgdGhlIGZpcnN0IHRpbWUgaXRlbXMgYXJlIGNoZWNrZWQuXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRoZSBwcm9wZXJ0eSB0byBoYXZlIGEgdmFsdWUgZm9yIGFsbCB0aGUgaXRlbXMgc28gdGhhdCB0aGVcbiAgICAgICAgICAgIC8vIGBjbG9uZUl0ZW1zYCBtZXRob2Qgd2lsbCBtZXJnZSB0aGUgcHJvcGVydGllcyBwcm9wZXJseS4gSWYgd2Ugb25seSBzZXRcbiAgICAgICAgICAgIC8vIGl0IHRvIHRoZSBpdGVtcyB0aGF0IG5lZWQgaXQgdGhlbiB0aGUgZm9sbG93aW5nIGNhbiBoYXBwZW46XG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gY2xvbmVJdGVtcyhbe2lkOiAxLCBhdXRvU2l6ZTogdHJ1ZX0sIHtpZDogMn1dLFxuICAgICAgICAgICAgLy8gICAgICAgICAgICBbe2lkOiAyfSwge2lkOiAxLCBhdXRvU2l6ZTogdHJ1ZX1dKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyB3aWxsIHJlc3VsdCBpblxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIFt7aWQ6IDEsIGF1dG9TaXplOiB0cnVlfSwge2lkOiAyLCBhdXRvU2l6ZTogdHJ1ZX1dXG4gICAgICAgICAgICBpZiAoaXRlbS5hdXRvU2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgaXRlbS5hdXRvU2l6ZSA9IGl0ZW0udyA9PT0gMCB8fCBpdGVtLmggPT09IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpdGVtLmF1dG9TaXplKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmggPSB0aGlzLm9wdGlvbnMubGFuZXM7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS53ID0gdGhpcy5vcHRpb25zLmxhbmVzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzZXRHcmlkKCkge1xuICAgICAgICB0aGlzLmdyaWQgPSBbXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayB0aGF0IGFuIGl0ZW0gd291bGRuJ3Qgb3ZlcmxhcCB3aXRoIGFub3RoZXIgb25lIGlmIHBsYWNlZCBhdCBhXG4gICAgICogY2VydGFpbiBwb3NpdGlvbiB3aXRoaW4gdGhlIGdyaWRcbiAgICAgKi9cbiAgICBwcml2YXRlIGl0ZW1GaXRzQXRQb3NpdGlvbihpdGVtOiBHcmlkTGlzdEl0ZW0sIG5ld1Bvc2l0aW9uKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24oaXRlbSk7XG4gICAgICAgIGxldCB4LCB5O1xuXG4gICAgICAgIC8vIE5vIGNvb3Jkb25hdGUgY2FuIGJlIG5lZ2F0aXZlXG4gICAgICAgIGlmIChuZXdQb3NpdGlvblswXSA8IDAgfHwgbmV3UG9zaXRpb25bMV0gPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGl0ZW0gaXNuJ3QgbGFyZ2VyIHRoYW4gdGhlIGVudGlyZSBncmlkXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIG5ld1Bvc2l0aW9uWzFdICsgTWF0aC5taW4ocG9zaXRpb24uaCwgdGhpcy5vcHRpb25zLmxhbmVzKSA+XG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMubGFuZXNcbiAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc092ZXJGaXhlZEFyZWEoaXRlbS54LCBpdGVtLnksIGl0ZW0udywgaXRlbS5oKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSBwb3NpdGlvbiBkb2Vzbid0IG92ZXJsYXAgd2l0aCBhbiBhbHJlYWR5IHBvc2l0aW9uZWRcbiAgICAgICAgLy8gaXRlbS5cbiAgICAgICAgZm9yICh4ID0gbmV3UG9zaXRpb25bMF07IHggPCBuZXdQb3NpdGlvblswXSArIHBvc2l0aW9uLnc7IHgrKykge1xuICAgICAgICAgICAgY29uc3QgY29sID0gdGhpcy5ncmlkW3hdO1xuICAgICAgICAgICAgLy8gU3VyZWx5IGEgY29sdW1uIHRoYXQgaGFzbid0IGV2ZW4gYmVlbiBjcmVhdGVkIHlldCBpcyBhdmFpbGFibGVcbiAgICAgICAgICAgIGlmICghY29sKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZvciAoeSA9IG5ld1Bvc2l0aW9uWzFdOyB5IDwgbmV3UG9zaXRpb25bMV0gKyBwb3NpdGlvbi5oOyB5KyspIHtcbiAgICAgICAgICAgICAgICAvLyBBbnkgc3BhY2Ugb2NjdXBpZWQgYnkgYW4gaXRlbSBjYW4gY29udGludWUgdG8gYmUgb2NjdXBpZWQgYnkgdGhlXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBpdGVtLlxuICAgICAgICAgICAgICAgIGlmIChjb2xbeV0gJiYgY29sW3ldICE9PSBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVwZGF0ZUl0ZW1Qb3NpdGlvbihpdGVtOiBHcmlkTGlzdEl0ZW0sIHBvc2l0aW9uOiBBcnJheTxhbnk+KSB7XG4gICAgICAgIGlmIChpdGVtLnggIT09IG51bGwgJiYgaXRlbS55ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZUl0ZW1Qb3NpdGlvbkZyb21HcmlkKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXRJdGVtUG9zaXRpb24oaXRlbSwgcG9zaXRpb24pO1xuXG4gICAgICAgIHRoaXMubWFya0l0ZW1Qb3NpdGlvblRvR3JpZChpdGVtKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0gT2JqZWN0IGl0ZW0gQSByZWZlcmVuY2UgdG8gYSBncmlkIGl0ZW0uXG4gICAgICogQHBhcmFtIG51bWJlciB3aWR0aCBUaGUgbmV3IHdpZHRoLlxuICAgICAqIEBwYXJhbSBudW1iZXIgaGVpZ2h0IFRoZSBuZXcgaGVpZ2h0LlxuICAgICAqL1xuICAgIHByaXZhdGUgdXBkYXRlSXRlbVNpemUoaXRlbTogR3JpZExpc3RJdGVtLCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIGlmIChpdGVtLnggIT09IG51bGwgJiYgaXRlbS55ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmRlbGV0ZUl0ZW1Qb3NpdGlvbkZyb21HcmlkKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbS53ID0gd2lkdGg7XG4gICAgICAgIGl0ZW0uaCA9IGhlaWdodDtcblxuICAgICAgICB0aGlzLm1hcmtJdGVtUG9zaXRpb25Ub0dyaWQoaXRlbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTWFyayB0aGUgZ3JpZCBjZWxscyB0aGF0IGFyZSBvY2N1cGllZCBieSBhbiBpdGVtLiBUaGlzIHByZXZlbnRzIGl0ZW1zXG4gICAgICogZnJvbSBvdmVybGFwcGluZyBpbiB0aGUgZ3JpZFxuICAgICAqL1xuICAgIHByaXZhdGUgbWFya0l0ZW1Qb3NpdGlvblRvR3JpZChpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihpdGVtKTtcbiAgICAgICAgbGV0IHgsIHk7XG5cbiAgICAgICAgLy8gRW5zdXJlIHRoYXQgdGhlIGdyaWQgaGFzIGVub3VnaCBjb2x1bW5zIHRvIGFjY29tb2RhdGUgdGhlIGN1cnJlbnQgaXRlbS5cbiAgICAgICAgdGhpcy5lbnN1cmVDb2x1bW5zKHBvc2l0aW9uLnggKyBwb3NpdGlvbi53KTtcblxuICAgICAgICBmb3IgKHggPSBwb3NpdGlvbi54OyB4IDwgcG9zaXRpb24ueCArIHBvc2l0aW9uLnc7IHgrKykge1xuICAgICAgICAgICAgZm9yICh5ID0gcG9zaXRpb24ueTsgeSA8IHBvc2l0aW9uLnkgKyBwb3NpdGlvbi5oOyB5KyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmdyaWRbeF1beV0gPSBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW5zdXJlIHRoYXQgdGhlIGdyaWQgaGFzIGF0IGxlYXN0IE4gY29sdW1ucyBhdmFpbGFibGUuXG4gICAgICovXG4gICAgcHJpdmF0ZSBlbnN1cmVDb2x1bW5zKE4pIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5ncmlkW2ldKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ncmlkLnB1c2gobmV3IEdyaWRDb2wodGhpcy5vcHRpb25zLmxhbmVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEl0ZW1zQ29sbGlkaW5nV2l0aEl0ZW0oaXRlbTogR3JpZExpc3RJdGVtKTogbnVtYmVyW10ge1xuICAgICAgICBjb25zdCBjb2xsaWRpbmdJdGVtcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpdGVtICE9PSB0aGlzLml0ZW1zW2ldICYmXG4gICAgICAgICAgICAgICAgdGhpcy5pdGVtc0FyZUNvbGxpZGluZyhpdGVtLCB0aGlzLml0ZW1zW2ldKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgY29sbGlkaW5nSXRlbXMucHVzaChpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29sbGlkaW5nSXRlbXM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBpdGVtc0FyZUNvbGxpZGluZyhpdGVtMTogR3JpZExpc3RJdGVtLCBpdGVtMjogR3JpZExpc3RJdGVtKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uMSA9IHRoaXMuZ2V0SXRlbVBvc2l0aW9uKGl0ZW0xKSxcbiAgICAgICAgICAgIHBvc2l0aW9uMiA9IHRoaXMuZ2V0SXRlbVBvc2l0aW9uKGl0ZW0yKTtcblxuICAgICAgICByZXR1cm4gIShcbiAgICAgICAgICAgIHBvc2l0aW9uMi54ID49IHBvc2l0aW9uMS54ICsgcG9zaXRpb24xLncgfHxcbiAgICAgICAgICAgIHBvc2l0aW9uMi54ICsgcG9zaXRpb24yLncgPD0gcG9zaXRpb24xLnggfHxcbiAgICAgICAgICAgIHBvc2l0aW9uMi55ID49IHBvc2l0aW9uMS55ICsgcG9zaXRpb24xLmggfHxcbiAgICAgICAgICAgIHBvc2l0aW9uMi55ICsgcG9zaXRpb24yLmggPD0gcG9zaXRpb24xLnlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBdHRlbXB0IHRvIHJlc29sdmUgdGhlIGNvbGxpc2lvbnMgYWZ0ZXIgbW92aW5nIGFuIGl0ZW0gb3ZlciBvbmUgb3IgbW9yZVxuICAgICAqIG90aGVyIGl0ZW1zIHdpdGhpbiB0aGUgZ3JpZCwgYnkgc2hpZnRpbmcgdGhlIHBvc2l0aW9uIG9mIHRoZSBjb2xsaWRpbmdcbiAgICAgKiBpdGVtcyBhcm91bmQgdGhlIG1vdmluZyBvbmUuIFRoaXMgbWlnaHQgcmVzdWx0IGluIHN1YnNlcXVlbnQgY29sbGlzaW9ucyxcbiAgICAgKiBpbiB3aGljaCBjYXNlIHdlIHdpbGwgcmV2ZXJ0IGFsbCBwb3NpdGlvbiBwZXJtdXRhdGlvbnMuIFRvIGJlIGFibGUgdG9cbiAgICAgKiByZXZlcnQgdG8gdGhlIGluaXRpYWwgaXRlbSBwb3NpdGlvbnMsIHdlIGNyZWF0ZSBhIHZpcnR1YWwgZ3JpZCBpbiB0aGVcbiAgICAgKiBwcm9jZXNzXG4gICAgICovXG4gICAgcHJpdmF0ZSB0cnlUb1Jlc29sdmVDb2xsaXNpb25zTG9jYWxseShpdGVtOiBHcmlkTGlzdEl0ZW0pIHtcbiAgICAgICAgY29uc3QgY29sbGlkaW5nSXRlbXMgPSB0aGlzLmdldEl0ZW1zQ29sbGlkaW5nV2l0aEl0ZW0oaXRlbSk7XG4gICAgICAgIGlmICghY29sbGlkaW5nSXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IF9ncmlkTGlzdCA9IG5ldyBHcmlkTGlzdChcbiAgICAgICAgICAgIHRoaXMuaXRlbXMubWFwKGl0bSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0bS5jb3B5KCk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRoaXMub3B0aW9uc1xuICAgICAgICApO1xuXG4gICAgICAgIGxldCBsZWZ0T2ZJdGVtO1xuICAgICAgICBsZXQgcmlnaHRPZkl0ZW07XG4gICAgICAgIGxldCBhYm92ZU9mSXRlbTtcbiAgICAgICAgbGV0IGJlbG93T2ZJdGVtO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29sbGlkaW5nSXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbGxpZGluZ0l0ZW0gPSBfZ3JpZExpc3QuaXRlbXNbY29sbGlkaW5nSXRlbXNbaV1dLFxuICAgICAgICAgICAgICAgIGNvbGxpZGluZ1Bvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24oY29sbGlkaW5nSXRlbSk7XG5cbiAgICAgICAgICAgIC8vIFdlIHVzZSBhIHNpbXBsZSBhbGdvcml0aG0gZm9yIG1vdmluZyBpdGVtcyBhcm91bmQgd2hlbiBjb2xsaXNpb25zIG9jY3VyOlxuICAgICAgICAgICAgLy8gSW4gdGhpcyBwcmlvcml0aXplZCBvcmRlciwgd2UgdHJ5IHRvIG1vdmUgYSBjb2xsaWRpbmcgaXRlbSBhcm91bmQgdGhlXG4gICAgICAgICAgICAvLyBtb3Zpbmcgb25lOlxuICAgICAgICAgICAgLy8gMS4gdG8gaXRzIGxlZnQgc2lkZVxuICAgICAgICAgICAgLy8gMi4gYWJvdmUgaXRcbiAgICAgICAgICAgIC8vIDMuIHVuZGVyIGl0XG4gICAgICAgICAgICAvLyA0LiB0byBpdHMgcmlnaHQgc2lkZVxuICAgICAgICAgICAgY29uc3QgcG9zaXRpb24gPSB0aGlzLmdldEl0ZW1Qb3NpdGlvbihpdGVtKTtcblxuICAgICAgICAgICAgbGVmdE9mSXRlbSA9IFtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi54IC0gY29sbGlkaW5nUG9zaXRpb24udyxcbiAgICAgICAgICAgICAgICBjb2xsaWRpbmdQb3NpdGlvbi55XG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgcmlnaHRPZkl0ZW0gPSBbcG9zaXRpb24ueCArIHBvc2l0aW9uLncsIGNvbGxpZGluZ1Bvc2l0aW9uLnldO1xuICAgICAgICAgICAgYWJvdmVPZkl0ZW0gPSBbXG4gICAgICAgICAgICAgICAgY29sbGlkaW5nUG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbi55IC0gY29sbGlkaW5nUG9zaXRpb24uaFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIGJlbG93T2ZJdGVtID0gW2NvbGxpZGluZ1Bvc2l0aW9uLngsIHBvc2l0aW9uLnkgKyBwb3NpdGlvbi5oXTtcblxuICAgICAgICAgICAgaWYgKF9ncmlkTGlzdC5pdGVtRml0c0F0UG9zaXRpb24oY29sbGlkaW5nSXRlbSwgbGVmdE9mSXRlbSkpIHtcbiAgICAgICAgICAgICAgICBfZ3JpZExpc3QudXBkYXRlSXRlbVBvc2l0aW9uKGNvbGxpZGluZ0l0ZW0sIGxlZnRPZkl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICBfZ3JpZExpc3QuaXRlbUZpdHNBdFBvc2l0aW9uKGNvbGxpZGluZ0l0ZW0sIGFib3ZlT2ZJdGVtKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgX2dyaWRMaXN0LnVwZGF0ZUl0ZW1Qb3NpdGlvbihjb2xsaWRpbmdJdGVtLCBhYm92ZU9mSXRlbSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgIF9ncmlkTGlzdC5pdGVtRml0c0F0UG9zaXRpb24oY29sbGlkaW5nSXRlbSwgYmVsb3dPZkl0ZW0pXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBfZ3JpZExpc3QudXBkYXRlSXRlbVBvc2l0aW9uKGNvbGxpZGluZ0l0ZW0sIGJlbG93T2ZJdGVtKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgX2dyaWRMaXN0Lml0ZW1GaXRzQXRQb3NpdGlvbihjb2xsaWRpbmdJdGVtLCByaWdodE9mSXRlbSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIF9ncmlkTGlzdC51cGRhdGVJdGVtUG9zaXRpb24oY29sbGlkaW5nSXRlbSwgcmlnaHRPZkl0ZW0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBDb2xsaXNpb25zIGZhaWxlZCwgd2UgbXVzdCB1c2UgdGhlIHB1bGxJdGVtc1RvTGVmdCBtZXRob2QgdG8gYXJyYW5nZVxuICAgICAgICAgICAgICAgIC8vIHRoZSBvdGhlciBpdGVtcyBhcm91bmQgdGhpcyBpdGVtIHdpdGggZml4ZWQgcG9zaXRpb24uIFRoaXMgaXMgb3VyXG4gICAgICAgICAgICAgICAgLy8gcGxhbiBCIGZvciB3aGVuIGxvY2FsIGNvbGxpc2lvbiByZXNvbHZpbmcgZmFpbHMuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIHdlIHJlYWNoZWQgdGhpcyBwb2ludCBpdCBtZWFucyB3ZSBtYW5hZ2VkIHRvIHJlc29sdmUgdGhlIGNvbGxpc2lvbnNcbiAgICAgICAgLy8gZnJvbSBvbmUgc2luZ2xlIGl0ZXJhdGlvbiwganVzdCBieSBtb3ZpbmcgdGhlIGNvbGxpZGluZyBpdGVtcyBhcm91bmQuIFNvXG4gICAgICAgIC8vIHdlIGFjY2VwdCB0aGlzIHNjZW5hcmlvIGFuZCBtZXJnZSB0aGUgYnJhbmNoZWQtb3V0IGdyaWQgaW5zdGFuY2UgaW50byB0aGVcbiAgICAgICAgLy8gb3JpZ2luYWwgb25lXG5cbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdG06IEdyaWRMaXN0SXRlbSwgaWR4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNhY2hlZEl0ZW0gPSBfZ3JpZExpc3QuaXRlbXMuZmlsdGVyKGNhY2hlZEl0bSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlZEl0bS4kZWxlbWVudCA9PT0gaXRtLiRlbGVtZW50O1xuICAgICAgICAgICAgfSlbMF07XG5cbiAgICAgICAgICAgIGl0bS54ID0gY2FjaGVkSXRlbS54O1xuICAgICAgICAgICAgaXRtLnkgPSBjYWNoZWRJdGVtLnk7XG4gICAgICAgICAgICBpdG0udyA9IGNhY2hlZEl0ZW0udztcbiAgICAgICAgICAgIGl0bS5oID0gY2FjaGVkSXRlbS5oO1xuICAgICAgICAgICAgaXRtLmF1dG9TaXplID0gY2FjaGVkSXRlbS5hdXRvU2l6ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGVHcmlkKCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdoZW4gcHVsbGluZyBpdGVtcyB0byB0aGUgbGVmdCwgd2UgbmVlZCB0byBmaW5kIHRoZSBsZWZ0bW9zdCBwb3NpdGlvbiBmb3JcbiAgICAgKiBhbiBpdGVtLCB3aXRoIHR3byBjb25zaWRlcmF0aW9ucyBpbiBtaW5kOlxuICAgICAqIC0gcHJlc2VydmluZyBpdHMgY3VycmVudCByb3dcbiAgICAgKiAtIHByZXNlcnZpbmcgdGhlIHByZXZpb3VzIGhvcml6b250YWwgb3JkZXIgYmV0d2VlbiBpdGVtc1xuICAgICAqL1xuICAgIHByaXZhdGUgZmluZExlZnRNb3N0UG9zaXRpb25Gb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgbGV0IHRhaWwgPSAwO1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuZ2V0SXRlbVBvc2l0aW9uKGl0ZW0pO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ncmlkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gcG9zaXRpb24ueTsgaiA8IHBvc2l0aW9uLnkgKyBwb3NpdGlvbi5oOyBqKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvdGhlckl0ZW0gPSB0aGlzLmdyaWRbaV1bal07XG5cbiAgICAgICAgICAgICAgICBpZiAoIW90aGVySXRlbSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBvdGhlclBvc2l0aW9uID0gdGhpcy5nZXRJdGVtUG9zaXRpb24ob3RoZXJJdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLml0ZW1zLmluZGV4T2Yob3RoZXJJdGVtKSA8IHRoaXMuaXRlbXMuaW5kZXhPZihpdGVtKSkge1xuICAgICAgICAgICAgICAgICAgICB0YWlsID0gb3RoZXJQb3NpdGlvbi54ICsgb3RoZXJQb3NpdGlvbi53O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0YWlsO1xuICAgIH1cblxuICAgIHByaXZhdGUgZmluZEl0ZW1CeVBvc2l0aW9uKHg6IG51bWJlciwgeTogbnVtYmVyKTogR3JpZExpc3RJdGVtIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLml0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pdGVtc1tpXS54ID09PSB4ICYmIHRoaXMuaXRlbXNbaV0ueSA9PT0geSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1zW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRJdGVtQnlBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLml0ZW1zW2ldW2tleV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaXRlbXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwYWROdW1iZXIobnIsIHByZWZpeCkge1xuICAgICAgICAvLyBDdXJyZW50bHkgd29ya3MgZm9yIDItZGlnaXQgbnVtYmVycyAoPDEwMClcbiAgICAgICAgcmV0dXJuIG5yID49IDEwID8gbnIgOiBwcmVmaXggKyBucjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGUgZGlyZWN0aW9uIGlzIHZlcnRpY2FsIHdlIG5lZWQgdG8gcm90YXRlIHRoZSBncmlkIDkwIGRlZyB0byB0aGVcbiAgICAgKiBsZWZ0LiBUaHVzLCB3ZSBzaW11bGF0ZSB0aGUgZmFjdCB0aGF0IGl0ZW1zIGFyZSBiZWluZyBwdWxsZWQgdG8gdGhlIHRvcC5cbiAgICAgKlxuICAgICAqIFNpbmNlIHRoZSBpdGVtcyBoYXZlIHdpZHRocyBhbmQgaGVpZ2h0cywgaWYgd2UgYXBwbHkgdGhlIGNsYXNzaWNcbiAgICAgKiBjb3VudGVyLWNsb2Nrd2lzZSA5MCBkZWcgcm90YXRpb25cbiAgICAgKlxuICAgICAqICAgICBbMCAtMV1cbiAgICAgKiAgICAgWzEgIDBdXG4gICAgICpcbiAgICAgKiB0aGVuIHRoZSB0b3AgbGVmdCBwb2ludCBvZiBhbiBpdGVtIHdpbGwgYmVjb21lIHRoZSBib3R0b20gbGVmdCBwb2ludCBvZlxuICAgICAqIHRoZSByb3RhdGVkIGl0ZW0uIFRvIGFkanVzdCBmb3IgdGhpcywgd2UgbmVlZCB0byBzdWJ0cmFjdCBmcm9tIHRoZSB5XG4gICAgICogcG9zaXRpb24gdGhlIGhlaWdodCBvZiB0aGUgb3JpZ2luYWwgaXRlbSAtIHRoZSB3aWR0aCBvZiB0aGUgcm90YXRlZCBpdGVtLlxuICAgICAqXG4gICAgICogSG93ZXZlciwgaWYgd2UgZG8gdGhpcyB0aGVuIHdlJ2xsIHJldmVyc2Ugc29tZSBhY3Rpb25zOiByZXNpemluZyB0aGVcbiAgICAgKiB3aWR0aCBvZiBhbiBpdGVtIHdpbGwgc3RyZXRjaCB0aGUgaXRlbSB0byB0aGUgbGVmdCBpbnN0ZWFkIG9mIHRvIHRoZVxuICAgICAqIHJpZ2h0OyByZXNpemluZyBhbiBpdGVtIHRoYXQgZG9lc24ndCBmaXQgaW50byB0aGUgZ3JpZCB3aWxsIHB1c2ggdGhlXG4gICAgICogaXRlbXMgYXJvdW5kIGl0IGluc3RlYWQgb2YgZ29pbmcgb24gYSBuZXcgcm93LCBldGMuXG4gICAgICpcbiAgICAgKiBXZSBmb3VuZCBpdCBiZXR0ZXIgdG8gZG8gYSB2ZXJ0aWNhbCBmbGlwIG9mIHRoZSBncmlkIGFmdGVyIHJvdGF0aW5nIGl0LlxuICAgICAqIFRoaXMgcmVzdG9yZXMgdGhlIGRpcmVjdGlvbiBvZiB0aGUgYWN0aW9ucyBhbmQgZ3JlYXRseSBzaW1wbGlmaWVzIHRoZVxuICAgICAqIHRyYW5zZm9ybWF0aW9ucy5cbiAgICAgKi9cbiAgICBwcml2YXRlIGdldEl0ZW1Qb3NpdGlvbihpdGVtOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHg6IGl0ZW0ueSxcbiAgICAgICAgICAgICAgICB5OiBpdGVtLngsXG4gICAgICAgICAgICAgICAgdzogaXRlbS5oLFxuICAgICAgICAgICAgICAgIGg6IGl0ZW0ud1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlZSBnZXRJdGVtUG9zaXRpb24uXG4gICAgICovXG4gICAgcHJpdmF0ZSBzZXRJdGVtUG9zaXRpb24oaXRlbSwgcG9zaXRpb24pIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgaXRlbS54ID0gcG9zaXRpb25bMF07XG4gICAgICAgICAgICBpdGVtLnkgPSBwb3NpdGlvblsxXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIHN1cHBvc2VkIHRvIHN1YnRyYWN0IHRoZSByb3RhdGVkIGl0ZW0ncyBoZWlnaHQgd2hpY2ggaXMgYWN0dWFsbHlcbiAgICAgICAgICAgIC8vIHRoZSBub24tcm90YXRlZCBpdGVtJ3Mgd2lkdGguXG4gICAgICAgICAgICBpdGVtLnggPSBwb3NpdGlvblsxXTtcbiAgICAgICAgICAgIGl0ZW0ueSA9IHBvc2l0aW9uWzBdO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19