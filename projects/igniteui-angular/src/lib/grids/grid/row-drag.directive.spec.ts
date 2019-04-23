import { Component, ViewChild, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TestBed, async, ComponentFixture, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { configureTestSuite } from '../../test-utils/configure-suite';
import { UIInteractions, wait } from '../../test-utils/ui-interactions.spec';
import { DataParent } from '../../test-utils/sample-test-data.spec';

import { IgxGridModule } from './grid.module';
import { IgxGridComponent } from './grid.component';
import { IgxColumnComponent } from '../column.component';
import { IRowDragStartEventArgs, IRowDragEndEventArgs } from '../grid-base.component';
import { IgxDropDirective } from '../../directives/dragdrop/dragdrop.directive';
import { IgxGridRowComponent } from './grid-row.component';
import { Point } from '../../services';

const CSS_CLASS_DRAG_INDICATOR = 'igx-grid__tr--drag-indicator';
const CSS_CLASS_GRID_ROW = 'igx-grid__tr';

describe('IgxGrid - Row Drag', () => {
    let fixture: ComponentFixture<IgxGridRowDraggableComponent>;
    let grid: IgxGridComponent;
    let dropArea: IgxDropDirective;
    let dropAreaElement;
    let rows: IgxGridRowComponent[];
    let dragIndicatorElements: DebugElement[];
    configureTestSuite();

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [
                IgxGridRowDraggableComponent
            ],
            imports: [
                FormsModule,
                NoopAnimationsModule,
                IgxGridModule
            ]
        }).compileComponents();
    }));

    afterEach(() => {
        UIInteractions.clearOverlay();
    });

    fdescribe('', () => {
        beforeEach(async(() => {
            fixture = TestBed.createComponent(IgxGridRowDraggableComponent);
            grid = fixture.componentInstance.instance;
            dropArea = fixture.componentInstance.dropArea;
            fixture.detectChanges();
            rows = grid.rowList.toArray();
            dropAreaElement = fixture.debugElement.query(By.css('.dropable-area')).nativeElement;
            dragIndicatorElements = fixture.debugElement.queryAll(By.css('.' + CSS_CLASS_DRAG_INDICATOR));
        }));
        configureTestSuite();

        it('should drag and drop draggable row over droppable container', fakeAsync(() => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[2];

            const startPoint = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');
            const dragStartArgs: IRowDragStartEventArgs = {
                source: row,
                cancel: false
            };
            const dragEndArgs: IRowDragEndEventArgs = {
                source: row
            };

            UIInteractions.simulatePointerEvent('pointerdown', dragIndicatorElement, startPoint.x, startPoint.y);
            fixture.detectChanges();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            // expect(grid.onRowDragStart.emit).toHaveBeenCalledWith(dragStartArgs);
            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, movePoint.x, movePoint.y);
            tick(50);
            fixture.detectChanges();
            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, dropPoint.x, dropPoint.y);
            tick(50);
            fixture.detectChanges();
            UIInteractions.simulatePointerEvent('pointerup', dragIndicatorElement, dropPoint.x, dropPoint.y);
            fixture.detectChanges();
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
            // expect(grid.onRowDragEnd.emit).toHaveBeenCalledWith(dragEndArgs);
        }));

        it('should be able to drag row only by drag icon', fakeAsync(() => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[2];
            const rowElement = row.nativeElement;

            const dragIndicatorPoint = UIInteractions.getPointFromElement(dragIndicatorElement);
            const rowPoint = UIInteractions.getPointFromElement(rowElement);
            spyOn(grid.onRowDragStart, 'emit');
            const dragStartArgs: IRowDragStartEventArgs = {
                source: row,
                cancel: false
            };

            UIInteractions.simulatePointerEvent('pointerdown', rowElement, rowPoint.x, rowPoint.y);
            fixture.detectChanges();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(0);

            UIInteractions.simulatePointerEvent('pointerdown', dragIndicatorElement, dragIndicatorPoint.x, dragIndicatorPoint.y);
            fixture.detectChanges();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            // expect(grid.onRowDragStart.emit).toHaveBeenCalledWith(dragStartArgs);
        }));

        it('should emit drop events', fakeAsync(() => {
            const dragIndicatorElement = dragIndicatorElements[2].nativeElement;
            const row = rows[2];

            const startPoint = UIInteractions.getPointFromElement(dragIndicatorElement);
            const movePoint = UIInteractions.getPointFromElement(rows[4].nativeElement);
            const dropPoint = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(dropArea.onEnter, 'emit');
            spyOn(dropArea.onLeave, 'emit');
            // spyOn(dropArea.onDrop, 'emit');
            spyOn(dropArea, 'onDragEnter').and.callThrough();
            spyOn(dropArea, 'onDragLeave').and.callThrough();
            spyOn(dropArea, 'onDragOver').and.callThrough();
            // spyOn(dropArea, 'onDragDrop').and.callThrough();
            // const dropEnterArgs: IgxDropEnterEventArgs = {
            //     owner: dropArea,
            //     drag: rowDragDirective,
            //     dragData: row,
            //     startX: 0,
            //     startY: 0,
            //     pageX: 0,
            //     pageY: 0
            // };

            UIInteractions.simulatePointerEvent('pointerdown', dragIndicatorElement, startPoint.x, startPoint.y);
            fixture.detectChanges();
            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, movePoint.x, movePoint.y);
            tick(50);
            fixture.detectChanges();
            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, dropPoint.x, dropPoint.y);
            tick(50);
            fixture.detectChanges();
            UIInteractions.simulatePointerEvent('pointerup', dragIndicatorElement, dropPoint.x, dropPoint.y);
            fixture.detectChanges();
            expect(dropArea.onEnter.emit).toHaveBeenCalledTimes(1);
            expect(dropArea.onDragEnter).toHaveBeenCalledTimes(1);
            expect(dropArea.onLeave.emit).toHaveBeenCalledTimes(1);
            expect(dropArea.onDragLeave).toHaveBeenCalledTimes(1);
            expect(dropArea.onDragOver).toHaveBeenCalledTimes(1);
            // expect(dropArea.onEnter.emit).toHaveBeenCalledWith(dropEnterArgs);
        }));

        xit('Start dragging programmatically using API.', (async () => {


        }));

        it('Should cancel dragging when ESCAPE key is pressed.', (async () => {

        }));

        it('Should align horizontal scrollbar with first not pinned data cell', fakeAsync(() => {
            // has no draggable rows and has no selectable rows
            grid.rowSelectable = false;
            grid.rowDrag = false;
            tick();
            fixture.detectChanges();
            let rowSelectElement: DebugElement = fixture.debugElement.query(By.css('.igx-grid__cbx-selection'));
            let dragIndicatorElement: DebugElement = fixture.debugElement.query(By.css('igx-grid__tr--drag-indicator'));
            let horizontalScrollbarElement: DebugElement = fixture.debugElement.query(By.css('.igx-vhelper--horizontal'));
            expect(rowSelectElement).toBeNull();
            expect(dragIndicatorElement).toBeNull();

            // has draggable rows and has no selectable rows
            grid.rowSelectable = false;
            grid.rowDrag = true;
            tick();
            fixture.detectChanges();
            rowSelectElement = fixture.debugElement.query(By.css('.igx-grid__cbx-selection'));
            dragIndicatorElement = fixture.debugElement.query(By.css('igx-grid__tr--drag-indicator'));
            horizontalScrollbarElement = fixture.debugElement.query(By.css('.igx-vhelper--horizontal'));
            let dragIndicatorRect = dragIndicatorElement.nativeElement.getBoundingClientRect();
            let horizontalScrollbarRect = horizontalScrollbarElement.nativeElement.getBoundingClientRect();
            expect(rowSelectElement).toBeNull();
            expect(dragIndicatorRect.right).toBe(horizontalScrollbarRect.left);

            // has draggable rows and has selectable rows
            grid.rowSelectable = true;
            grid.rowDrag = true;
            fixture.detectChanges();
            rowSelectElement = fixture.debugElement.query(By.css('.igx-grid__cbx-selection'));
            dragIndicatorElement = fixture.debugElement.query(By.css('igx-grid__tr--drag-indicator'));
            horizontalScrollbarElement = fixture.debugElement.query(By.css('.igx-vhelper--horizontal'));
            let rowSelectRect = rowSelectElement.nativeElement.getBoundingClientRect();
            horizontalScrollbarRect = horizontalScrollbarElement.nativeElement.getBoundingClientRect();
            expect(rowSelectRect.right).toBe(horizontalScrollbarRect.left);
        }));

        it('Should fire onDragStart and onDragEnd with correct values of event arguments.', (async () => {
            const rowToDrag: IgxGridRowComponent = rows[2];
            const dragIndicatorElement: Element = dragIndicatorElements[rowToDrag.index].nativeElement;

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const endPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit').and.callThrough();
            spyOn(grid.onRowDragEnd, 'emit').and.callThrough();

            UIInteractions.simulatePointerEvent('pointerdown', dragIndicatorElement, startPoint.x, startPoint.y);
            await wait();
            fixture.detectChanges();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragStart.emit).toHaveBeenCalledWith({
                source: jasmine.any(IgxGridRowComponent),
                cancel: false
            });

            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();

            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();

            UIInteractions.simulatePointerEvent('pointerup', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(1);
            expect(grid.onRowDragEnd.emit).toHaveBeenCalledWith({
                source: jasmine.any(IgxGridRowComponent)
            });
        }));

        it('Should be able to cancel onRowDragStart event.', (async () => {
            grid.onRowDragStart.subscribe((e: IRowDragStartEventArgs) => {
                e.cancel = true;
            });
            const rowToDrag: IgxGridRowComponent = rows[2];
            const dragIndicatorElement: Element = dragIndicatorElements[rowToDrag.index].nativeElement;

            const startPoint: Point = UIInteractions.getPointFromElement(dragIndicatorElement);
            const endPoint: Point = UIInteractions.getPointFromElement(dropAreaElement);

            spyOn(grid.onRowDragStart, 'emit');
            spyOn(grid.onRowDragEnd, 'emit');

            UIInteractions.simulatePointerEvent('pointerdown', dragIndicatorElement, startPoint.x, startPoint.y);
            await wait();
            fixture.detectChanges();
            expect(grid.onRowDragStart.emit).toHaveBeenCalledTimes(1);

            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();

            UIInteractions.simulatePointerEvent('pointermove', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();

            UIInteractions.simulatePointerEvent('pointerup', dragIndicatorElement, endPoint.x, endPoint.y);
            await wait();
            fixture.detectChanges();

            expect(grid.onRowDragEnd.emit).toHaveBeenCalledTimes(0);
        }));

        it('Multi-row layout integration.', (async () => {

        }));

    });
});

