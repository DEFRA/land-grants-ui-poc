import { isConditionalType } from '@defra/forms-model';
import joi from 'joi';
export class ComponentBase {
  page;
  parent;
  collection;
  type;
  name;
  title;
  schema;
  options;
  isFormComponent = false;
  model;

  /** joi schemas based on a component defined in the form JSON. This validates a user's answer and is generated from {@link ComponentDef} */
  formSchema = joi.string();
  stateSchema = joi.string();
  constructor(def, props) {
    this.type = def.type;
    this.name = def.name;
    this.title = def.title;
    if ('schema' in def) {
      this.schema = def.schema;
    }
    if ('options' in def) {
      this.options = def.options;
    }
    this.page = props.page;
    this.parent = props.parent;
    this.model = props.model;
  }
  get viewModel() {
    const {
      options,
      type
    } = this;
    const viewModel = {
      attributes: {}
    };
    if (!options) {
      return viewModel;
    }
    if ('autocomplete' in options) {
      viewModel.attributes.autocomplete = options.autocomplete;
    }
    if ('classes' in options) {
      viewModel.classes = options.classes;
    }
    if ('condition' in options && isConditionalType(type)) {
      viewModel.condition = options.condition;
    }
    return viewModel;
  }
}
//# sourceMappingURL=ComponentBase.js.map