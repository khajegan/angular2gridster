import { Injectable } from '@angular/core';
import { Subject, merge } from 'rxjs';
import { takeUntil, switchMap, map, scan, filter, share, tap } from 'rxjs/operators';
import { utils } from '../utils/utils';
import * as i0 from "@angular/core";
export class GridsterPrototypeService {
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
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.0.7", ngImport: i0, type: GridsterPrototypeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.0.7", ngImport: i0, type: GridsterPrototypeService }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.0.7", ngImport: i0, type: GridsterPrototypeService, decorators: [{
            type: Injectable
        }], ctorParameters: () => [] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXItcHJvdG90eXBlLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyMmdyaWRzdGVyL3NyYy9saWIvZ3JpZHN0ZXItcHJvdG90eXBlL2dyaWRzdGVyLXByb3RvdHlwZS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0MsT0FBTyxFQUFjLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDbEQsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBSXJGLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7QUFJdkMsTUFBTSxPQUFPLHdCQUF3QjtJQVVqQztRQVJRLGVBQVUsR0FBRyxLQUFLLENBQUM7UUFFbkIsZ0JBQVcsR0FBRyxJQUFJLE9BQU8sRUFBTyxDQUFDO1FBRWpDLHFCQUFnQixHQUFHLElBQUksT0FBTyxFQUFPLENBQUM7UUFFdEMsb0JBQWUsR0FBRyxJQUFJLE9BQU8sRUFBTyxDQUFDO0lBRTlCLENBQUM7SUFFaEIsZUFBZSxDQUFFLFFBQXlCO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQzVCLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ1osTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsQ0FBQztZQUN2RCxNQUFNLG9CQUFvQixHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDOUUsTUFBTSxDQUFDLENBQUMsY0FBYyxFQUFFLGdCQUFnQixFQUFFLEVB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LEtBQUssV0FBVztnQkFDWixPQUFPLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFDN0QsS0FBSyxPQUFPO2dCQUNSLE9BQU8sS0FBSyxDQUFDLHVCQUF1QixDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN6RDtnQkFDSSxPQUFPLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDNUQ7SUFDTCxDQUFDOzhHQWpNUSx3QkFBd0I7a0hBQXhCLHdCQUF3Qjs7MkZBQXhCLHdCQUF3QjtrQkFEcEMsVUFBVSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIG1lcmdlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YWtlVW50aWwsIHN3aXRjaE1hcCwgbWFwLCBzY2FuLCBmaWx0ZXIsIHNoYXJlLCB0YXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7IEdyaWRzdGVyU2VydmljZSB9IGZyb20gJy4uL2dyaWRzdGVyLnNlcnZpY2UnO1xuaW1wb3J0IHsgR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlIH0gZnJvbSAnLi9ncmlkc3Rlci1pdGVtLXByb3RvdHlwZS5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgdXRpbHMgfSBmcm9tICcuLi91dGlscy91dGlscyc7XG5pbXBvcnQgeyBEcmFnZ2FibGVFdmVudCB9IGZyb20gJy4uL3V0aWxzL0RyYWdnYWJsZUV2ZW50JztcblxuQEluamVjdGFibGUoKVxuZXhwb3J0IGNsYXNzIEdyaWRzdGVyUHJvdG90eXBlU2VydmljZSB7XG5cbiAgICBwcml2YXRlIGlzRHJhZ2dpbmcgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgZHJhZ1N1YmplY3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XG5cbiAgICBwcml2YXRlIGRyYWdTdGFydFN1YmplY3QgPSBuZXcgU3ViamVjdDxhbnk+KCk7XG5cbiAgICBwcml2YXRlIGRyYWdTdG9wU3ViamVjdCA9IG5ldyBTdWJqZWN0PGFueT4oKTtcblxuICAgIGNvbnN0cnVjdG9yKCkge31cblxuICAgIG9ic2VydmVEcm9wT3ZlciAoZ3JpZHN0ZXI6IEdyaWRzdGVyU2VydmljZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kcmFnU3RvcFN1YmplY3QucGlwZShcbiAgICAgICAgICAgIGZpbHRlcigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyaWRzdGVyRWwgPSBncmlkc3Rlci5ncmlkc3RlckNvbXBvbmVudC4kZWxlbWVudDtcbiAgICAgICAgICAgICAgICBjb25zdCBpc092ZXJOZXN0ZWRHcmlkc3RlciA9IFtdLnNsaWNlLmNhbGwoZ3JpZHN0ZXJFbC5xdWVyeVNlbGVjdG9yQWxsKCdncmlkc3RlcicpKVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKChpc092ZXJHcmlkc3RlciwgbmVzdGVkR3JpZHN0ZXJFbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlzT3ZlckdyaWRzdGVyIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pc092ZXJHcmlkc3RlcihkYXRhLml0ZW0sIG5lc3RlZEdyaWRzdGVyRWwsIGRhdGEuZXZlbnQsIGdyaWRzdGVyLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaXNPdmVyTmVzdGVkR3JpZHN0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmlzT3ZlckdyaWRzdGVyKGRhdGEuaXRlbSwgZ3JpZHN0ZXJFbCwgZGF0YS5ldmVudCwgZ3JpZHN0ZXIub3B0aW9ucyk7XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRhcCgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IHdoYXQgd2Ugc2hvdWxkIHByb3ZpZGUgYXMgYSBwYXJhbT9cbiAgICAgICAgICAgICAgICAvLyBwcm90b3R5cGUuZHJvcC5lbWl0KHtpdGVtOiBwcm90b3R5cGUuaXRlbX0pO1xuICAgICAgICAgICAgICAgIGRhdGEuaXRlbS5vbkRyb3AoZ3JpZHN0ZXIpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBvYnNlcnZlRHJvcE91dCAoZ3JpZHN0ZXI6IEdyaWRzdGVyU2VydmljZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kcmFnU3RvcFN1YmplY3QucGlwZShcbiAgICAgICAgICAgIGZpbHRlcigoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyaWRzdGVyRWwgPSBncmlkc3Rlci5ncmlkc3RlckNvbXBvbmVudC4kZWxlbWVudDtcblxuICAgICAgICAgICAgICAgIHJldHVybiAhdGhpcy5pc092ZXJHcmlkc3RlcihkYXRhLml0ZW0sIGdyaWRzdGVyRWwsIGRhdGEuZXZlbnQsIGdyaWRzdGVyLm9wdGlvbnMpO1xuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB0YXAoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB3aGF0IHdlIHNob3VsZCBwcm92aWRlIGFzIGEgcGFyYW0/XG4gICAgICAgICAgICAgICAgZGF0YS5pdGVtLm9uQ2FuY2VsKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIG9ic2VydmVEcmFnT3Zlcihncmlkc3RlcjogR3JpZHN0ZXJTZXJ2aWNlKToge1xuICAgICAgICBkcmFnT3ZlcjogT2JzZXJ2YWJsZTxHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmU+LFxuICAgICAgICBkcmFnRW50ZXI6IE9ic2VydmFibGU8R3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlPixcbiAgICAgICAgZHJhZ091dDogT2JzZXJ2YWJsZTxHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmU+XG4gICAgfSB7XG4gICAgICAgIGNvbnN0IG92ZXIgPSB0aGlzLmRyYWdTdWJqZWN0LnBpcGUoXG4gICAgICAgICAgICBtYXAoKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBncmlkc3RlckVsID0gZ3JpZHN0ZXIuZ3JpZHN0ZXJDb21wb25lbnQuJGVsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgaXRlbTogZGF0YS5pdGVtLFxuICAgICAgICAgICAgICAgICAgZXZlbnQ6IGRhdGEuZXZlbnQsXG4gICAgICAgICAgICAgICAgICBpc092ZXI6IHRoaXMuaXNPdmVyR3JpZHN0ZXIoZGF0YS5pdGVtLCBncmlkc3RlckVsLCBkYXRhLmV2ZW50LCBncmlkc3Rlci5vcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgIGlzRHJvcDogZmFsc2VcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBkcm9wID0gdGhpcy5kcmFnU3RvcFN1YmplY3QucGlwZShcbiAgICAgICAgICAgIG1hcCgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGdyaWRzdGVyRWwgPSBncmlkc3Rlci5ncmlkc3RlckNvbXBvbmVudC4kZWxlbWVudDtcblxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW06IGRhdGEuaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IGRhdGEuZXZlbnQsXG4gICAgICAgICAgICAgICAgICAgIGlzT3ZlcjogdGhpcy5pc092ZXJHcmlkc3RlcihkYXRhLml0ZW0sIGdyaWRzdGVyRWwsIGRhdGEuZXZlbnQsIGdyaWRzdGVyLm9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICBpc0Ryb3A6IHRydWVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBkcmFnRXh0ID0gbWVyZ2UoXG4gICAgICAgICAgICAgICAgLy8gZHJhZ1N0YXJ0U3ViamVjdCBpcyBjb25uZWN0ZWQgaW4gY2FzZSB3aGVuIGl0ZW0gcHJvdG90eXBlIGlzIHBsYWNlZCBhYm92ZSBncmlkc3RlclxuICAgICAgICAgICAgICAgIC8vIGFuZCBkcmFnIGVudGVyIGlzIG5vdCBmaXJlZFxuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ1N0YXJ0U3ViamVjdC5waXBlKG1hcCgoKSA9PiAoeyBpdGVtOiBudWxsLCBpc092ZXI6IGZhbHNlLCBpc0Ryb3A6IGZhbHNlIH0pKSksXG4gICAgICAgICAgICAgICAgb3ZlcixcbiAgICAgICAgICAgICAgICBkcm9wXG4gICAgICAgICAgICApLnBpcGUoXG4gICAgICAgICAgICAgICAgc2NhbigocHJldjogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW06IG5leHQuaXRlbSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50OiBuZXh0LmV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNPdmVyOiBuZXh0LmlzT3ZlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRW50ZXI6IHByZXYuaXNPdmVyID09PSBmYWxzZSAmJiBuZXh0LmlzT3ZlciA9PT0gdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzT3V0OiBwcmV2LmlzT3ZlciA9PT0gdHJ1ZSAmJiBuZXh0LmlzT3ZlciA9PT0gZmFsc2UgJiYgIXByZXYuaXNEcm9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgaXNEcm9wOiBuZXh0LmlzRHJvcFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGZpbHRlcigoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhZGF0YS5pc0Ryb3A7XG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgc2hhcmUoKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBkcmFnRW50ZXIgPSB0aGlzLmNyZWF0ZURyYWdFbnRlck9ic2VydmFibGUoZHJhZ0V4dCwgZ3JpZHN0ZXIpO1xuICAgICAgICBjb25zdCBkcmFnT3V0ID0gdGhpcy5jcmVhdGVEcmFnT3V0T2JzZXJ2YWJsZShkcmFnRXh0LCBncmlkc3Rlcik7XG4gICAgICAgIGNvbnN0IGRyYWdPdmVyID0gZHJhZ0VudGVyXG4gICAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgICAgICBzd2l0Y2hNYXAoKCkgPT4gdGhpcy5kcmFnU3ViamVjdC5waXBlKHRha2VVbnRpbChkcmFnT3V0KSkpLFxuICAgICAgICAgICAgICAgIG1hcCgoZGF0YTogYW55KSA9PiBkYXRhLml0ZW0pXG4gICAgICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiB7IGRyYWdFbnRlciwgZHJhZ091dCwgZHJhZ092ZXIgfTtcbiAgICB9XG5cbiAgICBkcmFnSXRlbVN0YXJ0KGl0ZW06IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSwgZXZlbnQ6IERyYWdnYWJsZUV2ZW50KSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZHJhZ1N0YXJ0U3ViamVjdC5uZXh0KHsgaXRlbSwgZXZlbnQgfSk7XG4gICAgfVxuXG4gICAgZHJhZ0l0ZW1TdG9wKGl0ZW06IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSwgZXZlbnQ6IERyYWdnYWJsZUV2ZW50KSB7XG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRyYWdTdG9wU3ViamVjdC5uZXh0KHsgaXRlbSwgZXZlbnQgfSk7XG4gICAgfVxuXG4gICAgdXBkYXRlUHJvdG90eXBlUG9zaXRpb24oaXRlbTogR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlLCBldmVudDogRHJhZ2dhYmxlRXZlbnQpIHtcbiAgICAgICAgdGhpcy5kcmFnU3ViamVjdC5uZXh0KHsgaXRlbSwgZXZlbnQgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBvYnNlcnZhYmxlIHRoYXQgaXMgZmlyZWQgb24gZHJhZ2dpbmcgb3ZlciBncmlkc3RlciBjb250YWluZXIuXG4gICAgICovXG4gICAgcHJpdmF0ZSBjcmVhdGVEcmFnT3Zlck9ic2VydmFibGUgKFxuICAgICAgICBkcmFnSXNPdmVyOiBPYnNlcnZhYmxlPHtpdGVtOiBHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmUsIGlzT3ZlcjogYm9vbGVhbn0+LFxuICAgICAgICBncmlkc3RlcjogR3JpZHN0ZXJTZXJ2aWNlXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBkcmFnSXNPdmVyLnBpcGUoXG4gICAgICAgICAgICBmaWx0ZXIoKGRhdGE6IGFueSkgPT4gZGF0YS5pc092ZXIgJiYgIWRhdGEuaXNFbnRlciAmJiAhZGF0YS5pc091dCksXG4gICAgICAgICAgICBtYXAoKGRhdGE6IGFueSk6IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSA9PiBkYXRhLml0ZW0pLFxuICAgICAgICAgICAgdGFwKChpdGVtKSA9PiBpdGVtLm9uT3Zlcihncmlkc3RlcikpXG4gICAgICAgICk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgb2JzZXJ2YWJsZSB0aGF0IGlzIGZpcmVkIG9uIGRyYWcgZW50ZXIgZ3JpZHN0ZXIgY29udGFpbmVyLlxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRHJhZ0VudGVyT2JzZXJ2YWJsZSAoXG4gICAgICAgIGRyYWdJc092ZXI6IE9ic2VydmFibGU8e2l0ZW06IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSwgaXNPdmVyOiBib29sZWFufT4sXG4gICAgICAgIGdyaWRzdGVyOiBHcmlkc3RlclNlcnZpY2VcbiAgICApIHtcbiAgICAgICAgcmV0dXJuIGRyYWdJc092ZXIucGlwZShcbiAgICAgICAgICAgIGZpbHRlcigoZGF0YTogYW55KSA9PiBkYXRhLmlzRW50ZXIpLFxuICAgICAgICAgICAgbWFwKChkYXRhOiBhbnkpOiBHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmUgPT4gZGF0YS5pdGVtKSxcbiAgICAgICAgICAgIHRhcCgoaXRlbSkgPT4gaXRlbS5vbkVudGVyKGdyaWRzdGVyKSlcbiAgICAgICAgKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBvYnNlcnZhYmxlIHRoYXQgaXMgZmlyZWQgb24gZHJhZyBvdXQgZ3JpZHN0ZXIgY29udGFpbmVyLlxuICAgICAqL1xuICAgIHByaXZhdGUgY3JlYXRlRHJhZ091dE9ic2VydmFibGUgKFxuICAgICAgICBkcmFnSXNPdmVyOiBPYnNlcnZhYmxlPHtpdGVtOiBHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmUsXG4gICAgICAgIGlzT3ZlcjogYm9vbGVhbn0+LFxuICAgICAgICBncmlkc3RlcjogR3JpZHN0ZXJTZXJ2aWNlXG4gICAgKSB7XG4gICAgICAgIHJldHVybiBkcmFnSXNPdmVyLnBpcGUoXG4gICAgICAgICAgICBmaWx0ZXIoKGRhdGE6IGFueSkgPT4gZGF0YS5pc091dCksXG4gICAgICAgICAgICBtYXAoKGRhdGE6IGFueSk6IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSA9PiBkYXRhLml0ZW0pLFxuICAgICAgICAgICAgdGFwKChpdGVtKSA9PiBpdGVtLm9uT3V0KGdyaWRzdGVyKSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2hldGhlciBcImVsZW1lbnRcIiBwb3NpdGlvbiBmaXRzIGluc2lkZSBcImNvbnRhaW5lckVsXCIgcG9zaXRpb24uXG4gICAgICogSXQgY2hlY2tzIGlmIFwiZWxlbWVudFwiIGlzIHRvdGFsbHkgY292ZXJlZCBieSBcImNvbnRhaW5lckVsXCIgYXJlYS5cbiAgICAgKi9cbiAgICBwcml2YXRlIGlzT3ZlckdyaWRzdGVyKGl0ZW06IEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZSwgZ3JpZHN0ZXJFbDogSFRNTEVsZW1lbnQsIGV2ZW50LCBvcHRpb25zKTogYm9vbGVhbiB7XG4gICAgICAgIGNvbnN0IGVsID0gaXRlbS4kZWxlbWVudDtcbiAgICAgICAgY29uc3QgcGFyZW50SXRlbSA9IDxIVE1MRWxlbWVudD5ncmlkc3RlckVsLnBhcmVudEVsZW1lbnQgJiZcbiAgICAgICAgICAgIDxIVE1MRWxlbWVudD5ncmlkc3RlckVsLnBhcmVudEVsZW1lbnQuY2xvc2VzdCgnZ3JpZHN0ZXItaXRlbScpO1xuXG4gICAgICAgIGlmIChwYXJlbnRJdGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pc092ZXJHcmlkc3RlcihpdGVtLCBwYXJlbnRJdGVtLCBldmVudCwgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKG9wdGlvbnMudG9sZXJhbmNlKSB7XG4gICAgICAgICAgICBjYXNlICdmaXQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB1dGlscy5pc0VsZW1lbnRGaXRDb250YWluZXIoZWwsIGdyaWRzdGVyRWwpO1xuICAgICAgICAgICAgY2FzZSAnaW50ZXJzZWN0JzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdXRpbHMuaXNFbGVtZW50SW50ZXJzZWN0Q29udGFpbmVyKGVsLCBncmlkc3RlckVsKTtcbiAgICAgICAgICAgIGNhc2UgJ3RvdWNoJzpcbiAgICAgICAgICAgICAgICByZXR1cm4gdXRpbHMuaXNFbGVtZW50VG91Y2hDb250YWluZXIoZWwsIGdyaWRzdGVyRWwpO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICByZXR1cm4gdXRpbHMuaXNDdXJzb3JBYm92ZUVsZW1lbnQoZXZlbnQsIGdyaWRzdGVyRWwpO1xuICAgICAgICB9XG4gICAgfVxufVxuIl19