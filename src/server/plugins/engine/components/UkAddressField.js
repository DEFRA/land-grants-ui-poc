import { ComponentType } from '@defra/forms-model';
import { ComponentCollection } from "./ComponentCollection.js";
import { FormComponent, isFormState } from "./FormComponent.js";
import { TextField } from "./TextField.js";
export class UkAddressField extends FormComponent {
  constructor(def, props) {
    super(def, props);
    const {
      name,
      options
    } = def;
    const isRequired = options.required !== false;
    const hideOptional = !!options.optionalText;
    const hideTitle = !!options.hideTitle;
    this.collection = new ComponentCollection([{
      type: ComponentType.TextField,
      name: `${name}__addressLine1`,
      title: 'Address line 1',
      schema: {
        max: 100
      },
      options: {
        autocomplete: 'address-line1',
        required: isRequired,
        optionalText: !isRequired && (hideOptional || !hideTitle)
      }
    }, {
      type: ComponentType.TextField,
      name: `${name}__addressLine2`,
      title: 'Address line 2',
      schema: {
        max: 100
      },
      options: {
        autocomplete: 'address-line2',
        required: false,
        optionalText: !isRequired && (hideOptional || !hideTitle)
      }
    }, {
      type: ComponentType.TextField,
      name: `${name}__town`,
      title: 'Town or city',
      schema: {
        max: 100
      },
      options: {
        autocomplete: 'address-level2',
        classes: 'govuk-!-width-two-thirds',
        required: isRequired,
        optionalText: !isRequired && (hideOptional || !hideTitle)
      }
    }, {
      type: ComponentType.TextField,
      name: `${name}__postcode`,
      title: 'Postcode',
      schema: {
        regex: '^[a-zA-Z]{1,2}\\d[a-zA-Z\\d]?\\s?\\d[a-zA-Z]{2}$'
      },
      options: {
        autocomplete: 'postal-code',
        classes: 'govuk-input--width-10',
        required: isRequired,
        optionalText: !isRequired && (hideOptional || !hideTitle)
      }
    }], {
      ...props,
      parent: this
    });
    this.options = options;
    this.formSchema = this.collection.formSchema;
    this.stateSchema = this.collection.stateSchema;
  }
  getFormValueFromState(state) {
    const value = super.getFormValueFromState(state);
    return this.isState(value) ? value : undefined;
  }
  getDisplayStringFromState(state) {
    return this.getContextValueFromState(state)?.join(', ') ?? '';
  }
  getContextValueFromState(state) {
    const value = this.getFormValueFromState(state);
    if (!value) {
      return null;
    }
    return Object.values(value).filter(Boolean);
  }
  getViewModel(payload, errors) {
    const {
      collection,
      name,
      options
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    let {
      components,
      fieldset,
      hint,
      label
    } = viewModel;
    fieldset ??= {
      legend: {
        text: label.text,
        /**
         * For screen readers, only hide legend visually. This can be overridden
         * by single component {@link QuestionPageController | `showTitle` handling}
         */
        classes: options.hideTitle ? 'govuk-visually-hidden' : 'govuk-fieldset__legend--m'
      }
    };
    if (hint) {
      hint.id ??= `${name}-hint`;
      fieldset.attributes ??= {
        'aria-describedby': hint.id
      };
    }
    components = collection.getViewModel(payload, errors);
    return {
      ...viewModel,
      fieldset,
      components
    };
  }
  isState(value) {
    return UkAddressField.isUkAddress(value);
  }
  static isUkAddress(value) {
    return isFormState(value) && TextField.isText(value.addressLine1) && TextField.isText(value.town) && TextField.isText(value.postcode);
  }
}
//# sourceMappingURL=UkAddressField.js.map