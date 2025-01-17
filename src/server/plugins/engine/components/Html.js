import { ComponentBase } from "./ComponentBase.js";
export class Html extends ComponentBase {
  content;
  constructor(def, props) {
    super(def, props);
    const {
      content,
      options
    } = def;
    this.content = content;
    this.options = options;
  }
  getViewModel() {
    const {
      content,
      viewModel
    } = this;
    return {
      ...viewModel,
      content
    };
  }
}
//# sourceMappingURL=Html.js.map