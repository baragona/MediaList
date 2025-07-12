// Basic SlickGrid type definitions

declare namespace Slick {
  interface GridOptions<T> {
    enableCellNavigation?: boolean;
    enableColumnReorder?: boolean;
    forceFitColumns?: boolean;
    fullWidthRows?: boolean;
    rowHeight?: number;
    editable?: boolean;
    multiSelect?: boolean;
    forceSyncScrolling?: boolean;
    syncColumnCellResize?: boolean;
  }

  interface Column<T> {
    id: string;
    name: string;
    field: string;
    sortable?: boolean;
    formatter?: (row: number, cell: number, value: any, columnDef: Column<T>, dataContext: T) => string;
    width?: number;
  }

  interface RowSelectionModel<T> {
    new(options?: { dragToMultiSelect?: boolean }): RowSelectionModel<T>;
  }

  interface DataView<T> {
    beginUpdate(): void;
    endUpdate(): void;
    setItems(items: T[]): void;
    setFilter(filter: (item: T) => boolean): void;
    refresh(): void;
    sort(comparer: (a: T, b: T) => number, ascending: boolean): void;
    getItem(index: number): T;
    onRowCountChanged: Event<any>;
    onRowsChanged: Event<{ rows: number[] }>;
  }

  interface Grid<T> {
    new(container: string | HTMLElement, dataView: DataView<T>, columns: Column<T>[], options: GridOptions<T>): Grid<T>;
    init(): void;
    resizeCanvas(): void;
    invalidateAllRows(): void;
    invalidateRows(rows: number[]): void;
    render(): void;
    updateRowCount(): void;
    scrollRowToTop(row: number): void;
    getViewport(): { top: number; bottom: number };
    getFocusSink(): JQuery;
    getCellFromEvent(e: JQuery.Event): { row: number; cell: number };
    setSelectionModel(model: RowSelectionModel<T>): void;
    onSort: Event<{ sortCol: Column<T>; sortAsc: boolean; multiColumnSort: boolean }>;
    onDblClick: Event<any>;
    onScroll: Event<any>;
    onColumnsResized: Event<any>;
  }

  interface Event<T> {
    subscribe(handler: (e: any, args: T) => void): void;
    unsubscribe(handler: (e: any, args: T) => void): void;
  }
}