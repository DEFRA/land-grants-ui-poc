import { ComponentType } from '@defra/forms-model';
import { add, format, isValid, parse, startOfToday, sub } from 'date-fns';
import { ComponentCollection } from "./ComponentCollection.js";
import { FormComponent, isFormState, isFormValue } from "./FormComponent.js";
import { NumberField } from "./NumberField.js";
import { messageTemplate } from "../pageControllers/validationOptions.js";
export class DatePartsField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      name,
      options
    } = def;
    const isRequired = options.required !== false;
    const customValidationMessages = {
      'any.required': messageTemplate.objectMissing,
      'number.base': messageTemplate.objectMissing,
      'number.precision': messageTemplate.dateFormat,
      'number.integer': messageTemplate.dateFormat,
      'number.unsafe': messageTemplate.dateFormat,
      'number.min': messageTemplate.dateFormat,
      'number.max': messageTemplate.dateFormat
    };
    this.collection = new ComponentCollection([{
      type: ComponentType.NumberField,
      name: `${name}__day`,
      title: 'Day',
      schema: {
        min: 1,
        max: 31,
        precision: 0
      },
      options: {
        required: isRequired,
        optionalText: true,
        classes: 'govuk-input--width-2',
        customValidationMessages
      }
    }, {
      type: ComponentType.NumberField,
      name: `${name}__month`,
      title: 'Month',
      schema: {
        min: 1,
        max: 12,
        precision: 0
      },
      options: {
        required: isRequired,
        optionalText: true,
        classes: 'govuk-input--width-2',
        customValidationMessages
      }
    }, {
      type: ComponentType.NumberField,
      name: `${name}__year`,
      title: 'Year',
      schema: {
        min: 1000,
        max: 3000,
        precision: 0
      },
      options: {
        required: isRequired,
        optionalText: true,
        classes: 'govuk-input--width-4',
        customValidationMessages
      }
    }], {
      ...props,
      parent: this
    }, {
      custom: getValidatorDate(this),
      peers: [`${name}__day`, `${name}__month`, `${name}__year`]
    });
    this.options = options;
    this.formSchema = this.collection.formSchema;
    this.stateSchema = this.collection.stateSchema;
  }
  getFormValueFromState(state) {
    const value = super.getFormValueFromState(state);
    return this.isState(value) ? value : undefined;
  }
  getDisplayStringFromState(state) {
    const value = this.getFormValueFromState(state);
    if (!value) {
      return '';
    }
    return format(`${value.year}-${value.month}-${value.day}`, 'd MMMM yyyy');
  }
  getContextValueFromState(state) {
    const value = this.getFormValueFromState(state);
    if (!value) {
      return null;
    }
    return format(`${value.year}-${value.month}-${value.day}`, 'yyyy-MM-dd');
  }
  getViewModel(payload, errors) {
    const {
      collection,
      name
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    let {
      fieldset,
      label
    } = viewModel;

    // Check for component errors only
    const hasError = errors?.some(error => error.name === name);

    // Use the component collection to generate the subitems
    const items = collection.getViewModel(payload, errors).map(({
      model
    }) => {
      let {
        label,
        type,
        value,
        classes,
        errorMessage
      } = model;
      if (label) {
        label.toString = () => label.text; // Date component uses string labels
      }
      if (hasError || errorMessage) {
        classes = `${classes} govuk-input--error`.trim();
      }

      // Allow any `toString()`-able value so non-numeric
      // values are shown alongside their error messages
      if (!isFormValue(value)) {
        value = undefined;
      }
      return {
        label,
        id: model.id,
        name: model.name,
        type,
        value,
        classes
      };
    });
    fieldset ??= {
      legend: {
        text: label.text,
        classes: 'govuk-fieldset__legend--m'
      }
    };
    return {
      ...viewModel,
      fieldset,
      items
    };
  }
  isState(value) {
    return DatePartsField.isDateParts(value);
  }
  static isDateParts(value) {
    return isFormState(value) && NumberField.isNumber(value.day) && NumberField.isNumber(value.month) && NumberField.isNumber(value.year);
  }
}
export function getValidatorDate(component) {
  const validator = (payload, helpers) => {
    const {
      collection,
      name,
      options
    } = component;
    const values = component.getFormValueFromState(component.getStateFromValidForm(payload));
    const context = {
      missing: collection.keys,
      key: name
    };
    if (!component.isState(values)) {
      return options.required !== false ? helpers.error('object.required', context) : payload;
    }
    const date = parse(`${values.year}-${values.month}-${values.day}`, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) {
      return helpers.error('date.format', context);
    }

    // Minimum date from today
    const dateMin = options.maxDaysInPast ? sub(startOfToday(), {
      days: options.maxDaysInPast
    }) : undefined;

    // Maximum date from today
    const dateMax = options.maxDaysInFuture ? add(startOfToday(), {
      days: options.maxDaysInFuture
    }) : undefined;
    if (dateMin && date < dateMin) {
      return helpers.error('date.min', {
        ...context,
        limit: dateMin
      });
    }
    if (dateMax && date > dateMax) {
      return helpers.error('date.max', {
        ...context,
        limit: dateMax
      });
    }
    return payload;
  };
  return validator;
}
//# sourceMappingURL=DatePartsField.js.map