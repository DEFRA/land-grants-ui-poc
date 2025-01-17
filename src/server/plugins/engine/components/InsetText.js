import { ComponentBase } from "./ComponentBase.js";
export class InsetText extends ComponentBase {
  content;
  constructor(def, props) {
    super(def, props);
    const {
      content
    } = def;
    this.content = content;
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
//# sourceMappingURL=InsetText.js.map