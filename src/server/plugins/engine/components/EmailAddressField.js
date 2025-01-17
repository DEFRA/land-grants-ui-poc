import joi from 'joi';
import { FormComponent } from "./FormComponent.js";
export class EmailAddressField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      options,
      title
    } = def;
    let formSchema = joi.string().email().trim().label(title.toLowerCase()).required();
    if (options.required === false) {
      formSchema = formSchema.allow('');
    }
    if (options.customValidationMessage) {
      const message = options.customValidationMessage;
      formSchema = formSchema.messages({
        'any.required': message,
        'string.empty': message,
        'string.email': message
      });
    } else if (options.customValidationMessages) {
      formSchema = formSchema.messages(options.customValidationMessages);
    }
    this.formSchema = formSchema.default('');
    this.stateSchema = formSchema.default(null).allow(null);
    this.options = options;
  }
  getViewModel(payload, errors) {
    const viewModel = super.getViewModel(payload, errors);
    const {
      attributes
    } = viewModel;
    attributes.autocomplete = 'email';
    return {
      ...viewModel,
      type: 'email'
    };
  }
}
//# sourceMappingURL=EmailAddressField.js.map