@Component({
    template: `
        <igx-grid
            [width]='width'
            [height]='height'
            [data]="data"
            [autoGenerate]="true" (onColumnInit)="columnsCreated($event)" (onGroupingDone)="onGroupingDoneHandler($event)"
            [rowEditable]="true" [rowDrag]="enableRowDraggable"
            (onRowDragStart)="handleRowDrag($event)"
            (onRowDragEnd)="handleRowDrop($event)">
        </igx-grid>
        <div #dropArea class="dropable-area" igxDrop [ngStyle]="{width:'100px', height:'100px', backgroundColor:'red'}"></div>
    `
})
export class IgxGridRowDraggableComponent extends DataParent {
    public width = '800px';
    public height = null;

    @ViewChild(IgxGridComponent, { read: IgxGridComponent })
    public instance: IgxGridComponent;

    @ViewChild('dropArea', { read: IgxDropDirective })
    public dropArea: IgxDropDirective;

    public enableSorting = false;
    public enableFiltering = false;
    public enableResizing = false;
    public enableEditing = true;
    public enableGrouping = true;
    public enableRowEditing = true;
    public enableRowDraggable = true;
    public currentSortExpressions;

    public columnsCreated(column: IgxColumnComponent) {
        column.sortable = this.enableSorting;
        column.filterable = this.enableFiltering;
        column.resizable = this.enableResizing;
        column.editable = this.enableEditing;
        column.groupable = this.enableGrouping;
    }
    public onGroupingDoneHandler(sortExpr) {
        this.currentSortExpressions = sortExpr;
    }
    handleRowDrag(args) {
        console.log('RowDrag started!');
    }

    handleRowDrop(args) {
        console.log('Row Drag End!');
    }
}

function getElementsCenterCoordinates(element: Element) {
    const x = element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
    const y = element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;
    return { x: x, y: y };
}
