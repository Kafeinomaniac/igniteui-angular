import { Pipe, PipeTransform } from '@angular/core';
import { IgxTreeGridAPIService } from './tree-grid-api.service';
import { GridBaseAPIService } from '../api.service';
import { IgxGridBaseComponent } from '../grid-base.component';
import { ITreeGridRecord } from './tree-grid.interfaces';
import { IgxTreeGridComponent } from './tree-grid.component';
import { IgxSummaryResult } from '../summaries/grid-summary';

/** @hidden */
@Pipe({
    name: 'treeGridSummary',
    pure: true
})
export class IgxTreeGridSummaryPipe implements PipeTransform {
    private gridAPI: IgxTreeGridAPIService;

    constructor(gridAPI: GridBaseAPIService<IgxGridBaseComponent>) {
        this.gridAPI = <IgxTreeGridAPIService>gridAPI;
     }

    public transform(flatData: ITreeGridRecord[],
        id: string, pipeTrigger: number): ITreeGridRecord[] {
        const grid: IgxTreeGridComponent = this.gridAPI.get(id);

        return this.addSummaryRows(grid, flatData);
    }

    private addSummaryRows(grid: IgxTreeGridComponent, collection: ITreeGridRecord[]): any[] {
        const recordsWithSummary = [];
        const summariesMap = new Map<any, Map<string, IgxSummaryResult[]>[]>();

        for (let i = 0; i < collection.length; i++) {
            const record = collection[i];
            recordsWithSummary.push(record);

            if (record.children && record.children.length > 0 && record.expanded) {
                // TODO Call the SummaryService to get the summaries
                // const childData = record.children.map(r => r.data);
                // const summaries = grid.summaryService.calculateSummaries(record.rowID, childData);
                const summaries = new Map<string, IgxSummaryResult[]>();
                const summaryResults: IgxSummaryResult[] = [];
                summaryResults.push({key: 'count', label: 'Count', summaryResult: 20 });
                summaries.set('ID', summaryResults);

                if (summaries) {
                    // recordsWithSummary.push(summaries);

                    let lastChild = record;
                    do {
                        lastChild = lastChild.children[lastChild.children.length - 1];
                    }
                    while (lastChild.children && lastChild.children.length > 0 && lastChild.expanded);

                    let summaryRows = summariesMap.get(lastChild.rowID);
                    if (!summaryRows) {
                        summaryRows = [];
                        summariesMap.set(lastChild.rowID, summaryRows);
                    }
                    summaryRows.push(summaries);
                }
            }

            if (summariesMap.has(record.rowID)) {
                const summaryRows = summariesMap.get(record.rowID);

                for (let j = 0; j < summaryRows.length; j++) {
                    const summaryRow = summaryRows[j];
                    recordsWithSummary.push(summaryRow);
                }
            }
        }

        return recordsWithSummary;
    }

}