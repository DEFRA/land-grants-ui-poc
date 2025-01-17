import { ComponentType } from '@defra/forms-model';
import { format } from 'date-fns';
import { ComponentCollection } from "./ComponentCollection.js";
import { FormComponent, isFormState, isFormValue } from "./FormComponent.js";
import { NumberField } from "./NumberField.js";
import { messageTemplate } from "../pageControllers/validationOptions.js";
export class MonthYearField extends FormComponent {
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
      custom: getValidatorMonthYear(this),
      peers: [`${name}__month`, `${name}__year`]
    });
    this.options = options;
    this.formSchema = this.collection.formSchema;
    this.stateSchema = this.collection.stateSchema;
  }
  getFormValueFromState(state) {
    const value = super.getFormValueFromState(state);
    return MonthYearField.isMonthYear(value) ? value : undefined;
  }
  getDisplayStringFromState(state) {
    const value = this.getFormValueFromState(state);
    if (!value) {
      return '';
    }
    const date = new Date();
    date.setMonth(value.month - 1);
    const monthString = date.toLocaleString('default', {
      month: 'long'
    });
    return `${monthString} ${value.year}`;
  }
  getContextValueFromState(state) {
    const value = this.getFormValueFromState(state);
    if (!value) {
      return null;
    }
    return format(`${value.year}-${value.month}-01`, 'yyyy-MM');
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
    return MonthYearField.isMonthYear(value);
  }
  static isMonthYear(value) {
    return isFormState(value) && NumberField.isNumber(value.month) && NumberField.isNumber(value.year);
  }
}
export function getValidatorMonthYear(component) {
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
    return payload;
  };
  return validator;
}
//# sourceMappingURL=MonthYearField.js.map