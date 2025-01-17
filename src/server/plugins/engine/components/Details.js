import { ComponentBase } from "./ComponentBase.js";
export class Details extends ComponentBase {
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
      title,
      viewModel
    } = this;
    return {
      ...viewModel,
      html: content,
      summaryHtml: title
    };
  }
}
//# sourceMappingURL=Details.js.map