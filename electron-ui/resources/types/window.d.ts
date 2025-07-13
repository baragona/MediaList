// Extend the Window interface with our custom properties

interface Window {
  Slick: {
    Grid: new <T>(
      container: string | HTMLElement,
      dataView: Slick.DataView<T>,
      columns: Slick.Column<T>[],
      options: Slick.GridOptions<T>
    ) => Slick.Grid<T>;
    Data: {
      DataView: new <T>() => Slick.DataView<T>;
    };
    RowSelectionModel: new <T>(options?: { dragToMultiSelect?: boolean }) => Slick.RowSelectionModel<T>;
  };
  memoize: <T extends Function>(fn: T, options?: { primitive?: boolean }) => T;
  kosherForm: typeof kosherForm;
  calcSquishyHTML: typeof calcSquishyHTML;
  forceFitSquishy: typeof forceFitSquishy;
  fileChooser: typeof fileChooser;
}