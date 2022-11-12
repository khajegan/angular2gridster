import { Observable } from 'rxjs';
import { IGridsterOptions } from './IGridsterOptions';
export declare class GridsterOptions {
    direction: string;
    lanes: number;
    widthHeightRatio: number;
    heightToFontSizeRatio: number;
    responsiveView: boolean;
    responsiveSizes: boolean;
    responsiveToParent: boolean;
    dragAndDrop: boolean;
    resizable: boolean;
    shrink: boolean;
    minWidth: number;
    useCSSTransforms: boolean;
    defaults: IGridsterOptions;
    change: Observable<IGridsterOptions>;
    responsiveOptions: Array<IGridsterOptions>;
    basicOptions: IGridsterOptions;
    breakpointsMap: {
        sm: number;
        md: number;
        lg: number;
        xl: number;
    };
    constructor(config: IGridsterOptions, gridsterElement: HTMLElement);
    getOptionsByWidth(width: number): IGridsterOptions;
    private extendResponsiveOptions;
    private getElementWidth;
}
