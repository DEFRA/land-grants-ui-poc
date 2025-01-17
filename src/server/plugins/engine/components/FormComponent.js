import { ComponentBase } from "./ComponentBase.js";
import { optionalText } from "./constants.js";
export class FormComponent extends ComponentBase {
  type;
  hint;
  isFormComponent = true;
  constructor(def, props) {
    super(def, props);
    const {
      hint,
      type
    } = def;
    this.type = type;
    this.hint = hint;
  }
  get keys() {
    const {
      collection,
      name
    } = this;
    if (collection) {
      const {
        fields
      } = collection;
      return [name, ...fields.map(({
        name
      }) => name)];
    }
    return [name];
  }
  getFormDataFromState(state) {
    const {
      collection,
      name
    } = this;
    if (collection) {
      return collection.getFormDataFromState(state);
    }
    return {
      [name]: this.getFormValue(state[name])
    };
  }
  getFormValueFromState(state) {
    const {
      collection,
      name
    } = this;
    if (collection) {
      return collection.getFormValueFromState(state);
    }
    return this.getFormValue(state[name]);
  }
  getFormValue(value) {
    return this.isValue(value) ? value : undefined;
  }
  getStateFromValidForm(payload) {
    const {
      collection,
      name
    } = this;
    if (collection) {
      return collection.getStateFromValidForm(payload);
    }
    return {
      [name]: this.getFormValue(payload[name]) ?? null
    };
  }
  getErrors(errors) {
    const {
      name
    } = this;

    // Filter component and child errors only
    const list = errors?.filter(error => error.name === name || error.path.includes(name) || this.keys.includes(error.name));
    if (!list?.length) {
      return;
    }
    return list;
  }
  getError(errors) {
    return this.getErrors(errors)?.[0];
  }
  getViewModel(payload, errors) {
    const {
      hint,
      name,
      options = {},
      title,
      viewModel
    } = this;
    const isRequired = !('required' in options) || options.required !== false;
    const hideOptional = 'optionalText' in options && options.optionalText;
    const label = `${title}${!isRequired && !hideOptional ? optionalText : ''}`;
    if (hint) {
      viewModel.hint = {
        text: hint
      };
    }

    // Filter component errors only
    const componentErrors = this.getErrors(errors);
    const componentError = this.getError(componentErrors);
    if (componentErrors) {
      viewModel.errors = componentErrors;
    }
    if (componentError) {
      viewModel.errorMessage = {
        text: componentError.text
      };
    }
    return {
      ...viewModel,
      label: {
        text: label
      },
      id: name,
      name,
      value: payload[name]
    };
  }
  getDisplayStringFromState(state) {
    const value = this.getFormValueFromState(state);
    return this.isValue(value) ? value.toString() : '';
  }
  getContextValueFromState(state) {
    const value = this.getFormValueFromState(state);

    // Filter object field values
    if (this.isState(value)) {
      const values = Object.values(value).filter(isFormValue);
      return values.length ? values : null;
    }

    // Filter array field values
    if (this.isValue(value) && Array.isArray(value)) {
      return value.filter(isFormValue);
    }
    return this.isValue(value) ? value : null;
  }
  isValue(value) {
    return isFormValue(value);
  }
  isState(value) {
    return isFormState(value);
  }
}

/**
 * Check for form value
 */
export function isFormValue(value) {
  return typeof value === 'string' && value.length > 0 || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Check for form state with nested values
 */
export function isFormState(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  // Skip empty objects
  return !!Object.values(value).length;
}

/**
 * Check for repeat list state
 */
export function isRepeatState(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  // Skip checks when empty
  if (!value.length) {
    return true;
  }
  return value.every(isRepeatValue);
}

/**
 * Check for repeat list value
 */
export function isRepeatValue(value) {
  return isFormState(value) && typeof value.itemId === 'string';
}

/**
 * Check for upload state
 */
export function isUploadState(value) {
  if (!Array.isArray(value)) {
    return false;
  }

  // Skip checks when empty
  if (!value.length) {
    return true;
  }
  return value.every(isUploadValue);
}

/**
 * Check for upload state value
 */
export function isUploadValue(value) {
  return isFormState(value) && typeof value.uploadId === 'string';
}
//# sourceMappingURL=FormComponent.js.map