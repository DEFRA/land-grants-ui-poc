import { SelectionControlField } from "./SelectionControlField.js";
export class RadiosField extends SelectionControlField {
  constructor(def, props) {
    super(def, props);
    const {
      options
    } = def;
    let {
      formSchema
    } = this;
    if (options.required === false) {
      formSchema = formSchema.optional();
    }
    this.formSchema = formSchema;
    this.options = options;
  }
}
//# sourceMappingURL=RadiosField.js.map