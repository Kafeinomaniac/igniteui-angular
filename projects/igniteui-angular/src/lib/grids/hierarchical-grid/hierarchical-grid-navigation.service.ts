import { IgxGridNavigationService } from '../grid-navigation.service';
import { IgxHierarchicalGridComponent } from './hierarchical-grid.component';
import { first } from 'rxjs/operators';

export class IgxHierarchicalGridNavigationService extends IgxGridNavigationService {
    public grid: IgxHierarchicalGridComponent;

    protected getCellSelector(visibleIndex?: number) {
       return 'igx-hierarchical-grid-cell';
    }

    protected getRowSelector() {
        return 'igx-hierarchical-grid-row';
    }

    protected getRowByIndex(index) {
        const selector = this.getRowSelector();
        const rows = Array.from(this.grid.nativeElement.querySelectorAll(
            `${selector}[data-rowindex="${index}"]`));
        let row;
        rows.forEach((r) => {
            const parentGrid = this.getClosestElemByTag(r, 'igx-hierarchical-grid');
            if (parentGrid && parentGrid.getAttribute('id') === this.grid.id) {
                    row = r;
            }
        });
        return row;
    }

    private getChildContainer(grid?) {
        const currGrid = grid || this.grid;
        return currGrid.nativeElement.parentNode.parentNode.parentNode;
    }

    private getChildGridRowContainer(grid?) {
        const currGrid = grid || this.grid;
        return currGrid.nativeElement.parentNode.parentNode;
    }

    private getChildGrid(childGridID, grid) {
        const cgrid = grid.hgridAPI.getChildGrids(true).filter((g) => g.id === childGridID)[0];
        return cgrid;
    }

    private _isScrolledToBottom(grid) {
        const scrollTop = grid.verticalScrollContainer.getVerticalScroll().scrollTop;
        const scrollHeight = grid.verticalScrollContainer.getVerticalScroll().scrollHeight;
        return scrollHeight === 0 || Math.round(scrollTop +  grid.verticalScrollContainer.igxForContainerSize) === scrollHeight;
    }
    private getIsChildAtIndex(index) {
        return this.grid.isChildGridRecord(this.grid.verticalScrollContainer.igxForOf[index]);
    }

    public getCellElementByVisibleIndex(rowIndex, visibleColumnIndex) {
        const cellSelector = this.getCellSelector(visibleColumnIndex);
        const row = this.getRowByIndex(rowIndex);
        return row.querySelector(
            `${cellSelector}[data-rowindex="${rowIndex}"][data-visibleIndex="${visibleColumnIndex}"]`);
    }

    public navigateUp(rowElement, currentRowIndex, visibleColumnIndex) {
        const prevElem = rowElement.previousElementSibling;
        if (prevElem) {
            const nodeName =  prevElem.children[0].nodeName.toLowerCase();
            const isElemChildGrid =  nodeName.toLowerCase() === 'igx-child-grid-row';
            if (isElemChildGrid) {
                this.focusPrevChild(prevElem, visibleColumnIndex, this.grid);
            } else {
                if (this.grid.parent !== null) {
                    // currently navigating in child grid
                    this._navigateUpInChild(rowElement, currentRowIndex, visibleColumnIndex);
                } else {
                    super.navigateUp(rowElement, currentRowIndex, visibleColumnIndex);
                }
            }
        } else if (currentRowIndex !== 0) {
            // handle scenario when prev item is child grid but is not yet in view
            const isPrevChildGrid = this.getIsChildAtIndex(currentRowIndex - 1);
            if (!isPrevChildGrid) {
                super.navigateUp(rowElement, currentRowIndex, visibleColumnIndex);
            } else {
                this.scrollGrid(this.grid, -rowElement.offsetHeight,
                    () => {
                        rowElement = this.getRowByIndex(currentRowIndex);
                        this.navigateUp(rowElement, currentRowIndex, visibleColumnIndex);
                    });
            }
        } else if (this.grid.parent !== null &&
            currentRowIndex === 0) {
                // move to prev row in sibling layout or parent
                this.focusPrev(visibleColumnIndex);
        }
    }
    public navigateDown(rowElement, currentRowIndex, visibleColumnIndex) {
        const nextElem = rowElement.nextElementSibling;
        if (nextElem) {
            // next elem is in DOM
            const nodeName =  nextElem.children[0].nodeName.toLowerCase();
            const isNextElemChildGrid =  nodeName.toLowerCase() === 'igx-child-grid-row';
            if (isNextElemChildGrid) {
                this.focusNextChild(nextElem, visibleColumnIndex, this.grid);
            } else {
                if (this.grid.parent !== null) {
                    // currently navigating in child grid
                    this._navigateDownInChild(rowElement, currentRowIndex, visibleColumnIndex);
                } else {
                    super.navigateDown(rowElement, currentRowIndex, visibleColumnIndex);
                }
            }
        } else if (currentRowIndex !== this.grid.verticalScrollContainer.igxForOf.length - 1) {
             // scroll next in view
             super.navigateDown(rowElement, currentRowIndex, visibleColumnIndex);
        } else if (this.grid.parent !== null &&
            currentRowIndex === this.grid.verticalScrollContainer.igxForOf.length - 1) {
                // move to next row in sibling layout or in parent
                this.focusNext(visibleColumnIndex);
        }
    }

