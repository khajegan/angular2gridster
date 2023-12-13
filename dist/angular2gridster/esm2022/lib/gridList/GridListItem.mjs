export class GridListItem {
    static { this.BREAKPOINTS = ['sm', 'md', 'lg', 'xl']; }
    static { this.X_PROPERTY_MAP = {
        sm: 'xSm',
        md: 'xMd',
        lg: 'xLg',
        xl: 'xXl'
    }; }
    static { this.Y_PROPERTY_MAP = {
        sm: 'ySm',
        md: 'yMd',
        lg: 'yLg',
        xl: 'yXl'
    }; }
    static { this.W_PROPERTY_MAP = {
        sm: 'wSm',
        md: 'wMd',
        lg: 'wLg',
        xl: 'wXl'
    }; }
    static { this.H_PROPERTY_MAP = {
        sm: 'hSm',
        md: 'hMd',
        lg: 'hLg',
        xl: 'hXl'
    }; }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZExpc3RJdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhcjJncmlkc3Rlci9zcmMvbGliL2dyaWRMaXN0L0dyaWRMaXN0SXRlbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxNQUFNLE9BQU8sWUFBWTthQUNkLGdCQUFXLEdBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDdEQsbUJBQWMsR0FBUTtRQUN6QixFQUFFLEVBQUUsS0FBSztRQUNULEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLEtBQUs7UUFDVCxFQUFFLEVBQUUsS0FBSztLQUNaLENBQUM7YUFFSyxtQkFBYyxHQUFRO1FBQ3pCLEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLEtBQUs7UUFDVCxFQUFFLEVBQUUsS0FBSztRQUNULEVBQUUsRUFBRSxLQUFLO0tBQ1osQ0FBQzthQUVLLG1CQUFjLEdBQVE7UUFDekIsRUFBRSxFQUFFLEtBQUs7UUFDVCxFQUFFLEVBQUUsS0FBSztRQUNULEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLEtBQUs7S0FDWixDQUFDO2FBRUssbUJBQWMsR0FBUTtRQUN6QixFQUFFLEVBQUUsS0FBSztRQUNULEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLEtBQUs7UUFDVCxFQUFFLEVBQUUsS0FBSztLQUNaLENBQUM7SUFNRixJQUFJLFFBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDbkMsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUUzRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELElBQUksQ0FBQyxDQUFFLEtBQWE7UUFDaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTNFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFM0UsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFDRCxJQUFJLENBQUMsQ0FBRSxLQUFhO1FBQ2hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUUzRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTNFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBQ0QsSUFBSSxDQUFDLENBQUUsS0FBYTtRQUNoQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFM0UsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELElBQUksQ0FBQztRQUNELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM1QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUUzRSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUNELElBQUksQ0FBQyxDQUFFLEtBQWE7UUFDaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRTNFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxJQUFJLFFBQVE7UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDbkMsQ0FBQztJQUNELElBQUksUUFBUSxDQUFFLEtBQWM7UUFDeEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDcEMsQ0FBQztJQUVELElBQUksV0FBVztRQUNYLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUM7SUFDeEMsQ0FBQztJQUVELElBQUksU0FBUztRQUNULE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxTQUFTLENBQUM7SUFDdEMsQ0FBQztJQUVELElBQUksU0FBUztRQUNULE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUV0RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1AsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxTQUFTO1FBQ1QsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDO1FBRXRELElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0lBQzFCLENBQUM7SUFFTSxtQkFBbUIsQ0FBRSxJQUEyQjtRQUNuRCxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBRTtZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztRQUMxQixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sNEJBQTRCLENBQUUsSUFBb0M7UUFDckUsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7UUFDMUIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLG9CQUFvQixDQUFFLElBQVk7UUFDckMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFLEVBQUU7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1NBQ25EO1FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLElBQUk7UUFDUCxNQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBRXBDLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDO1lBQ2pDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztTQUM1QixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRU0saUJBQWlCLENBQUMsVUFBVztRQUNoQyxNQUFNLFFBQVEsR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1FBRXBDLE9BQU8sUUFBUSxDQUFDLG9CQUFvQixDQUFDO1lBQ2pDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDN0IsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO1lBQzdCLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztZQUM3QixDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUM7WUFDN0IsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDNUIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVNLFNBQVMsQ0FBQyxVQUFXO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLFNBQVMsQ0FBQyxVQUFXO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLFNBQVMsQ0FBQyxVQUFXO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFTSxTQUFTLENBQUMsVUFBVztRQUN4QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFNUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxVQUFXO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxVQUFXO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxVQUFXO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxVQUFXO1FBQ3ZDLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUU1QixJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUNoRCxDQUFDO0lBRU0sY0FBYyxDQUFDLFVBQVc7UUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNoQyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbkY7SUFDTCxDQUFDO0lBRU0sY0FBYyxDQUFDLFVBQVc7UUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNoQyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbkY7SUFDTCxDQUFDO0lBRU0sY0FBYyxDQUFDLFVBQVc7UUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNoQyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbkY7SUFDTCxDQUFDO0lBRU0sY0FBYyxDQUFDLFVBQVc7UUFDN0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNoQyxJQUFJLElBQUksRUFBRTtZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbkY7SUFDTCxDQUFDO0lBRU0sWUFBWSxDQUFDLFVBQVc7UUFDM0IsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNyQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRU0sYUFBYSxDQUFDLFFBQTBCO1FBQzNDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQzdDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDNUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBQ2hELENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxRQUEwQjtRQUMvQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQyxPQUFPLEVBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFDLENBQUM7U0FDNUI7UUFDRCxRQUFRLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO1FBRW5ELE9BQU87WUFDSCxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsU0FBUztZQUNqQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsVUFBVTtTQUNwQyxDQUFDO0lBQ04sQ0FBQztJQUVNLFNBQVMsQ0FBQyxRQUEwQjtRQUN2QyxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUM5QyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDcEQsQ0FBQztJQUVNLGFBQWEsQ0FBQyxRQUEwQjtRQUMzQyxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQyxPQUFPLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFDLENBQUM7U0FDaEM7UUFDRCxRQUFRLEdBQUcsUUFBUSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO1FBRW5ELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN4RCxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFekQsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxVQUFVLEVBQUU7WUFDM0MsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbkQ7UUFDRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxLQUFLLFlBQVksRUFBRTtZQUM3QyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNyRDtRQUVELE9BQU87WUFDSCxLQUFLLEVBQUUsS0FBSyxHQUFHLFFBQVEsQ0FBQyxTQUFTO1lBQ2pDLE1BQU0sRUFBRSxNQUFNLEdBQUcsUUFBUSxDQUFDLFVBQVU7U0FDdkMsQ0FBQztJQUNOLENBQUM7SUFFTyxZQUFZLENBQUMsVUFBbUI7UUFFcEMsSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNsQyxPQUFPLFlBQVksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDbEQ7YUFBTTtZQUNILE9BQU8sR0FBRyxDQUFDO1NBQ2Q7SUFDTCxDQUFDO0lBRU8sWUFBWSxDQUFDLFVBQW1CO1FBRXBDLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEMsT0FBTyxZQUFZLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQ2xEO2FBQU07WUFDSCxPQUFPLEdBQUcsQ0FBQztTQUNkO0lBQ0wsQ0FBQztJQUVPLFlBQVksQ0FBQyxVQUFtQjtRQUNwQyxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDcEIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxZQUFZLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDckQ7UUFFRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDNUIsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUM7UUFFL0UsSUFBSSxVQUFVLElBQUksZUFBZSxFQUFFO1lBQy9CLE9BQU8sWUFBWSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNsRDthQUFNO1lBQ0gsT0FBTyxHQUFHLENBQUM7U0FDZDtJQUNMLENBQUM7SUFFTyxZQUFZLENBQUMsVUFBbUI7UUFDcEMsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEUsWUFBWSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1NBQ3JEO1FBRUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzVCLE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDO1FBRS9FLElBQUksVUFBVSxJQUFJLGVBQWUsRUFBRTtZQUMvQixPQUFPLFlBQVksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDbEQ7YUFBTTtZQUNILE9BQU8sR0FBRyxDQUFDO1NBQ2Q7SUFDTCxDQUFDO0lBRU8sT0FBTztRQUNYLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRXpFLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7U0FDL0M7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU8sU0FBUztRQUNiLE9BQU8sSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDdkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdyaWRzdGVySXRlbUNvbXBvbmVudCB9IGZyb20gJy4uL2dyaWRzdGVyLWl0ZW0vZ3JpZHN0ZXItaXRlbS5jb21wb25lbnQnO1xuaW1wb3J0IHsgR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlIH0gZnJvbSAnLi4vZ3JpZHN0ZXItcHJvdG90eXBlL2dyaWRzdGVyLWl0ZW0tcHJvdG90eXBlLmRpcmVjdGl2ZSc7XG5pbXBvcnQgeyBHcmlkc3RlclNlcnZpY2UgfSBmcm9tICcuLi9ncmlkc3Rlci5zZXJ2aWNlJztcblxuZXhwb3J0IGNsYXNzIEdyaWRMaXN0SXRlbSB7XG4gICAgc3RhdGljIEJSRUFLUE9JTlRTOiBBcnJheTxzdHJpbmc+ID0gWydzbScsICdtZCcsICdsZycsICd4bCddO1xuICAgIHN0YXRpYyBYX1BST1BFUlRZX01BUDogYW55ID0ge1xuICAgICAgICBzbTogJ3hTbScsXG4gICAgICAgIG1kOiAneE1kJyxcbiAgICAgICAgbGc6ICd4TGcnLFxuICAgICAgICB4bDogJ3hYbCdcbiAgICB9O1xuXG4gICAgc3RhdGljIFlfUFJPUEVSVFlfTUFQOiBhbnkgPSB7XG4gICAgICAgIHNtOiAneVNtJyxcbiAgICAgICAgbWQ6ICd5TWQnLFxuICAgICAgICBsZzogJ3lMZycsXG4gICAgICAgIHhsOiAneVhsJ1xuICAgIH07XG5cbiAgICBzdGF0aWMgV19QUk9QRVJUWV9NQVA6IGFueSA9IHtcbiAgICAgICAgc206ICd3U20nLFxuICAgICAgICBtZDogJ3dNZCcsXG4gICAgICAgIGxnOiAnd0xnJyxcbiAgICAgICAgeGw6ICd3WGwnXG4gICAgfTtcblxuICAgIHN0YXRpYyBIX1BST1BFUlRZX01BUDogYW55ID0ge1xuICAgICAgICBzbTogJ2hTbScsXG4gICAgICAgIG1kOiAnaE1kJyxcbiAgICAgICAgbGc6ICdoTGcnLFxuICAgICAgICB4bDogJ2hYbCdcbiAgICB9O1xuXG4gICAgaXRlbUNvbXBvbmVudDogR3JpZHN0ZXJJdGVtQ29tcG9uZW50O1xuICAgIGl0ZW1Qcm90b3R5cGU6IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZTtcbiAgICBpdGVtT2JqZWN0OiBhbnk7XG5cbiAgICBnZXQgJGVsZW1lbnQgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRJdGVtKCkuJGVsZW1lbnQ7XG4gICAgfVxuXG4gICAgZ2V0IHggKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG4gICAgICAgIGNvbnN0IGJyZWFrcG9pbnQgPSBpdGVtLmdyaWRzdGVyID8gaXRlbS5ncmlkc3Rlci5vcHRpb25zLmJyZWFrcG9pbnQgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlWChicmVha3BvaW50KTtcbiAgICB9XG4gICAgc2V0IHggKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuICAgICAgICBjb25zdCBicmVha3BvaW50ID0gaXRlbS5ncmlkc3RlciA/IGl0ZW0uZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50IDogbnVsbDtcblxuICAgICAgICB0aGlzLnNldFZhbHVlWCh2YWx1ZSwgYnJlYWtwb2ludCk7XG4gICAgfVxuXG4gICAgZ2V0IHkgKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG4gICAgICAgIGNvbnN0IGJyZWFrcG9pbnQgPSBpdGVtLmdyaWRzdGVyID8gaXRlbS5ncmlkc3Rlci5vcHRpb25zLmJyZWFrcG9pbnQgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlWShicmVha3BvaW50KTtcbiAgICB9XG4gICAgc2V0IHkgKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuICAgICAgICBjb25zdCBicmVha3BvaW50ID0gaXRlbS5ncmlkc3RlciA/IGl0ZW0uZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50IDogbnVsbDtcblxuICAgICAgICB0aGlzLnNldFZhbHVlWSh2YWx1ZSwgYnJlYWtwb2ludCk7XG4gICAgfVxuXG4gICAgZ2V0IHcgKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG4gICAgICAgIGNvbnN0IGJyZWFrcG9pbnQgPSBpdGVtLmdyaWRzdGVyID8gaXRlbS5ncmlkc3Rlci5vcHRpb25zLmJyZWFrcG9pbnQgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlVyhicmVha3BvaW50KTtcbiAgICB9XG4gICAgc2V0IHcgKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuICAgICAgICBjb25zdCBicmVha3BvaW50ID0gaXRlbS5ncmlkc3RlciA/IGl0ZW0uZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50IDogbnVsbDtcblxuICAgICAgICB0aGlzLnNldFZhbHVlVyh2YWx1ZSwgYnJlYWtwb2ludCk7XG4gICAgfVxuXG4gICAgZ2V0IGggKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG4gICAgICAgIGNvbnN0IGJyZWFrcG9pbnQgPSBpdGVtLmdyaWRzdGVyID8gaXRlbS5ncmlkc3Rlci5vcHRpb25zLmJyZWFrcG9pbnQgOiBudWxsO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmdldFZhbHVlSChicmVha3BvaW50KTtcbiAgICB9XG4gICAgc2V0IGggKHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuICAgICAgICBjb25zdCBicmVha3BvaW50ID0gaXRlbS5ncmlkc3RlciA/IGl0ZW0uZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50IDogbnVsbDtcblxuICAgICAgICB0aGlzLnNldFZhbHVlSCh2YWx1ZSwgYnJlYWtwb2ludCk7XG4gICAgfVxuXG4gICAgZ2V0IGF1dG9TaXplICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SXRlbSgpLmF1dG9TaXplO1xuICAgIH1cbiAgICBzZXQgYXV0b1NpemUgKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuZ2V0SXRlbSgpLmF1dG9TaXplID0gdmFsdWU7XG4gICAgfVxuXG4gICAgZ2V0IGRyYWdBbmREcm9wKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLmdldEl0ZW0oKS5kcmFnQW5kRHJvcDtcbiAgICB9XG5cbiAgICBnZXQgcmVzaXphYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLmdldEl0ZW0oKS5yZXNpemFibGU7XG4gICAgfVxuXG4gICAgZ2V0IHBvc2l0aW9uWCgpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuaXRlbUNvbXBvbmVudCB8fCB0aGlzLml0ZW1Qcm90b3R5cGU7XG5cbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpdGVtLnBvc2l0aW9uWDtcbiAgICB9XG5cbiAgICBnZXQgcG9zaXRpb25ZKCkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50IHx8IHRoaXMuaXRlbVByb3RvdHlwZTtcblxuICAgICAgICBpZiAoIWl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZW0ucG9zaXRpb25ZO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRGcm9tR3JpZHN0ZXJJdGVtIChpdGVtOiBHcmlkc3Rlckl0ZW1Db21wb25lbnQpOiBHcmlkTGlzdEl0ZW0ge1xuICAgICAgICBpZiAodGhpcy5pc0l0ZW1TZXQoKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkTGlzdEl0ZW0gaXMgYWxyZWFkeSBzZXQuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pdGVtQ29tcG9uZW50ID0gaXRlbTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEZyb21Hcmlkc3Rlckl0ZW1Qcm90b3R5cGUgKGl0ZW06IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSk6IEdyaWRMaXN0SXRlbSB7XG4gICAgICAgIGlmICh0aGlzLmlzSXRlbVNldCgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWRMaXN0SXRlbSBpcyBhbHJlYWR5IHNldC4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZW1Qcm90b3R5cGUgPSBpdGVtO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0RnJvbU9iamVjdExpdGVyYWwgKGl0ZW06IE9iamVjdCk6IEdyaWRMaXN0SXRlbSB7XG4gICAgICAgIGlmICh0aGlzLmlzSXRlbVNldCgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWRMaXN0SXRlbSBpcyBhbHJlYWR5IHNldC4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLml0ZW1PYmplY3QgPSBpdGVtO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBwdWJsaWMgY29weSgpIHtcbiAgICAgICAgY29uc3QgaXRlbUNvcHkgPSBuZXcgR3JpZExpc3RJdGVtKCk7XG5cbiAgICAgICAgcmV0dXJuIGl0ZW1Db3B5LnNldEZyb21PYmplY3RMaXRlcmFsKHtcbiAgICAgICAgICAgICRlbGVtZW50OiB0aGlzLiRlbGVtZW50LFxuICAgICAgICAgICAgeDogdGhpcy54LFxuICAgICAgICAgICAgeTogdGhpcy55LFxuICAgICAgICAgICAgdzogdGhpcy53LFxuICAgICAgICAgICAgaDogdGhpcy5oLFxuICAgICAgICAgICAgYXV0b1NpemU6IHRoaXMuYXV0b1NpemUsXG4gICAgICAgICAgICBkcmFnQW5kRHJvcDogdGhpcy5kcmFnQW5kRHJvcCxcbiAgICAgICAgICAgIHJlc2l6YWJsZTogdGhpcy5yZXNpemFibGVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNvcHlGb3JCcmVha3BvaW50KGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW1Db3B5ID0gbmV3IEdyaWRMaXN0SXRlbSgpO1xuXG4gICAgICAgIHJldHVybiBpdGVtQ29weS5zZXRGcm9tT2JqZWN0TGl0ZXJhbCh7XG4gICAgICAgICAgICAkZWxlbWVudDogdGhpcy4kZWxlbWVudCxcbiAgICAgICAgICAgIHg6IHRoaXMuZ2V0VmFsdWVYKGJyZWFrcG9pbnQpLFxuICAgICAgICAgICAgeTogdGhpcy5nZXRWYWx1ZVkoYnJlYWtwb2ludCksXG4gICAgICAgICAgICB3OiB0aGlzLmdldFZhbHVlVyhicmVha3BvaW50KSxcbiAgICAgICAgICAgIGg6IHRoaXMuZ2V0VmFsdWVIKGJyZWFrcG9pbnQpLFxuICAgICAgICAgICAgYXV0b1NpemU6IHRoaXMuYXV0b1NpemUsXG4gICAgICAgICAgICBkcmFnQW5kRHJvcDogdGhpcy5kcmFnQW5kRHJvcCxcbiAgICAgICAgICAgIHJlc2l6YWJsZTogdGhpcy5yZXNpemFibGVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFZhbHVlWChicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG5cbiAgICAgICAgcmV0dXJuIGl0ZW1bdGhpcy5nZXRYUHJvcGVydHkoYnJlYWtwb2ludCldO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRWYWx1ZVkoYnJlYWtwb2ludD8pIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuXG4gICAgICAgIHJldHVybiBpdGVtW3RoaXMuZ2V0WVByb3BlcnR5KGJyZWFrcG9pbnQpXTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VmFsdWVXKGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oKTtcblxuICAgICAgICByZXR1cm4gaXRlbVt0aGlzLmdldFdQcm9wZXJ0eShicmVha3BvaW50KV0gfHwgMTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0VmFsdWVIKGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oKTtcblxuICAgICAgICByZXR1cm4gaXRlbVt0aGlzLmdldEhQcm9wZXJ0eShicmVha3BvaW50KV0gfHwgMTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0VmFsdWVYKHZhbHVlOiBudW1iZXIsIGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oKTtcblxuICAgICAgICBpdGVtW3RoaXMuZ2V0WFByb3BlcnR5KGJyZWFrcG9pbnQpXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRWYWx1ZVkodmFsdWU6IG51bWJlciwgYnJlYWtwb2ludD8pIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuXG4gICAgICAgIGl0ZW1bdGhpcy5nZXRZUHJvcGVydHkoYnJlYWtwb2ludCldID0gdmFsdWU7XG4gICAgfVxuXG4gICAgcHVibGljIHNldFZhbHVlVyh2YWx1ZTogbnVtYmVyLCBicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5nZXRJdGVtKCk7XG5cbiAgICAgICAgaXRlbVt0aGlzLmdldFdQcm9wZXJ0eShicmVha3BvaW50KV0gPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0VmFsdWVIKHZhbHVlOiBudW1iZXIsIGJyZWFrcG9pbnQ/KSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oKTtcblxuICAgICAgICBpdGVtW3RoaXMuZ2V0SFByb3BlcnR5KGJyZWFrcG9pbnQpXSA9IHZhbHVlO1xuICAgIH1cblxuICAgIHB1YmxpYyB0cmlnZ2VyQ2hhbmdlWChicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50O1xuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbVt0aGlzLmdldFhQcm9wZXJ0eShicmVha3BvaW50KSArICdDaGFuZ2UnXS5lbWl0KHRoaXMuZ2V0VmFsdWVYKGJyZWFrcG9pbnQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB0cmlnZ2VyQ2hhbmdlWShicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50O1xuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbVt0aGlzLmdldFlQcm9wZXJ0eShicmVha3BvaW50KSArICdDaGFuZ2UnXS5lbWl0KHRoaXMuZ2V0VmFsdWVZKGJyZWFrcG9pbnQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB0cmlnZ2VyQ2hhbmdlVyhicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50O1xuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbVt0aGlzLmdldFdQcm9wZXJ0eShicmVha3BvaW50KSArICdDaGFuZ2UnXS5lbWl0KHRoaXMuZ2V0VmFsdWVXKGJyZWFrcG9pbnQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyB0cmlnZ2VyQ2hhbmdlSChicmVha3BvaW50Pykge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50O1xuICAgICAgICBpZiAoaXRlbSkge1xuICAgICAgICAgICAgaXRlbVt0aGlzLmdldEhQcm9wZXJ0eShicmVha3BvaW50KSArICdDaGFuZ2UnXS5lbWl0KHRoaXMuZ2V0VmFsdWVIKGJyZWFrcG9pbnQpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBoYXNQb3NpdGlvbnMoYnJlYWtwb2ludD8pIHtcbiAgICAgICAgY29uc3QgeCA9IHRoaXMuZ2V0VmFsdWVYKGJyZWFrcG9pbnQpO1xuICAgICAgICBjb25zdCB5ID0gdGhpcy5nZXRWYWx1ZVkoYnJlYWtwb2ludCk7XG5cbiAgICAgICAgcmV0dXJuICh4IHx8IHggPT09IDApICYmICh5IHx8IHkgPT09IDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseVBvc2l0aW9uKGdyaWRzdGVyPzogR3JpZHN0ZXJTZXJ2aWNlKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5jYWxjdWxhdGVQb3NpdGlvbihncmlkc3Rlcik7XG5cbiAgICAgICAgdGhpcy5pdGVtQ29tcG9uZW50LnBvc2l0aW9uWCA9IHBvc2l0aW9uLmxlZnQ7XG4gICAgICAgIHRoaXMuaXRlbUNvbXBvbmVudC5wb3NpdGlvblkgPSBwb3NpdGlvbi50b3A7XG4gICAgICAgIHRoaXMuaXRlbUNvbXBvbmVudC51cGRhdGVFbGVtZW5ldFBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbGN1bGF0ZVBvc2l0aW9uKGdyaWRzdGVyPzogR3JpZHN0ZXJTZXJ2aWNlKToge2xlZnQ6IG51bWJlciwgdG9wOiBudW1iZXJ9IHtcbiAgICAgICAgaWYgKCFncmlkc3RlciAmJiAhdGhpcy5pdGVtQ29tcG9uZW50KSB7XG4gICAgICAgICAgICByZXR1cm4ge2xlZnQ6IDAsIHRvcDogMH07XG4gICAgICAgIH1cbiAgICAgICAgZ3JpZHN0ZXIgPSBncmlkc3RlciB8fCB0aGlzLml0ZW1Db21wb25lbnQuZ3JpZHN0ZXI7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxlZnQ6IHRoaXMueCAqIGdyaWRzdGVyLmNlbGxXaWR0aCxcbiAgICAgICAgICAgIHRvcDogdGhpcy55ICogZ3JpZHN0ZXIuY2VsbEhlaWdodFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseVNpemUoZ3JpZHN0ZXI/OiBHcmlkc3RlclNlcnZpY2UpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuY2FsY3VsYXRlU2l6ZShncmlkc3Rlcik7XG5cbiAgICAgICAgdGhpcy4kZWxlbWVudC5zdHlsZS53aWR0aCA9IHNpemUud2lkdGggKyAncHgnO1xuICAgICAgICB0aGlzLiRlbGVtZW50LnN0eWxlLmhlaWdodCA9IHNpemUuaGVpZ2h0ICsgJ3B4JztcbiAgICB9XG5cbiAgICBwdWJsaWMgY2FsY3VsYXRlU2l6ZShncmlkc3Rlcj86IEdyaWRzdGVyU2VydmljZSk6IHt3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcn0ge1xuICAgICAgICBpZiAoIWdyaWRzdGVyICYmICF0aGlzLml0ZW1Db21wb25lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB7d2lkdGg6IDAsIGhlaWdodDogMH07XG4gICAgICAgIH1cbiAgICAgICAgZ3JpZHN0ZXIgPSBncmlkc3RlciB8fCB0aGlzLml0ZW1Db21wb25lbnQuZ3JpZHN0ZXI7XG5cbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5nZXRWYWx1ZVcoZ3JpZHN0ZXIub3B0aW9ucy5icmVha3BvaW50KTtcbiAgICAgICAgbGV0IGhlaWdodCA9IHRoaXMuZ2V0VmFsdWVIKGdyaWRzdGVyLm9wdGlvbnMuYnJlYWtwb2ludCk7XG5cbiAgICAgICAgaWYgKGdyaWRzdGVyLm9wdGlvbnMuZGlyZWN0aW9uID09PSAndmVydGljYWwnKSB7XG4gICAgICAgICAgICB3aWR0aCA9IE1hdGgubWluKHdpZHRoLCBncmlkc3Rlci5vcHRpb25zLmxhbmVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZ3JpZHN0ZXIub3B0aW9ucy5kaXJlY3Rpb24gPT09ICdob3Jpem9udGFsJykge1xuICAgICAgICAgICAgaGVpZ2h0ID0gTWF0aC5taW4oaGVpZ2h0LCBncmlkc3Rlci5vcHRpb25zLmxhbmVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGggKiBncmlkc3Rlci5jZWxsV2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIGdyaWRzdGVyLmNlbGxIZWlnaHRcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFhQcm9wZXJ0eShicmVha3BvaW50Pzogc3RyaW5nKSB7XG5cbiAgICAgICAgaWYgKGJyZWFrcG9pbnQgJiYgdGhpcy5pdGVtQ29tcG9uZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gR3JpZExpc3RJdGVtLlhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICd4JztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0WVByb3BlcnR5KGJyZWFrcG9pbnQ/OiBzdHJpbmcpIHtcblxuICAgICAgICBpZiAoYnJlYWtwb2ludCAmJiB0aGlzLml0ZW1Db21wb25lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBHcmlkTGlzdEl0ZW0uWV9QUk9QRVJUWV9NQVBbYnJlYWtwb2ludF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJ3knO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRXUHJvcGVydHkoYnJlYWtwb2ludD86IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5pdGVtUHJvdG90eXBlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pdGVtUHJvdG90eXBlW0dyaWRMaXN0SXRlbS5XX1BST1BFUlRZX01BUFticmVha3BvaW50XV0gP1xuICAgICAgICAgICAgICAgIEdyaWRMaXN0SXRlbS5XX1BST1BFUlRZX01BUFticmVha3BvaW50XSA6ICd3JztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmdldEl0ZW0oKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2l2ZVNpemVzID0gaXRlbS5ncmlkc3RlciAmJiBpdGVtLmdyaWRzdGVyLm9wdGlvbnMucmVzcG9uc2l2ZVNpemVzO1xuXG4gICAgICAgIGlmIChicmVha3BvaW50ICYmIHJlc3BvbnNpdmVTaXplcykge1xuICAgICAgICAgICAgcmV0dXJuIEdyaWRMaXN0SXRlbS5XX1BST1BFUlRZX01BUFticmVha3BvaW50XTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAndyc7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEhQcm9wZXJ0eShicmVha3BvaW50Pzogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLml0ZW1Qcm90b3R5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLml0ZW1Qcm90b3R5cGVbR3JpZExpc3RJdGVtLkhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdXSA/XG4gICAgICAgICAgICAgICAgR3JpZExpc3RJdGVtLkhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdIDogJ2gnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuZ2V0SXRlbSgpO1xuICAgICAgICBjb25zdCByZXNwb25zaXZlU2l6ZXMgPSBpdGVtLmdyaWRzdGVyICYmIGl0ZW0uZ3JpZHN0ZXIub3B0aW9ucy5yZXNwb25zaXZlU2l6ZXM7XG5cbiAgICAgICAgaWYgKGJyZWFrcG9pbnQgJiYgcmVzcG9uc2l2ZVNpemVzKSB7XG4gICAgICAgICAgICByZXR1cm4gR3JpZExpc3RJdGVtLkhfUFJPUEVSVFlfTUFQW2JyZWFrcG9pbnRdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICdoJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0SXRlbSgpOiBhbnkge1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5pdGVtQ29tcG9uZW50IHx8IHRoaXMuaXRlbVByb3RvdHlwZSB8fCB0aGlzLml0ZW1PYmplY3Q7XG5cbiAgICAgICAgaWYgKCFpdGVtKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dyaWRMaXN0SXRlbSBpcyBub3Qgc2V0LicpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVtO1xuICAgIH1cblxuICAgIHByaXZhdGUgaXNJdGVtU2V0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pdGVtQ29tcG9uZW50IHx8IHRoaXMuaXRlbVByb3RvdHlwZSB8fCB0aGlzLml0ZW1PYmplY3Q7XG4gICAgfVxufVxuIl19