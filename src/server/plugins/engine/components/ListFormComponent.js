import joi from 'joi';
import { FormComponent } from "./FormComponent.js";
export class ListFormComponent extends FormComponent {
  list;
  listType = 'string';
  get items() {
    return this.list?.items ?? [];
  }
  get values() {
    return this.items.map(({
      value
    }) => value);
  }
  constructor(def, props) {
    super(def, props);
    const {
      options,
      title
    } = def;
    const {
      model
    } = props;
    if ('list' in def) {
      this.list = model.getList(def.list);
      this.listType = this.list?.type ?? 'string';
    }
    let formSchema = joi[this.listType]().valid(...this.values).label(title.toLowerCase()).required();
    if (options.customValidationMessages) {
      formSchema = formSchema.messages(options.customValidationMessages);
    }
    this.formSchema = formSchema;
    this.stateSchema = formSchema.default(null).allow(null);
    this.options = options;
  }
  getFormValueFromState(state) {
    const {
      name,
      items
    } = this;
    const value = state[name];

    // Allow for array values via subclass
    const values = this.isValue(value) ? [value].flat() : [];
    const selected = items.filter(item => values.includes(item.value));
    return selected.at(0)?.value;
  }
  getDisplayStringFromState(state) {
    const {
      items
    } = this;

    // Allow for array values via subclass
    const value = this.getFormValueFromState(state);
    const values = [value ?? []].flat();
    return items.filter(item => values.includes(item.value)).map(item => item.text).join(', ');
  }
  getViewModel(payload, errors) {
    const {
      items: listItems
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    const {
      value
    } = viewModel;

    // Support multiple values for checkboxes
    const values = this.isValue(value) ? [value].flat() : [];
    const items = listItems.map(item => {
      const selected = values.includes(item.value);
      const itemModel = {
        ...item,
        selected
      };
      if (item.description) {
        itemModel.hint = {
          text: item.description
        };
      }
      return itemModel;
    });
    return {
      ...viewModel,
      items
    };
  }
}
//# sourceMappingURL=ListFormComponent.js.map