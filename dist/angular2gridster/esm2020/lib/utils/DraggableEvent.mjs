export class DraggableEvent {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHJhZ2dhYmxlRXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9hbmd1bGFyMmdyaWRzdGVyL3NyYy9saWIvdXRpbHMvRHJhZ2dhYmxlRXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxPQUFPLGNBQWM7SUFrQnZCLFlBQVksS0FBVTtRQUNsQixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7WUFDZixJQUFJLENBQUMsVUFBVSxHQUFnQixLQUFNLENBQUM7WUFDdEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMvQzthQUFNO1lBQ0gsSUFBSSxDQUFDLFVBQVUsR0FBZ0IsS0FBTSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDL0M7SUFDTCxDQUFDO0lBRUQsWUFBWTtRQUNSLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDN0IsQ0FBQztJQUVELFVBQVU7UUFDTixNQUFNLEtBQUssR0FBVSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUM7UUFFeEQsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1lBQ3ZCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUMzQjtRQUNELElBQUksS0FBSyxDQUFDLGNBQWMsRUFBRTtZQUN0QixLQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDMUI7UUFDRCxLQUFLLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUMxQixLQUFLLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztRQUMxQixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBRUQsc0JBQXNCLENBQUMsU0FBc0I7UUFDekMsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztRQUN0RyxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBRXpHLE1BQU0sSUFBSSxHQUFHLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBRS9DLE9BQU87WUFDSCxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLFVBQVU7WUFDdEMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTO1NBQ3ZDLENBQUM7SUFDTixDQUFDO0lBRU8scUJBQXFCLENBQUMsS0FBaUI7UUFDM0MsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUN6QixJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVPLHFCQUFxQixDQUFDLEtBQWlCO1FBQzNDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUUxRCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDM0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDekIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUUzQixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgRHJhZ2dhYmxlRXZlbnQge1xuICAgIGNsaWVudFg6IG51bWJlcjtcblxuICAgIGNsaWVudFk6IG51bWJlcjtcblxuICAgIHBhZ2VYOiBudW1iZXI7XG5cbiAgICBwYWdlWTogbnVtYmVyO1xuXG4gICAgdGFyZ2V0OiBhbnk7XG5cbiAgICB0eXBlOiBzdHJpbmc7XG5cblxuICAgIHByaXZhdGUgdG91Y2hFdmVudDogVG91Y2hFdmVudDtcblxuICAgIHByaXZhdGUgbW91c2VFdmVudDogTW91c2VFdmVudDtcblxuICAgIGNvbnN0cnVjdG9yKGV2ZW50OiBhbnkpIHtcbiAgICAgICAgaWYgKGV2ZW50LnRvdWNoZXMpIHtcbiAgICAgICAgICAgIHRoaXMudG91Y2hFdmVudCA9ICg8VG91Y2hFdmVudD5ldmVudCk7XG4gICAgICAgICAgICB0aGlzLnNldERhdGFGcm9tVG91Y2hFdmVudCh0aGlzLnRvdWNoRXZlbnQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tb3VzZUV2ZW50ID0gKDxNb3VzZUV2ZW50PmV2ZW50KTtcbiAgICAgICAgICAgIHRoaXMuc2V0RGF0YUZyb21Nb3VzZUV2ZW50KHRoaXMubW91c2VFdmVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1RvdWNoRXZlbnQoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhIXRoaXMudG91Y2hFdmVudDtcbiAgICB9XG5cbiAgICBwYXVzZUV2ZW50KCkge1xuICAgICAgICBjb25zdCBldmVudDogRXZlbnQgPSB0aGlzLnRvdWNoRXZlbnQgfHwgdGhpcy5tb3VzZUV2ZW50O1xuXG4gICAgICAgIGlmIChldmVudC5zdG9wUHJvcGFnYXRpb24pIHtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChldmVudC5wcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5jYW5jZWxCdWJibGUgPSB0cnVlO1xuICAgICAgICBldmVudC5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgZ2V0UmVsYXRpdmVDb29yZGluYXRlcyhjb250YWluZXI6IEhUTUxFbGVtZW50KToge3g6IG51bWJlciwgeTogbnVtYmVyfSB7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wO1xuICAgICAgICBjb25zdCBzY3JvbGxMZWZ0ID0gd2luZG93LnBhZ2VYT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxMZWZ0IHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdDtcblxuICAgICAgICBjb25zdCByZWN0ID0gY29udGFpbmVyLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB4OiB0aGlzLnBhZ2VYIC0gcmVjdC5sZWZ0IC0gc2Nyb2xsTGVmdCxcbiAgICAgICAgICAgIHk6IHRoaXMucGFnZVkgLSByZWN0LnRvcCAtIHNjcm9sbFRvcCxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldERhdGFGcm9tTW91c2VFdmVudChldmVudDogTW91c2VFdmVudCk6IHZvaWQge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgdGhpcy5jbGllbnRYID0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgdGhpcy5jbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgdGhpcy5wYWdlWCA9IGV2ZW50LnBhZ2VYO1xuICAgICAgICB0aGlzLnBhZ2VZID0gZXZlbnQucGFnZVk7XG4gICAgICAgIHRoaXMudHlwZSA9IGV2ZW50LnR5cGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXREYXRhRnJvbVRvdWNoRXZlbnQoZXZlbnQ6IFRvdWNoRXZlbnQpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgdG91Y2ggPSBldmVudC50b3VjaGVzWzBdIHx8IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICB0aGlzLmNsaWVudFggPSB0b3VjaC5jbGllbnRYO1xuICAgICAgICB0aGlzLmNsaWVudFkgPSB0b3VjaC5jbGllbnRZO1xuICAgICAgICB0aGlzLnBhZ2VYID0gdG91Y2gucGFnZVg7XG4gICAgICAgIHRoaXMucGFnZVkgPSB0b3VjaC5wYWdlWTtcbiAgICAgICAgdGhpcy50eXBlID0gZXZlbnQudHlwZTtcblxuICAgIH1cbn1cbiJdfQ==