import { SelectField } from "./SelectField.js";
import { messageTemplate } from "../pageControllers/validationOptions.js";
export class AutocompleteField extends SelectField {
  constructor(def, props) {
    super(def, props);
    const {
      options
    } = def;
    let {
      formSchema
    } = this;
    if (options.required !== false) {
      const messages = options.customValidationMessages;
      formSchema = formSchema.messages({
        'any.only': messages?.['any.only'] ?? messageTemplate.required,
        'any.required': messages?.['any.required'] ?? messageTemplate.required
      });
    }
    this.options = options;
    this.formSchema = formSchema;
  }
  getViewModel(payload, errors) {
    const viewModel = super.getViewModel(payload, errors);
    let {
      formGroup
    } = viewModel;
    formGroup ??= {};
    formGroup.attributes = {
      'data-module': 'govuk-accessible-autocomplete'
    };
    return {
      ...viewModel,
      formGroup
    };
  }
}
//# sourceMappingURL=AutocompleteField.js.map