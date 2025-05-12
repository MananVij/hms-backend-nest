import * as Handlebars from 'handlebars';

// Register Handlebars helpers (copied from frontend)
Handlebars.registerHelper('isNotEmpty', function (value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
});

Handlebars.registerHelper('hasAnyValue', function (obj, options) {
  if (!obj) return false;
  if (Array.isArray(obj)) {
    return (
      obj.length > 0 &&
      obj.some((item) =>
        Object.values(item).some(
          (val) => val != null && val !== '' && val !== undefined
        )
      )
    );
  }
  if (typeof obj === 'object') {
    return Object.values(obj).some(
      (val) => val != null && val !== '' && val !== undefined
    );
  }
  return obj != null && obj !== '' && obj !== undefined;
});

Handlebars.registerHelper('hasColumnValue', function (arr, key, options) {
  if (!Array.isArray(arr) || !key) return false;
  return arr.some((item) => item[key] != null && item[key] !== '')
    ? options.fn(this)
    : '';
});

Handlebars.registerHelper('add', function (value, addition) {
  return parseInt(value) + parseInt(addition);
});

Handlebars.registerHelper('pick', function (obj, ...args) {
  const keys = args.slice(0, -1);
  const picked = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      picked[key] = obj[key];
    }
  });
  return picked;
});

Handlebars.registerHelper('filterRows', function (arr, options) {
  if (!Array.isArray(arr)) return '';
  const filtered = arr.filter((row) =>
    Object.values(row).some((val) => val != null && val !== '')
  );
  if (filtered.length === 0) return '';
  return filtered.map((item) => options.fn(item)).join('');
});

Handlebars.registerHelper('or', function () {
  const args = Array.prototype.slice.call(arguments, 0, -1);
  return args.some(Boolean);
});

// Add isArray helper from frontend
Handlebars.registerHelper('isArray', function(value) {
  return Array.isArray(value);
});

export function renderHandlebarsTemplate(template: string, values: any): string {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(values);
  } catch (error) {
    console.error("Error rendering template:", error);
    return `<div>Error rendering report: ${error.message}</div>`;
  }
} 