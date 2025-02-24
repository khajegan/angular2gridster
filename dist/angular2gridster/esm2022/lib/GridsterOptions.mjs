import { of, fromEvent, merge } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';
export class GridsterOptions {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JpZHN0ZXJPcHRpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhcjJncmlkc3Rlci9zcmMvbGliL0dyaWRzdGVyT3B0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQWMsRUFBRSxFQUFFLFNBQVMsRUFBUSxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDOUQsT0FBTyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUl6RSxNQUFNLE9BQU8sZUFBZTtJQXlDeEIsWUFBWSxNQUF3QixFQUFFLGVBQTRCO1FBM0JsRSxhQUFRLEdBQXFCO1lBQ3pCLEtBQUssRUFBRSxDQUFDO1lBQ1IsU0FBUyxFQUFFLFlBQVk7WUFDdkIsZ0JBQWdCLEVBQUUsQ0FBQztZQUNuQixNQUFNLEVBQUUsS0FBSztZQUNiLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGtCQUFrQixFQUFFLEtBQUs7WUFDekIsV0FBVyxFQUFFLElBQUk7WUFDakIsU0FBUyxFQUFFLEtBQUs7WUFDaEIsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixRQUFRLEVBQUUsSUFBSTtZQUNkLFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUM7UUFJRixzQkFBaUIsR0FBNEIsRUFBRSxDQUFDO1FBR2hELG1CQUFjLEdBQUc7WUFDYixFQUFFLEVBQUUsR0FBRztZQUNQLEVBQUUsRUFBRSxHQUFHO1lBQ1AsRUFBRSxFQUFFLEdBQUc7WUFDUCxFQUFFLEVBQUUsSUFBSSxDQUFDLGNBQWM7U0FDMUIsQ0FBQztRQUdFLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUVqRixJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQztRQUMzQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUV0RixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FDWCxFQUFFLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQ3JFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUM1QixZQUFZLENBQUMsTUFBTSxDQUFDLGtCQUFrQixJQUFJLENBQUMsQ0FBQyxFQUM1QyxHQUFHLENBQUMsQ0FBQyxLQUFZLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxDQUMzRixDQUNKLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDL0UsQ0FBQztJQUVELGlCQUFpQixDQUFDLEtBQWE7UUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1YsSUFBSSxPQUFPLEdBQXFCLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXBGLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzlCLElBQUksSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxLQUFLLEVBQUU7Z0JBQzdDLE9BQU8sR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDdkM7WUFDRCxDQUFDLEVBQUUsQ0FBQztTQUNQO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVPLHVCQUF1QixDQUFDLGlCQUEwQztRQUN0RSxPQUFPLGlCQUFpQjtZQUNwQiwrREFBK0Q7YUFDOUQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUN0QyxvQ0FBb0M7YUFDbkMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDYixPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUM7Z0JBQ2pCLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO2FBQ3pELEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2FBQ25ELEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQW1CLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzFHLENBQUM7SUFFTyxlQUFlLENBQUMsUUFBYTtRQUNqQyxJQUFJLFFBQVEsS0FBSyxNQUFNLEVBQUU7WUFDckIsT0FBTyxNQUFNLENBQUMsVUFBVSxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1NBQ2pHO1FBRUQsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDO0lBQ2hDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE9ic2VydmFibGUsIG9mLCBmcm9tRXZlbnQsIHBpcGUsIG1lcmdlIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBkZWJvdW5jZVRpbWUsIG1hcCwgZGlzdGluY3RVbnRpbENoYW5nZWQgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7IElHcmlkc3Rlck9wdGlvbnMgfSBmcm9tICcuL0lHcmlkc3Rlck9wdGlvbnMnO1xuXG5leHBvcnQgY2xhc3MgR3JpZHN0ZXJPcHRpb25zIHtcbiAgICBkaXJlY3Rpb246IHN0cmluZztcbiAgICBsYW5lczogbnVtYmVyO1xuICAgIHdpZHRoSGVpZ2h0UmF0aW86IG51bWJlcjtcbiAgICBoZWlnaHRUb0ZvbnRTaXplUmF0aW86IG51bWJlcjtcbiAgICByZXNwb25zaXZlVmlldzogYm9vbGVhbjtcbiAgICByZXNwb25zaXZlU2l6ZXM6IGJvb2xlYW47XG4gICAgcmVzcG9uc2l2ZVRvUGFyZW50OiBib29sZWFuO1xuICAgIGRyYWdBbmREcm9wOiBib29sZWFuO1xuICAgIHJlc2l6YWJsZTogYm9vbGVhbjtcbiAgICBzaHJpbms6IGJvb2xlYW47XG4gICAgbWluV2lkdGg6IG51bWJlcjtcbiAgICB1c2VDU1NUcmFuc2Zvcm1zOiBib29sZWFuO1xuXG4gICAgZGVmYXVsdHM6IElHcmlkc3Rlck9wdGlvbnMgPSB7XG4gICAgICAgIGxhbmVzOiA1LFxuICAgICAgICBkaXJlY3Rpb246ICdob3Jpem9udGFsJyxcbiAgICAgICAgd2lkdGhIZWlnaHRSYXRpbzogMSxcbiAgICAgICAgc2hyaW5rOiBmYWxzZSxcbiAgICAgICAgcmVzcG9uc2l2ZVZpZXc6IHRydWUsXG4gICAgICAgIHJlc3BvbnNpdmVTaXplczogZmFsc2UsXG4gICAgICAgIHJlc3BvbnNpdmVUb1BhcmVudDogZmFsc2UsXG4gICAgICAgIGRyYWdBbmREcm9wOiB0cnVlLFxuICAgICAgICByZXNpemFibGU6IGZhbHNlLFxuICAgICAgICB1c2VDU1NUcmFuc2Zvcm1zOiBmYWxzZSxcbiAgICAgICAgZmxvYXRpbmc6IHRydWUsXG4gICAgICAgIHRvbGVyYW5jZTogJ3BvaW50ZXInXG4gICAgfTtcblxuICAgIGNoYW5nZTogT2JzZXJ2YWJsZTxJR3JpZHN0ZXJPcHRpb25zPjtcblxuICAgIHJlc3BvbnNpdmVPcHRpb25zOiBBcnJheTxJR3JpZHN0ZXJPcHRpb25zPiA9IFtdO1xuICAgIGJhc2ljT3B0aW9uczogSUdyaWRzdGVyT3B0aW9ucztcblxuICAgIGJyZWFrcG9pbnRzTWFwID0ge1xuICAgICAgICBzbTogNTc2LCAvLyBTbWFsbCBkZXZpY2VzXG4gICAgICAgIG1kOiA3NjgsIC8vIE1lZGl1bSBkZXZpY2VzXG4gICAgICAgIGxnOiA5OTIsIC8vIExhcmdlIGRldmljZXNcbiAgICAgICAgeGw6IDEyMDAgLy8gRXh0cmEgbGFyZ2VcbiAgICB9O1xuXG4gICAgY29uc3RydWN0b3IoY29uZmlnOiBJR3JpZHN0ZXJPcHRpb25zLCBncmlkc3RlckVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNpdmVDb250YWluZXIgPSBjb25maWcucmVzcG9uc2l2ZVRvUGFyZW50ID8gZ3JpZHN0ZXJFbGVtZW50IDogd2luZG93O1xuXG4gICAgICAgIHRoaXMuYmFzaWNPcHRpb25zID0gY29uZmlnO1xuICAgICAgICB0aGlzLnJlc3BvbnNpdmVPcHRpb25zID0gdGhpcy5leHRlbmRSZXNwb25zaXZlT3B0aW9ucyhjb25maWcucmVzcG9uc2l2ZU9wdGlvbnMgfHwgW10pO1xuXG4gICAgICAgIHRoaXMuY2hhbmdlID0gbWVyZ2UoXG4gICAgICAgICAgICAgICAgb2YodGhpcy5nZXRPcHRpb25zQnlXaWR0aCh0aGlzLmdldEVsZW1lbnRXaWR0aChyZXNwb25zaXZlQ29udGFpbmVyKSkpLFxuICAgICAgICAgICAgICAgIGZyb21FdmVudCh3aW5kb3csICdyZXNpemUnKS5waXBlKFxuICAgICAgICAgICAgICAgICAgICBkZWJvdW5jZVRpbWUoY29uZmlnLnJlc3BvbnNpdmVEZWJvdW5jZSB8fCAwKSxcbiAgICAgICAgICAgICAgICAgICAgbWFwKChldmVudDogRXZlbnQpID0+IHRoaXMuZ2V0T3B0aW9uc0J5V2lkdGgodGhpcy5nZXRFbGVtZW50V2lkdGgocmVzcG9uc2l2ZUNvbnRhaW5lcikpKVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICkucGlwZShkaXN0aW5jdFVudGlsQ2hhbmdlZChudWxsLCAob3B0aW9uczogYW55KSA9PiBvcHRpb25zLm1pbldpZHRoKSk7XG4gICAgfVxuXG4gICAgZ2V0T3B0aW9uc0J5V2lkdGgod2lkdGg6IG51bWJlcik6IElHcmlkc3Rlck9wdGlvbnMge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGxldCBvcHRpb25zOiBJR3JpZHN0ZXJPcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgdGhpcy5iYXNpY09wdGlvbnMpO1xuXG4gICAgICAgIHdoaWxlICh0aGlzLnJlc3BvbnNpdmVPcHRpb25zW2ldKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zaXZlT3B0aW9uc1tpXS5taW5XaWR0aCA8PSB3aWR0aCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMgPSB0aGlzLnJlc3BvbnNpdmVPcHRpb25zW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBleHRlbmRSZXNwb25zaXZlT3B0aW9ucyhyZXNwb25zaXZlT3B0aW9uczogQXJyYXk8SUdyaWRzdGVyT3B0aW9ucz4pOiBBcnJheTxJR3JpZHN0ZXJPcHRpb25zPiB7XG4gICAgICAgIHJldHVybiByZXNwb25zaXZlT3B0aW9uc1xuICAgICAgICAgICAgLy8gcmVzcG9uc2l2ZSBvcHRpb25zIGFyZSB2YWxpZCBvbmx5IHdpdGggXCJicmVha3BvaW50XCIgcHJvcGVydHlcbiAgICAgICAgICAgIC5maWx0ZXIob3B0aW9ucyA9PiBvcHRpb25zLmJyZWFrcG9pbnQpXG4gICAgICAgICAgICAvLyBzZXQgZGVmYXVsdCBtaW5XaWR0aCBpZiBub3QgZ2l2ZW5cbiAgICAgICAgICAgIC5tYXAoKG9wdGlvbnMpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgICAgICAgICAgICAgIG1pbldpZHRoOiB0aGlzLmJyZWFrcG9pbnRzTWFwW29wdGlvbnMuYnJlYWtwb2ludF0gfHwgMFxuICAgICAgICAgICAgICAgIH0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zb3J0KChjdXJyLCBuZXh0KSA9PiBjdXJyLm1pbldpZHRoIC0gbmV4dC5taW5XaWR0aClcbiAgICAgICAgICAgIC5tYXAoKG9wdGlvbnMpID0+IDxJR3JpZHN0ZXJPcHRpb25zPk9iamVjdC5hc3NpZ24oe30sIHRoaXMuZGVmYXVsdHMsIHRoaXMuYmFzaWNPcHRpb25zLCBvcHRpb25zKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRFbGVtZW50V2lkdGgoJGVsZW1lbnQ6IGFueSkge1xuICAgICAgICBpZiAoJGVsZW1lbnQgPT09IHdpbmRvdykge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5pbm5lcldpZHRoIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCB8fCBkb2N1bWVudC5ib2R5LmNsaWVudFdpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICRlbGVtZW50LmNsaWVudFdpZHRoO1xuICAgIH1cbn1cbiJdfQ==