import Joi from 'joi';
import { FormComponent } from "./FormComponent.js";
export class MultilineTextField extends FormComponent {
  isCharacterOrWordCount = false;
  constructor(def, props) {
    super(def, props);
    const {
      schema,
      options,
      title
    } = def;
    let formSchema = Joi.string().trim().label(title.toLowerCase()).required();
    if (options.required === false) {
      formSchema = formSchema.allow('');
    }
    if (typeof schema.length !== 'number') {
      if (typeof schema.max === 'number') {
        formSchema = formSchema.max(schema.max);
        this.isCharacterOrWordCount = true;
      }
      if (typeof schema.min === 'number') {
        formSchema = formSchema.min(schema.min);
      }
    } else {
      formSchema = formSchema.length(schema.length);
    }
    if (typeof options.maxWords === 'number') {
      formSchema = formSchema.custom(getValidatorMaxWords(this), 'max words validation');
      this.isCharacterOrWordCount = true;
    }
    if (schema.regex) {
      const pattern = new RegExp(schema.regex);
      formSchema = formSchema.pattern(pattern);
    }
    if (options.customValidationMessage) {
      const message = options.customValidationMessage;
      formSchema = formSchema.messages({
        'any.required': message,
        'string.empty': message,
        'string.max': message,
        'string.min': message,
        'string.length': message,
        'string.pattern.base': message,
        'string.maxWords': message
      });
    } else if (options.customValidationMessages) {
      formSchema = formSchema.messages(options.customValidationMessages);
    }
    this.formSchema = formSchema.default('');
    this.stateSchema = formSchema.default(null).allow(null);
    this.options = options;
    this.schema = schema;
  }
  getViewModel(payload, errors) {
    const {
      schema,
      options,
      isCharacterOrWordCount
    } = this;
    const viewModel = super.getViewModel(payload, errors);
    let {
      maxlength,
      maxwords,
      rows
    } = viewModel;
    if (schema.max) {
      maxlength = schema.max;
    }
    if (options.maxWords) {
      maxwords = options.maxWords;
    }
    if (options.rows) {
      maxwords = options.rows;
    }
    return {
      ...viewModel,
      isCharacterOrWordCount,
      maxlength,
      maxwords,
      rows
    };
  }
}
function getValidatorMaxWords(component) {
  const validator = (value, helpers) => {
    const {
      options
    } = component;
    const {
      customValidationMessage: custom,
      maxWords: limit // See {{#limit}} variable
    } = options;
    if (!limit || count(value) <= limit) {
      return value;
    }
    return custom ? helpers.message({
      custom
    }, {
      limit
    }) : helpers.error('string.maxWords', {
      limit
    });
  };

  /**
   * Count the number of words in the given text
   * @see GOV.UK Frontend {@link https://github.com/alphagov/govuk-frontend/blob/v5.4.0/packages/govuk-frontend/src/govuk/components/character-count/character-count.mjs#L343 | Character count `maxwords` implementation}
   */
  function count(text) {
    const tokens = text.match(/\S+/g) ?? [];
    return tokens.length;
  }
  return validator;
}
//# sourceMappingURL=MultilineTextField.js.map