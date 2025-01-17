import joi from 'joi';
import { FormComponent, isFormState, isFormValue } from "./FormComponent.js";
import { createComponent } from "./helpers.js";
import { getErrors } from "../helpers.js";
import { validationOptions as opts } from "../pageControllers/validationOptions.js";
export class ComponentCollection {
  page;
  parent;
  components;
  fields;
  guidance;
  formSchema;
  stateSchema;
  constructor(defs, props, schema) {
    const components = defs.map(def => createComponent(def, props));
    const fields = components.filter(component => component.isFormComponent);
    const guidance = components.filter(component => !component.isFormComponent);
    let formSchema = joi.object().required();
    let stateSchema = joi.object().required();

    // Add each field or concat collection
    for (const field of fields) {
      const {
        collection,
        name
      } = field;
      formSchema = collection ? formSchema.concat(collection.formSchema) : formSchema.keys({
        [name]: field.formSchema
      });
      stateSchema = collection ? stateSchema.concat(collection.stateSchema) : stateSchema.keys({
        [name]: field.stateSchema
      });
    }

    // Add parent field title to collection field errors
    formSchema = formSchema.error(errors => {
      return errors.flatMap(error => {
        if (!isErrorContext(error.local) || error.local.title) {
          return error;
        }

        // Use field key or first missing child field
        let {
          missing,
          key = missing?.[0]
        } = error.local;

        // But avoid numeric key used by array payloads
        if (typeof key === 'number') {
          key = error.path[0];
        }

        // Find the parent field
        const parent = fields.find(item => item.name === key?.split('__').shift());

        // Find the child field
        const child = (parent?.collection?.fields ?? fields).find(item => item.name === key);

        // Update error with child label
        if (child && (!error.local.label || error.local.label === 'value')) {
          error.local.label = child.title.toLowerCase();
        }

        // Fix error summary links for missing fields
        if (missing?.length) {
          error.path = missing;
          error.local.key = missing[0];
        }

        // Update error with parent title
        error.local.title ??= parent?.title;
        return error;
      });
    });
    if (schema?.peers) {
      formSchema = formSchema.and(...schema.peers, {
        isPresent: isFormValue
      });
    }
    if (schema?.custom) {
      formSchema = formSchema.custom(schema.custom);
    }
    this.page = props.page;
    this.parent = props.parent;
    this.components = components;
    this.fields = fields;
    this.guidance = guidance;
    this.formSchema = formSchema;
    this.stateSchema = stateSchema;
  }
  get keys() {
    return this.fields.flatMap(field => {
      const {
        name,
        collection
      } = field;
      if (collection) {
        const {
          fields
        } = collection;
        return [name, ...fields.map(({
          name
        }) => name)];
      }
      return [name];
    });
  }
  getFormDataFromState(state) {
    const payload = {};
    this.fields.forEach(component => {
      Object.assign(payload, component.getFormDataFromState(state));
    });
    return payload;
  }
  getFormValueFromState(state) {
    const payload = {};

    // Remove name prefix for formatted value
    for (const [name, value] of Object.entries(this.getFormDataFromState(state))) {
      const key = name.split('__').pop();
      if (!key) {
        continue;
      }
      payload[key] = value;
    }
    return payload;
  }
  getStateFromValidForm(payload) {
    const state = {};
    this.fields.forEach(component => {
      Object.assign(state, component.getStateFromValidForm(payload));
    });
    return state;
  }
  getContextValueFromState(state) {
    const context = {};
    for (const component of this.fields) {
      context[component.name] = component.getContextValueFromState(state);
    }
    return context;
  }
  getErrors(errors) {
    const {
      fields
    } = this;
    const list = [];

    // Add only one error per field
    for (const field of fields) {
      const error = field.getError(errors);
      if (error) {
        list.push(error);
      }
    }
    if (!list.length) {
      return;
    }
    return list;
  }
  getViewModel(payload, errors, query = {}) {
    const {
      components
    } = this;
    const result = components.map(component => {
      const {
        isFormComponent,
        type
      } = component;
      const model = component instanceof FormComponent ? component.getViewModel(payload, errors, query) : component.getViewModel();
      return {
        type,
        isFormComponent,
        model
      };
    });
    return result;
  }

  /**
   * Validate form payload
   */
  validate(value = {}) {
    const result = this.formSchema.validate(value, opts);
    const details = result.error?.details;
    return {
      value: result.value ?? {},
      errors: this.page?.getErrors(details) ?? getErrors(details)
    };
  }
}

/**
 * Check for field local state
 */
export function isErrorContext(value) {
  return isFormState(value) && typeof value.label === 'string';
}
//# sourceMappingURL=ComponentCollection.js.map