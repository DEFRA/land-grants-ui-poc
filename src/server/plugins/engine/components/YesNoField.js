import { SelectionControlField } from "./SelectionControlField.js";
import { addClassOptionIfNone } from "./helpers.js";

/**
 * @description
 * YesNoField is a radiosField with predefined values.
 */
export class YesNoField extends SelectionControlField {
  constructor(def, props) {
    super({
      ...def,
      list: '__yesNo'
    }, props);
    const {
      options
    } = def;
    let {
      formSchema
    } = this;
    addClassOptionIfNone(options, 'govuk-radios--inline');
    if (options.required === false) {
      formSchema = formSchema.optional();
    }
    this.formSchema = formSchema;
    this.options = options;
  }
}
//# sourceMappingURL=YesNoField.js.map