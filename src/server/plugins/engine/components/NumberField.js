import joi from 'joi';
import { FormComponent, isFormValue } from "./FormComponent.js";
import { messageTemplate } from "../pageControllers/validationOptions.js";
export class NumberField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      options,
      schema,
      title
    } = def;
    let formSchema = joi.number().custom(getValidatorPrecision(this)).label(title.toLowerCase()).required();
    if (options.required === false) {
      formSchema = formSchema.allow('');
    } else {
      const messages = options.customValidationMessages;
      formSchema = formSchema.empty('').messages({
        'any.required': messages?.['any.required'] ?? messageTemplate.required
      });
    }
    if (typeof schema.min === 'number') {
      formSchema = formSchema.min(schema.min);
    }
    if (typeof schema.max === 'number') {
      formSchema = formSchema.max(schema.max);
    }
    if (typeof schema.precision === 'number' && schema.precision <= 0) {
      formSchema = formSchema.integer();
    }
    if (options.customValidationMessage) {
      const message = options.customValidationMessage;
      formSchema = formSchema.messages({
        'any.required': message,
        'number.base': message,
        'number.precision': message,
        'number.integer': message,
        'number.min': message,
        'number.max': message
      });
    } else if (options.customValidationMessages) {
      formSchema = formSchema.messages(options.customValidationMessages);
    }
    this.formSchema = formSchema.default('');
    this.stateSchema = formSchema.default(null).allow(null);
    this.options = options;
    this.schema = schema;
  }
  getFormValueFromState(state) {
    const {
      name
    } = this;
    return this.getFormValue(state[name]);
  }
  getFormValue(value) {
    return this.isValue(value) ? value : undefined;
  }
  getViewModel(payload, errors) {
    const {
      options,
      schema
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    let {
      attributes,
      prefix,
      suffix,
      value
    } = viewModel;
    if (typeof schema.precision === 'undefined' || schema.precision <= 0) {
      // If precision isn't provided or provided and
      // less than or equal to 0, use numeric inputmode
      attributes.inputmode = 'numeric';
    }
    if (options.prefix) {
      prefix = {
        text: options.prefix
      };
    }
    if (options.suffix) {
      suffix = {
        text: options.suffix
      };
    }

    // Allow any `toString()`-able value so non-numeric
    // values are shown alongside their error messages
    if (!isFormValue(value)) {
      value = undefined;
    }
    return {
      ...viewModel,
      attributes,
      prefix,
      suffix,
      value
    };
  }
  isValue(value) {
    return NumberField.isNumber(value);
  }
  static isNumber(value) {
    return typeof value === 'number';
  }
}
export function getValidatorPrecision(component) {
  const validator = (value, helpers) => {
    const {
      options,
      schema
    } = component;
    const {
      customValidationMessage: custom
    } = options;
    const {
      precision: limit
    } = schema;
    if (!limit || limit <= 0) {
      return value;
    }
    const validationSchema = joi.number().precision(limit).prefs({
      convert: false
    });
    try {
      return joi.attempt(value, validationSchema);
    } catch {
      return custom ? helpers.message({
        custom
      }, {
        limit
      }) : helpers.error('number.precision', {
        limit
      });
    }
  };
  return validator;
}
//# sourceMappingURL=NumberField.js.map