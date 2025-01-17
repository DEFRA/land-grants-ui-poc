import { ComponentBase } from "./ComponentBase.js";
export class List extends ComponentBase {
  hint;
  list;
  get items() {
    return this.list?.items ?? [];
  }
  constructor(def, props) {
    super(def, props);
    const {
      hint,
      list,
      options
    } = def;
    const {
      model
    } = props;
    this.hint = hint;
    this.list = model.getList(list);
    this.options = options;
  }
  getViewModel() {
    const {
      items: listItems,
      options,
      viewModel
    } = this;
    let {
      classes,
      content,
      items,
      type
    } = viewModel;
    if (options.type) {
      type = options.type;
    }
    if (options.bold) {
      classes ??= '';
      classes = `${classes} govuk-!-font-weight-bold`.trim();
    }
    content = {
      title: !options.hideTitle ? this.title : undefined,
      text: this.hint ?? ''
    };
    items = listItems.map(item => {
      const itemModel = {
        ...item
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
      type,
      classes,
      content,
      items
    };
  }
}
//# sourceMappingURL=List.js.map