    public navigateTop(visibleColumnIndex) {
        if (this.grid.parent !== null) {
            // navigating in child
            const verticalScroll = this.grid.verticalScrollContainer.getVerticalScroll();
            const cellSelector = this.getCellSelector(visibleColumnIndex);

            if (verticalScroll.scrollTop === 0) {
                this._focusScrollCellInView(visibleColumnIndex);
            } else {
                this.scrollGrid(this.grid, 'top',
                () => {
                    const cells = this.grid.nativeElement.querySelectorAll(
                        `${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
                    if (cells.length > 0) {
                        this._focusScrollCellInView(visibleColumnIndex);
                     }
                });
            }

        } else {
            super.navigateTop(visibleColumnIndex);
        }
    }

    public navigateBottom(visibleColumnIndex) {
        // handle scenario where last index is child grid
        // in that case focus cell in last data row
        const lastIndex = this.grid.verticalScrollContainer.igxForOf.length - 1;
        if (this.getIsChildAtIndex(lastIndex)) {
            const targetIndex = lastIndex - 1;
            const scrTopPosition = this.grid.verticalScrollContainer.getScrollForIndex(targetIndex, true);
            const verticalScroll = this.grid.verticalScrollContainer.getVerticalScroll();
            const cellSelector = this.getCellSelector(visibleColumnIndex);
            if (verticalScroll.scrollTop === scrTopPosition) {
                const cells = this.getRowByIndex(targetIndex).querySelectorAll(
                    `${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
                cells[cells.length - 1].focus();
            } else {
                this.scrollGrid(this.grid, scrTopPosition - verticalScroll.scrollTop,
                () => {
                    const cells = this.getRowByIndex(targetIndex).querySelectorAll(
                        `${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
                    if (cells.length > 0) { cells[cells.length - 1].focus(); }
                });
            }
        } else {
            super.navigateBottom(visibleColumnIndex);
        }
    }
    public goToLastCell() {
        // handle scenario where last index is child grid
        // in that case focus last cell in last data row
        const lastIndex = this.grid.verticalScrollContainer.igxForOf.length - 1;
        if (this.getIsChildAtIndex(lastIndex)) {
            const targetIndex = lastIndex - 1;
            const scrTopPosition = this.grid.verticalScrollContainer.getScrollForIndex(targetIndex, true);
            const verticalScroll = this.grid.verticalScrollContainer.getVerticalScroll();
            if (verticalScroll.scrollTop === scrTopPosition) {
                this.onKeydownEnd(targetIndex);
            } else {
                this.scrollGrid(this.grid, scrTopPosition - verticalScroll.scrollTop,
                    () => {
                        this.onKeydownEnd(targetIndex);
                    });
            }
        } else {
            super.goToLastCell();
        }
    }

    public onKeydownEnd(rowIndex) {
        if (this.grid.parent) {
            // handle scenario where last child row might not be in view
            // parent should scroll to child grid end
            const childContainer = this.grid.nativeElement.parentNode.parentNode;
            const diff =
            childContainer.getBoundingClientRect().bottom - this.grid.rootGrid.nativeElement.getBoundingClientRect().bottom;
            const endIsVisible = diff < 0;
            if (!endIsVisible) {
                this.scrollGrid(this.grid.parent, diff, () => super.onKeydownEnd(rowIndex));
            } else {
                super.onKeydownEnd(rowIndex);
            }
        } else {
            super.onKeydownEnd(rowIndex);
        }

    }

    public goToFirstCell() {
        const verticalScroll = this.grid.verticalScrollContainer.getVerticalScroll();
        const horizontalScroll = this.grid.dataRowList.first.virtDirRow.getHorizontalScroll();
        if (verticalScroll.scrollTop === 0 && this.grid.parent) {
            // scroll parent so that current child is in view
            if (!horizontalScroll.clientWidth || parseInt(horizontalScroll.scrollLeft, 10) <= 1 || this.grid.pinnedColumns.length) {
                this.navigateTop(0);
            } else {
                this.horizontalScroll(this.grid.dataRowList.first.index).scrollTo(0);
                this.grid.parentVirtDir.onChunkLoad
                    .pipe(first())
                    .subscribe(() => {
                        this.navigateTop(0);
                    });
            }
        } else {
            super.goToFirstCell();
        }
    }

    public performTab(currentRowEl, rowIndex, visibleColumnIndex) {
        if (!this.grid.rowList.find(row => row.index === rowIndex + 1) && this.grid.parent &&
        this.grid.unpinnedColumns[this.grid.unpinnedColumns.length - 1].visibleIndex === visibleColumnIndex) {
            this.navigateDown(currentRowEl, rowIndex, 0);
        } else {
            super.performTab(currentRowEl, rowIndex, visibleColumnIndex);
        }
    }
    public performShiftTabKey(currentRowEl, rowIndex, visibleColumnIndex) {
        if (visibleColumnIndex === 0 && rowIndex === 0 && this.grid.parent) {
            if (this.grid.allowFiltering) {
                this.moveFocusToFilterCell();
            } else {
                const prevSiblingChild = this.getChildGridRowContainer().previousElementSibling;
                if (prevSiblingChild) {
                    const gridElem = prevSiblingChild.querySelectorAll('igx-hierarchical-grid')[0];
                    const prevGridCols = this.getChildGrid(gridElem.getAttribute('id'), this.grid.parent).unpinnedColumns;
                    this.navigateUp(currentRowEl, rowIndex, prevGridCols[prevGridCols.length - 1].visibleIndex);
                } else {
                    this.navigateUp(currentRowEl, rowIndex,
                        this.grid.parent.unpinnedColumns[this.grid.parent.unpinnedColumns.length - 1].visibleIndex);
                }
            }
        } else {
            super.performShiftTabKey(currentRowEl, rowIndex, visibleColumnIndex);
        }
    }

    private _focusScrollCellInView(visibleColumnIndex) {
        const cellSelector = this.getCellSelector(visibleColumnIndex);
        const cells = this.grid.nativeElement.querySelectorAll(
            `${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
        const cell = cells[0];
        const childContainer = this.grid.nativeElement.parentNode.parentNode;
        const scrTop = this.grid.parent.verticalScrollContainer.getVerticalScroll().scrollTop;
        if (scrTop === 0) {
            // cell is in view
            cell.focus({preventScroll: true});
        } else {
            // scroll parent so that cell is in view
            const dc = childContainer.parentNode.parentNode;
            const scrWith = parseInt(dc.style.top, 10);
            this.scrollGrid(this.grid.parent, scrWith , () => cell.focus({preventScroll: true}));
        }
    }

    private focusNextChild(elem, visibleColumnIndex, grid) {
        const gridElem = elem.querySelector('igx-hierarchical-grid');
        const childGridID = gridElem.getAttribute('id');
        const childGrid = this.getChildGrid(childGridID, grid);
        if (childGrid.rowList.toArray().length === 0) {
            this.focusNext(visibleColumnIndex, childGrid);
            return;
        }
        if (childGrid.verticalScrollContainer.state.startIndex !== 0) {
            // scroll to top
            this.scrollGrid(childGrid, 'top', () => this.focusNextRow(elem, visibleColumnIndex, childGrid));
        } else {
            this.focusNextRow(elem, visibleColumnIndex, childGrid);
        }
    }
    private focusPrevChild(elem, visibleColumnIndex, grid) {
        const grids = [];
        const gridElems = Array.from(elem.querySelectorAll('igx-hierarchical-grid'));
        const childLevel = grid.childLayoutList.first.level;
        gridElems.forEach((hg) => {
            const parentRow = this.getClosestElemByTag(hg, 'igx-child-grid-row');
            if (parentRow && parseInt(parentRow.getAttribute('data-level'), 10) === childLevel) {
                grids.push(hg);
            }
        });
        const gridElem = grids[grids.length - 1];
        const childGridID = gridElem.getAttribute('id');
        const childGrid = this.getChildGrid(childGridID, grid);
        if (childGrid.rowList.toArray().length === 0) {
            this.focusPrev(visibleColumnIndex, childGrid);
            return;
        }
        const isScrolledToBottom = this._isScrolledToBottom(childGrid);
        const lastIndex = childGrid.verticalScrollContainer.igxForOf.length - 1;
        if (!isScrolledToBottom) {
            // scroll to end
            this.scrollGrid(childGrid, 'bottom', () => this.focusPrevChild(elem, visibleColumnIndex, grid));
        } else {
            const lastRowInChild = childGrid.getRowByIndex(lastIndex);
            const isChildGrid = lastRowInChild.nativeElement.nodeName.toLowerCase() === 'igx-child-grid-row';
            if (isChildGrid) {
                this.focusPrevChild(lastRowInChild.nativeElement.parentNode, visibleColumnIndex, childGrid);
            } else {
                this.focusPrevRow(lastRowInChild.nativeElement, visibleColumnIndex, childGrid, true);
            }
        }
    }
    private focusPrev(visibleColumnIndex, grid?) {
        const currGrid = grid || this.grid;
        let parentContainer = this.getChildContainer(currGrid);
        let childRowContainer = this.getChildGridRowContainer(currGrid);
        const prevIsSiblingChild = !!childRowContainer.previousElementSibling;
        let prev = childRowContainer.previousElementSibling || parentContainer.previousElementSibling;
        if (prev) {
            if (prevIsSiblingChild) {
                this.focusPrevChild(prev, visibleColumnIndex, currGrid.parent);
            } else {
                this.focusPrevRow(prev, visibleColumnIndex, currGrid.parent);
            }
        } else {
            this.scrollGrid(currGrid.parent, 'prev',
            () => {
            parentContainer = this.getChildContainer(grid);
            childRowContainer = this.getChildGridRowContainer(grid);
            prev = childRowContainer.previousElementSibling || parentContainer.previousElementSibling;
            if (prevIsSiblingChild) {
                this.focusPrevChild(prev, visibleColumnIndex, currGrid.parent);
            } else {
                this.focusPrevRow(prev, visibleColumnIndex, currGrid.parent);
            }
            });
        }
    }

    private getNextParentInfo(grid) {
        // find next parent that is not at bottom
        let currGrid = grid.parent;
        let nextElem = this.getChildContainer(grid).nextElementSibling;
        while (!nextElem && currGrid.parent !== null) {
            nextElem = this.getChildContainer(currGrid).nextElementSibling;
            currGrid = currGrid.parent;
        }

        return { grid: currGrid, nextElement: nextElem};
    }
    private getNextScrollable(grid) {
        let currGrid = grid.parent;
        if (!currGrid) {
            return {grid: grid, prev: null };
        }
        let nonScrollable = currGrid.verticalScrollContainer.getVerticalScroll().scrollTop === 0;
        let prev = grid;
        while (nonScrollable && currGrid.parent !== null) {
            prev = currGrid;
            currGrid = currGrid.parent;
            nonScrollable = currGrid.verticalScrollContainer.getVerticalScroll().scrollTop === 0;
        }
        return {grid: currGrid, prev: prev };
    }

    private focusNext(visibleColumnIndex, grid?) {
        const currGrid = grid || this.grid;
        const parentInfo = this.getNextParentInfo(currGrid);
        const nextParentGrid = parentInfo.grid;
        let nextParentElem = parentInfo.nextElement;
        let childRowContainer = this.getChildGridRowContainer(currGrid);
        const nextIsSiblingChild = !!childRowContainer.nextElementSibling;
        let next = childRowContainer.nextElementSibling || nextParentElem;
        const verticalScroll = nextParentGrid.verticalScrollContainer.getVerticalScroll();
        if (next) {
            if (nextIsSiblingChild) {
                this.focusNextChild(next, visibleColumnIndex, nextParentGrid);
            } else {
                this.focusNextRow(next, visibleColumnIndex, nextParentGrid);
            }
        } else if (verticalScroll.scrollTop !==
            verticalScroll.scrollHeight - nextParentGrid.verticalScrollContainer.igxForContainerSize ) {
            this.scrollGrid(nextParentGrid, 'next',
            () => {
                nextParentElem = parentInfo.nextElement;
                childRowContainer = this.getChildGridRowContainer();
                next = childRowContainer.nextElementSibling || nextParentElem;
                if (next && nextIsSiblingChild) {
                    this.focusNextChild(next, visibleColumnIndex, nextParentGrid);
                } else if (next) {
                    this.focusNextRow(next, visibleColumnIndex, nextParentGrid);
                }
            });
        }
    }
    private getNextScrollableDown(grid) {
        let currGrid = grid.parent;
        if (!currGrid) {
            return {grid: grid, prev: null };
        }
        let scrollTop = currGrid.verticalScrollContainer.getVerticalScroll().scrollTop;
        let scrollHeight = currGrid.verticalScrollContainer.getVerticalScroll().scrollHeight;
        let nonScrollable = scrollHeight === 0 ||
        Math.round(scrollTop +  currGrid.verticalScrollContainer.igxForContainerSize) === scrollHeight;
        let prev = grid;
        while (nonScrollable && currGrid.parent !== null) {
            prev = currGrid;
            currGrid = currGrid.parent;
            scrollTop = currGrid.verticalScrollContainer.getVerticalScroll().scrollTop;
            scrollHeight = currGrid.verticalScrollContainer.getVerticalScroll().scrollHeight;
            nonScrollable = scrollHeight === 0 ||
            Math.round(scrollTop +  currGrid.verticalScrollContainer.igxForContainerSize) === scrollHeight;
        }
        return {grid: currGrid, prev: prev };
    }

    private _getMinBottom(grid) {
        let currGrid = grid;
        let bottom = currGrid.tbody.nativeElement.getBoundingClientRect().bottom;
        while (currGrid.parent) {
            currGrid = currGrid.parent;
            bottom = Math.min(bottom, currGrid.tbody.nativeElement.getBoundingClientRect().bottom);
        }
        return bottom;
    }

    private _getMaxTop(grid) {
        let currGrid = grid;
        let top = currGrid.tbody.nativeElement.getBoundingClientRect().top;
        while (currGrid.parent) {
            currGrid = currGrid.parent;
            top = Math.max(top, currGrid.tbody.nativeElement.getBoundingClientRect().top);
        }
        return top;
    }

    private focusNextRow(elem, visibleColumnIndex, grid) {
        const cellSelector = this.getCellSelector(visibleColumnIndex);
        if (grid.navigation.isColumnFullyVisible(visibleColumnIndex) && grid.navigation.isColumnLeftFullyVisible(visibleColumnIndex)) {
            const cell =
            elem.querySelector(`${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
            const closestScrollableGrid = this.getNextScrollableDown(grid).grid;
            // const diff = cell.getBoundingClientRect().bottom - grid.rootGrid.tbody.nativeElement.getBoundingClientRect().bottom;
            const gridBottom = this._getMinBottom(grid);
            const diff = cell.getBoundingClientRect().bottom - gridBottom;
            const inView =  diff <= 0;
            if (!inView) {
                this.scrollGrid(closestScrollableGrid, diff, () => cell.focus({ preventScroll: true }));
            } else {
                cell.focus({ preventScroll: true });
            }
        } else {
            const cellElem = elem.querySelector(`${cellSelector}`);
            const rowIndex = parseInt(cellElem.getAttribute('data-rowindex'), 10);
            grid.navigation.performHorizontalScrollToCell(rowIndex, visibleColumnIndex);
        }
    }

    private focusPrevRow(elem, visibleColumnIndex, grid, inChild?) {
        if (grid.navigation.isColumnFullyVisible(visibleColumnIndex) && grid.navigation.isColumnLeftFullyVisible(visibleColumnIndex)) {
            const cellSelector = this.getCellSelector(visibleColumnIndex);
            const cells =  elem.querySelectorAll(`${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`);
            let cell = cells[cells.length - 1];
            const rIndex = parseInt(elem.getAttribute('data-rowindex'), 10);
            const scrGrid = grid.verticalScrollContainer.getVerticalScroll().scrollTop !== 0 ? grid :
             this.getNextScrollable(grid).grid;
            const topGrid = scrGrid.tbody.nativeElement.getBoundingClientRect().top >
            grid.rootGrid.tbody.nativeElement.getBoundingClientRect().top ? scrGrid : grid.rootGrid;
            const gridTop = this._getMaxTop(grid);
            const scrTop = scrGrid.verticalScrollContainer.getVerticalScroll().scrollTop;
            const diff = cell.getBoundingClientRect().bottom -
            cell.offsetHeight - gridTop;
            if (scrTop !== 0 && diff < 0 && !inChild) {
                this.scrollGrid(scrGrid, diff, () => {
                    const el = grid.navigation.getRowByIndex(rIndex);
                    cell = el.querySelectorAll(`${cellSelector}[data-visibleIndex="${visibleColumnIndex}"]`)[0];
                    cell.focus({ preventScroll: true });
                });
            } else if (diff < 0 && inChild) {
                this.scrollGrid(topGrid, diff, () => {
                    cell.focus({ preventScroll: true });
                });
            } else {
                cell.focus({ preventScroll: true });
            }
        } else {
            this.horizontalScrollGridToIndex(grid, visibleColumnIndex, () => {
                this.focusPrevRow(elem, visibleColumnIndex, grid, inChild);
            });
        }
    }

    private horizontalScrollGridToIndex(grid, visibleColumnIndex, callBackFunc) {
        const unpinnedIndex = this.getColumnUnpinnedIndex(visibleColumnIndex);
        grid.parentVirtDir.onChunkLoad
            .pipe(first())
            .subscribe(callBackFunc);
        grid.dataRowList.toArray()[0].virtDirRow.scrollTo(unpinnedIndex);
    }
    private scrollGrid(grid, target, callBackFunc) {
        grid.nativeElement.focus({preventScroll: true});
        requestAnimationFrame(() => {
            if (typeof target === 'number') {
                grid.verticalScrollContainer.addScrollTop(target);
            } else {
                switch (target) {
                    case 'top' : grid.verticalScrollContainer.scrollTo(0); break;
                    case 'bottom' : grid.verticalScrollContainer.scrollTo(grid.verticalScrollContainer.igxForOf.length - 1); break;
                    case 'next' :  grid.verticalScrollContainer.scrollNext(); break;
                    case 'prev' :  grid.verticalScrollContainer.scrollPrev(); break;
                }
            }
            grid.verticalScrollContainer.onChunkLoad
                .pipe(first())
                .subscribe(callBackFunc);
        });
    }

    private _navigateUpInChild(rowElement, currentRowIndex, visibleColumnIndex) {
        const prevElem = rowElement.previousElementSibling;
        const scrollable = this.getNextScrollable(this.grid);
        const grid = scrollable.grid;
        const scrTop = grid.verticalScrollContainer.getVerticalScroll().scrollTop;
        const containerTop = scrollable.prev.nativeElement.parentNode.parentNode.parentNode.parentNode;
        const top = parseInt(containerTop.style.top, 10);
        if (scrTop !== 0 && top < 0) {
            this.scrollGrid(grid, -prevElem.offsetHeight,
                () => super.navigateUp(rowElement, currentRowIndex, visibleColumnIndex));
        } else {
            super.navigateUp(rowElement, currentRowIndex, visibleColumnIndex);
        }
    }

    private _navigateDownInChild(rowElement, currentRowIndex, visibleColumnIndex) {
        const nextElem = rowElement.nextElementSibling;
        const childContainer = this.grid.nativeElement.parentNode.parentNode;
        const diff =
        childContainer.getBoundingClientRect().bottom - this.grid.rootGrid.nativeElement.getBoundingClientRect().bottom;
        const endIsVisible = diff < 0;
        const scrollable = this.getNextScrollableDown(this.grid);
        const grid = scrollable.grid;
        if (!endIsVisible) {
            this.scrollGrid(grid, nextElem.offsetHeight,
                () => super.navigateDown(rowElement, currentRowIndex, visibleColumnIndex));
        } else {
            super.navigateDown(rowElement, currentRowIndex, visibleColumnIndex);
        }
    }

    private getClosestElemByTag(sourceElem, targetTag) {
        let result = sourceElem;
        while (result !== null && result.nodeType === 1) {
            if (result.tagName.toLowerCase() === targetTag.toLowerCase()) {
                return result;
            }
            result = result.parentNode;
        }
        return null;
    }
}
