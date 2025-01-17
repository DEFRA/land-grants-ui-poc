import joi from 'joi';
import { FormComponent, isFormValue } from "./FormComponent.js";
export class TextField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      options,
      title
    } = def;
    const schema = 'schema' in def ? def.schema : {};
    let formSchema = joi.string().trim().label(title.toLowerCase()).required();
    if (options.required === false) {
      formSchema = formSchema.allow('');
    }
    if (typeof schema.length !== 'number') {
      if (typeof schema.max === 'number') {
        formSchema = formSchema.max(schema.max);
      }
      if (typeof schema.min === 'number') {
        formSchema = formSchema.min(schema.min);
      }
    } else {
      formSchema = formSchema.length(schema.length);
    }
    if (schema.regex) {
      const pattern = new RegExp(schema.regex);
      formSchema = formSchema.pattern(pattern);
    }
    if (options.customValidationMessage) {
      const message = options.customValidationMessage;
      formSchema = formSchema.messages({
        'any.required': message,
        'string.empty': message,
        'string.max': message,
        'string.min': message,
        'string.length': message,
        'string.pattern.base': message
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
  isValue(value) {
    return TextField.isText(value);
  }
  static isText(value) {
    return isFormValue(value) && typeof value === 'string';
  }
}
//# sourceMappingURL=TextField.js.map