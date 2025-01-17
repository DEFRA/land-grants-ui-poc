import { ListFormComponent } from "./ListFormComponent.js";
/**
 * "Selection controls" are checkboxes and radios (and switches), as per Material UI nomenclature.
 */
export class SelectionControlField extends ListFormComponent {
  getViewModel(payload, errors) {
    const {
      options
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    let {
      fieldset,
      items,
      label
    } = viewModel;
    fieldset ??= {
      legend: {
        text: label.text,
        classes: 'govuk-fieldset__legend--m'
      }
    };
    items = items.map(item => {
      const {
        selected: checked
      } = item;
      const itemModel = {
        ...item,
        checked
      };
      if ('bold' in options && options.bold) {
        itemModel.label ??= {};
        itemModel.label.classes = 'govuk-label--s';
      }
      return itemModel;
    });
    return {
      ...viewModel,
      fieldset,
      items
    };
  }
}
//# sourceMappingURL=SelectionControlField.js.map