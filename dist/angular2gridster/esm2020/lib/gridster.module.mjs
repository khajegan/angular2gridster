import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GridsterComponent } from './gridster.component';
import { GridsterItemComponent } from './gridster-item/gridster-item.component';
import { GridsterItemPrototypeDirective } from './gridster-prototype/gridster-item-prototype.directive';
import { GridsterPrototypeService } from './gridster-prototype/gridster-prototype.service';
import * as i0 from "@angular/core";
export class GridsterModule {
    static forRoot() {
        return {
            ngModule: GridsterModule,
            providers: [GridsterPrototypeService]
        };
    }
}
GridsterModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
GridsterModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "15.2.10", ngImport: i0, type: GridsterModule, declarations: [GridsterComponent,
        GridsterItemComponent,
        GridsterItemPrototypeDirective], imports: [CommonModule], exports: [GridsterComponent,
        GridsterItemComponent,
        GridsterItemPrototypeDirective] });
GridsterModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterModule, imports: [CommonModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.2.10", ngImport: i0, type: GridsterModule, decorators: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZHN0ZXIubW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvYW5ndWxhcjJncmlkc3Rlci9zcmMvbGliL2dyaWRzdGVyLm1vZHVsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUF1QixNQUFNLGVBQWUsQ0FBQztBQUM5RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFFL0MsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDekQsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0seUNBQXlDLENBQUM7QUFDaEYsT0FBTyxFQUFFLDhCQUE4QixFQUFFLE1BQU0sd0RBQXdELENBQUM7QUFDeEcsT0FBTyxFQUFFLHdCQUF3QixFQUFFLE1BQU0saURBQWlELENBQUM7O0FBaUIzRixNQUFNLE9BQU8sY0FBYztJQUN2QixNQUFNLENBQUMsT0FBTztRQUNkLE9BQU87WUFDSCxRQUFRLEVBQUUsY0FBYztZQUN4QixTQUFTLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQztTQUN4QyxDQUFDO0lBQ04sQ0FBQzs7NEdBTlksY0FBYzs2R0FBZCxjQUFjLGlCQVZuQixpQkFBaUI7UUFDakIscUJBQXFCO1FBQ3JCLDhCQUE4QixhQUw5QixZQUFZLGFBUVosaUJBQWlCO1FBQ2pCLHFCQUFxQjtRQUNyQiw4QkFBOEI7NkdBR3pCLGNBQWMsWUFibkIsWUFBWTs0RkFhUCxjQUFjO2tCQWYxQixRQUFRO21CQUFDO29CQUNOLE9BQU8sRUFBRTt3QkFDTCxZQUFZO3FCQUNmO29CQUNELFlBQVksRUFBRTt3QkFDVixpQkFBaUI7d0JBQ2pCLHFCQUFxQjt3QkFDckIsOEJBQThCO3FCQUNqQztvQkFDRCxPQUFPLEVBQUU7d0JBQ0wsaUJBQWlCO3dCQUNqQixxQkFBcUI7d0JBQ3JCLDhCQUE4QjtxQkFDakM7aUJBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZ01vZHVsZSwgTW9kdWxlV2l0aFByb3ZpZGVycyB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgQ29tbW9uTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcblxuaW1wb3J0IHsgR3JpZHN0ZXJDb21wb25lbnQgfSBmcm9tICcuL2dyaWRzdGVyLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBHcmlkc3Rlckl0ZW1Db21wb25lbnQgfSBmcm9tICcuL2dyaWRzdGVyLWl0ZW0vZ3JpZHN0ZXItaXRlbS5jb21wb25lbnQnO1xuaW1wb3J0IHsgR3JpZHN0ZXJJdGVtUHJvdG90eXBlRGlyZWN0aXZlIH0gZnJvbSAnLi9ncmlkc3Rlci1wcm90b3R5cGUvZ3JpZHN0ZXItaXRlbS1wcm90b3R5cGUuZGlyZWN0aXZlJztcbmltcG9ydCB7IEdyaWRzdGVyUHJvdG90eXBlU2VydmljZSB9IGZyb20gJy4vZ3JpZHN0ZXItcHJvdG90eXBlL2dyaWRzdGVyLXByb3RvdHlwZS5zZXJ2aWNlJztcblxuQE5nTW9kdWxlKHtcbiAgICBpbXBvcnRzOiBbXG4gICAgICAgIENvbW1vbk1vZHVsZVxuICAgIF0sXG4gICAgZGVjbGFyYXRpb25zOiBbXG4gICAgICAgIEdyaWRzdGVyQ29tcG9uZW50LFxuICAgICAgICBHcmlkc3Rlckl0ZW1Db21wb25lbnQsXG4gICAgICAgIEdyaWRzdGVySXRlbVByb3RvdHlwZURpcmVjdGl2ZVxuICAgIF0sXG4gICAgZXhwb3J0czogW1xuICAgICAgICBHcmlkc3RlckNvbXBvbmVudCxcbiAgICAgICAgR3JpZHN0ZXJJdGVtQ29tcG9uZW50LFxuICAgICAgICBHcmlkc3Rlckl0ZW1Qcm90b3R5cGVEaXJlY3RpdmVcbiAgICBdXG59KVxuZXhwb3J0IGNsYXNzIEdyaWRzdGVyTW9kdWxlIHtcbiAgICBzdGF0aWMgZm9yUm9vdCgpOiBNb2R1bGVXaXRoUHJvdmlkZXJzPEdyaWRzdGVyTW9kdWxlPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmdNb2R1bGU6IEdyaWRzdGVyTW9kdWxlLFxuICAgICAgICBwcm92aWRlcnM6IFtHcmlkc3RlclByb3RvdHlwZVNlcnZpY2VdXG4gICAgfTtcbn1cbn1cblxuIl19