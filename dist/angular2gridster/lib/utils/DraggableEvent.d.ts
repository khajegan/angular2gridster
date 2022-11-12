export declare class DraggableEvent {
    clientX: number;
    clientY: number;
    pageX: number;
    pageY: number;
    target: any;
    type: string;
    private touchEvent;
    private mouseEvent;
    constructor(event: any);
    isTouchEvent(): boolean;
    pauseEvent(): boolean;
    getRelativeCoordinates(container: HTMLElement): {
        x: number;
        y: number;
    };
    private setDataFromMouseEvent;
    private setDataFromTouchEvent;
}
