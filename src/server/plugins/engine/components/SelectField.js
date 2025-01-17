import { ListFormComponent } from "./ListFormComponent.js";
export class SelectField extends ListFormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      options
    } = def;
    let {
      formSchema
    } = this;
    if (options.required === false) {
      formSchema = formSchema.allow('');
    } else {
      formSchema = formSchema.empty('');
    }
    this.formSchema = formSchema;
    this.options = options;
  }
  getViewModel(payload, errors) {
    const viewModel = super.getViewModel(payload, errors);
    let {
      items
    } = viewModel;
    items = [{
      value: ''
    }, ...items];
    return {
      ...viewModel,
      items
    };
  }
}
//# sourceMappingURL=SelectField.js.map