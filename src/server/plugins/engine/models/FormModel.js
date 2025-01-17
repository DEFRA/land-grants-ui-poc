import { ConditionsModel, ControllerPath, ControllerType, formDefinitionSchema, hasRepeater } from '@defra/forms-model';
import { add } from 'date-fns';
import { Parser } from 'expr-eval';
import joi from 'joi';
import { findPage, getError, getPage } from "../helpers.js";
import { createPage } from "../pageControllers/helpers.js";
import { validationOptions as opts } from "../pageControllers/validationOptions.js";
import { FormAction } from "../../../routes/types.js";
import { merge } from "../../../services/cacheService.js";
export class FormModel {
  /**
   * Responsible for instantiating the {@link PageControllerClass} and condition context from a form JSON
   */

  /** the entire form JSON as an object */
  def;
  lists;
  sections = [];
  name;
  values;
  basePath;
  conditions;
  pages;
  constructor(def, options) {
    const result = formDefinitionSchema.validate(def, {
      abortEarly: false
    });
    if (result.error) {
      throw result.error;
    }

    // Make a clone of the shallow copy returned
    // by joi so as not to change the source data.
    def = structuredClone(result.value);

    // Add default lists
    def.lists.push({
      name: '__yesNo',
      title: 'Yes/No',
      type: 'boolean',
      items: [{
        text: 'Yes',
        value: true
      }, {
        text: 'No',
        value: false
      }]
    });
    this.def = def;
    this.lists = def.lists;
    this.sections = def.sections;
    this.name = def.name ?? '';
    this.values = result.value;
    this.basePath = options.basePath;
    this.conditions = {};
    def.conditions.forEach(conditionDef => {
      const condition = this.makeCondition(conditionDef);
      this.conditions[condition.name] = condition;
    });
    this.pages = def.pages.map(pageDef => createPage(this, pageDef));
    if (!def.pages.some(({
      controller
    }) =>
    // Check for user-provided status page (optional)
    controller === ControllerType.Status)) {
      this.pages.push(createPage(this, {
        title: 'Form submitted',
        path: ControllerPath.Status,
        controller: ControllerType.Status
      }));
    }
  }

  /**
   * build the entire model schema from individual pages/sections
   */
  makeSchema() {
    return this.makeFilteredSchema(this.pages);
  }

  /**
   * build the entire model schema from individual pages/sections and filter out answers
   * for pages which are no longer accessible due to an answer that has been changed
   */
  makeFilteredSchema(relevantPages) {
    // Build the entire model schema
    // from the individual pages/sections
    let schema = joi.object().required();
    relevantPages.forEach(page => {
      schema = schema.concat(page.collection.stateSchema);
    });
    return schema;
  }

  /**
   * Instantiates a Condition based on {@link ConditionWrapper}
   * @param condition
   */
  makeCondition(condition) {
    const parser = new Parser({
      operators: {
        logical: true
      }
    });
    Object.assign(parser.functions, {
      dateForComparison(timePeriod, timeUnit) {
        return add(new Date(), {
          [timeUnit]: timePeriod
        }).toISOString();
      }
    });
    const {
      name,
      displayName,
      value
    } = condition;
    const expr = this.toConditionExpression(value, parser);
    const fn = evaluationState => {
      const ctx = this.toConditionContext(evaluationState, this.conditions);
      try {
        return expr.evaluate(ctx);
      } catch {
        return false;
      }
    };
    return {
      name,
      displayName,
      value,
      expr,
      fn
    };
  }
  toConditionContext(evaluationState, conditions) {
    const context = {
      ...evaluationState
    };
    for (const key in conditions) {
      Object.defineProperty(context, key, {
        get() {
          return conditions[key]?.fn(evaluationState);
        }
      });
    }
    return context;
  }
  toConditionExpression(value, parser) {
    const conditions = ConditionsModel.from(value);
    return parser.parse(conditions.toExpression());
  }
  getList(name) {
    return this.lists.find(list => list.name === name);
  }

  /**
   * Form context for the current page
   */
  getFormContext(request, state) {
    const {
      query
    } = request;
    const page = getPage(this, request);

    // Determine form paths
    const currentPath = page.path;
    const startPath = page.getStartPath();

    // Preview URL direct access is allowed
    const isForceAccess = 'force' in query;
    let context = {
      evaluationState: {},
      relevantState: {},
      relevantPages: [],
      payload: page.getFormDataFromState(request, state),
      state,
      paths: [],
      isForceAccess
    };

    // Validate current page
    context = validateFormPayload(request, page, context);

    // Find start page
    let nextPage = findPage(this, startPath);

    // Walk form pages from start
    while (nextPage) {
      const {
        collection,
        pageDef
      } = nextPage;

      // Add page to context
      context.relevantPages.push(nextPage);

      // Skip evaluation state for repeater pages
      if (!hasRepeater(pageDef)) {
        Object.assign(context.evaluationState, collection.getContextValueFromState(context.state));
      }

      // Copy relevant state by expected keys
      for (const key of nextPage.keys) {
        if (typeof context.state[key] !== 'undefined') {
          context.relevantState[key] = context.state[key];
        }
      }

      // Stop at current page
      if (nextPage.path === currentPath) {
        break;
      }

      // Apply conditions to determine next page
      nextPage = findPage(this, nextPage.getNextPath(context));
    }

    // Validate form state
    context = validateFormState(request, page, context);

    // Add paths for navigation
    for (const {
      keys,
      path
    } of context.relevantPages) {
      context.paths.push(path);

      // Stop at page with errors
      if (context.errors?.some(({
        name,
        path
      }) => {
        return keys.includes(name) || keys.some(key => path.includes(key));
      })) {
        break;
      }
    }
    return context;
  }
}

/**
 * Validate current page only
 */
function validateFormPayload(request, page, context) {
  const {
    collection
  } = page;
  const {
    payload,
    state
  } = context;
  const {
    action
  } = page.getFormParams(request);

  // Skip validation GET requests or other actions
  if (!request.payload || action !== FormAction.Validate) {
    return context;
  }

  // Validate form data into payload
  const {
    value,
    errors
  } = collection.validate({
    ...payload,
    ...request.payload
  });

  // Add sanitised payload (ready to save)
  const formState = page.getStateFromValidForm(request, state, value);
  return {
    ...context,
    payload: merge(payload, value),
    state: merge(state, formState),
    errors
  };
}

/**
 * Validate entire form state
 */
function validateFormState(request, page, context) {
  const {
    errors = [],
    relevantPages,
    relevantState
  } = context;

  // Exclude current page
  const previousPages = relevantPages.filter(relevantPage => relevantPage !== page);

  // Validate relevant state
  const {
    error
  } = page.model.makeFilteredSchema(previousPages).validate(relevantState, {
    ...opts,
    stripUnknown: true
  });

  // Add relevant state errors
  if (error) {
    const errorsState = error.details.map(getError);
    return {
      ...context,
      errors: errors.concat(errorsState)
    };
  }
  return context;
}
//# sourceMappingURL=FormModel.js.map