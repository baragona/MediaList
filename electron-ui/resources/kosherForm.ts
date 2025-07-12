type PropertyValue = string | number | PropertyValue[];
type FormValues = { [key: string]: PropertyValue };

interface PropertySchema {
  type: 'string' | 'number' | 'array';
  title: string;
  default?: PropertyValue;
  icon?: string;
  items?: PropertySchema;
}

interface FormSchema {
  order: string[];
  properties: {
    [key: string]: PropertySchema;
  };
}

type Reclaimer = () => PropertyValue;
type FormReclaimer = () => FormValues;

function kosherForm(schema: FormSchema, parent: JQuery): FormReclaimer {
  const table = $('<table>').appendTo(parent);
  table.addClass('kosherForm');

  const reclaimers: { [key: string]: Reclaimer } = {};

  for (let i = 0; i < schema.order.length; i++) {
    const key = schema.order[i];

    const row = $('<tr>').addClass('kosherPropertyRow').appendTo(table);

    const props = schema.properties[key];

    const iconbox = $('<td>').appendTo(row);
    if (props.icon) {
      const img = $('<img>').attr('src', props.icon);
      iconbox.append(img);
    }
    const label = $('<td>').text(props.title + ':').addClass('kosherPropertyLabel').appendTo(row);

    const editbox = $('<td>').appendTo(row);

    reclaimers[key] = makeKosherPropertyEditor(props, props.default, editbox);
  }

  return function() {
    const output: FormValues = {};
    for (const key in reclaimers) {
      output[key] = reclaimers[key]();
    }
    return output;
  };
}

function makeKosherPropertyEditor(
  props: PropertySchema,
  def: PropertyValue | undefined,
  editbox: JQuery
): Reclaimer {
  if (props.type === 'string') {
    const input = $('<input type="text">').appendTo(editbox);
    input.val(def as string || '');
    return function() {
      return input.val() || '';
    };
  } else if (props.type === 'number') {
    const input = $('<input type="text">').appendTo(editbox);
    input.val(String(def || ''));
    return function() {
      const val = input.val();
      return parseInt(String(val), 10) || 0;
    };
  } else if (props.type === 'array') {
    const table = $('<table>').addClass('kosherForm').appendTo(editbox);

    const reclaimers: Reclaimer[] = [];

    const defArray = (def && Array.isArray(def)) ? def : [];
    for (let i = 0; i < defArray.length; i++) {
      reclaimers.push(makeKosherArrayRow(table, props, defArray[i], reclaimers));
    }
    const addButton = $('<button>').text('Add').addClass('kosherAddButton').appendTo(editbox);

    addButton.click(function() {
      reclaimers.push(makeKosherArrayRow(table, props, undefined, reclaimers));
    });
    return function() {
      return reclaimers.map(function(x) { return x(); });
    };
  }
  
  // Return empty string for unsupported types
  return function() { return ''; };
}

function makeKosherArrayRow(
  table: JQuery,
  props: PropertySchema,
  def: PropertyValue | undefined,
  reclaimers: Reclaimer[]
): Reclaimer {
  const row = $('<tr>').appendTo(table);
  const innerEditbox = $('<td>').appendTo(row);

  if (!props.items) {
    throw new Error('Array property must have items schema');
  }
  const reclaimer = makeKosherPropertyEditor(props.items, def, innerEditbox);

  const deleteCell = $('<td>').appendTo(row);
  const deleteButton = $('<button>').text('X').addClass('kosherDeleteButton').appendTo(deleteCell);

  deleteButton.click(function() {
    row.detach();

    const index = reclaimers.indexOf(reclaimer);
    if (index !== -1) {
      reclaimers.splice(index, 1);
    }
  });

  return reclaimer;
}