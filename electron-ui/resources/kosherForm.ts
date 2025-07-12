interface PropertySchema {
  type: 'string' | 'number' | 'array';
  title: string;
  default?: any;
  icon?: string;
  items?: PropertySchema;
}

interface FormSchema {
  order: string[];
  properties: {
    [key: string]: PropertySchema;
  };
}

type Reclaimer = () => any;

function kosherForm(schema: FormSchema, parent: JQuery): Reclaimer {
  const table = $('<table>').appendTo(parent);
  table.addClass('kosherForm');

  const reclaimers: { [key: string]: Reclaimer } = {};

  for (const ki in schema.order) {
    const key = schema.order[ki];

    const row = $('<tr>').addClass('kosherPropertyRow').appendTo(table);

    const props = schema.properties[key];

    const iconbox = $('<td>').appendTo(row);
    if (props.icon) {
      iconbox.append('<img src="' + props.icon + '">');
    }
    const label = $('<td>').text(props.title + ':').addClass('kosherPropertyLabel').appendTo(row);

    const editbox = $('<td>').appendTo(row);

    reclaimers[key] = makeKosherPropertyEditor(props, props.default, editbox);
  }

  return function() {
    const output: { [key: string]: any } = {};
    for (const key in reclaimers) {
      output[key] = reclaimers[key]();
    }
    return output;
  };
}

function makeKosherPropertyEditor(
  props: PropertySchema,
  def: any,
  editbox: JQuery
): Reclaimer {
  if (props.type === 'string') {
    const input = $('<input type="text">').appendTo(editbox);
    input.val(def);
    return function() {
      return input.val();
    };
  } else if (props.type === 'number') {
    const input = $('<input type="text">').appendTo(editbox);
    input.val(def);
    return function() {
      return parseInt(input.val() as string);
    };
  } else if (props.type === 'array') {
    const table = $('<table>').addClass('kosherForm').appendTo(editbox);

    const reclaimers: Reclaimer[] = [];

    for (const i in def) {
      reclaimers.push(makeKosherArrayRow(table, props, def[i], reclaimers));
    }
    const addButton = $('<button>').text('Add').addClass('kosherAddButton').appendTo(editbox);

    addButton.click(function() {
      reclaimers.push(makeKosherArrayRow(table, props, undefined, reclaimers));
    });
    return function() {
      return reclaimers.map(function(x) { return x(); });
    };
  }
  
  // Return a no-op function for unsupported types
  return function() { return null; };
}

function makeKosherArrayRow(
  table: JQuery,
  props: PropertySchema,
  def: any,
  reclaimers: Reclaimer[]
): Reclaimer {
  const row = $('<tr>').appendTo(table);
  const innerEditbox = $('<td>').appendTo(row);

  const reclaimer = makeKosherPropertyEditor(props.items!, def, innerEditbox);

  const deleteCell = $('<td>').appendTo(row);
  const deleteButton = $('<button>').text('X').addClass('kosherDeleteButton').appendTo(deleteCell);

  deleteButton.click(function() {
    row.detach();

    for (let ri = 0; ri < reclaimers.length; ri++) {
      if (reclaimers[ri] === reclaimer) {
        reclaimers.splice(ri, 1);
      }
    }
  });

  return reclaimer;
}

// Export to global scope
(window as any).kosherForm = kosherForm;