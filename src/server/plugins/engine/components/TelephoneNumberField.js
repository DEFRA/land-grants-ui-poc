import joi from 'joi';
import { FormComponent } from "./FormComponent.js";
import { addClassOptionIfNone } from "./helpers.js";
const PATTERN = /^[0-9\\\s+()-]*$/;
export class TelephoneNumberField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      options,
      title
    } = def;
    let formSchema = joi.string().trim().pattern(PATTERN).label(title.toLowerCase()).required();
    if (options.required === false) {
      formSchema = formSchema.allow('');
    }
    if (options.customValidationMessage) {
      const message = options.customValidationMessage;
      formSchema = formSchema.messages({
        'any.required': message,
        'string.empty': message,
        'string.pattern.base': message
      });
    } else if (options.customValidationMessages) {
      formSchema = formSchema.messages(options.customValidationMessages);
    }
    addClassOptionIfNone(options, 'govuk-input--width-20');
    this.formSchema = formSchema.default('');
    this.stateSchema = formSchema.default(null).allow(null);
    this.options = options;
  }
  getViewModel(payload, errors) {
    const viewModel = super.getViewModel(payload, errors);
    const {
      attributes
    } = viewModel;
    attributes.autocomplete = 'tel';
    return {
      ...viewModel,
      type: 'tel'
    };
  }
}
//# sourceMappingURL=TelephoneNumberField.js.map