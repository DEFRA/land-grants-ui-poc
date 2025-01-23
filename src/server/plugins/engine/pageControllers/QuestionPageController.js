import { ComponentType, ControllerType, Engine, hasComponents, hasNext, hasRepeater } from '@defra/forms-model';
import { actionSchema, crumbSchema, paramsSchema } from "../../../schemas/index.js";
import { merge } from "../../../services/cacheService.js";
import { ComponentCollection } from "../components/ComponentCollection.js";
import { optionalText } from "../components/constants.js";
import { getErrors, normalisePath, proceed } from "../helpers.js";
import { PageController } from "./PageController.js";
export class QuestionPageController extends PageController {
  collection;
  errorSummaryTitle = 'There is a problem';
  constructor(model, pageDef) {
    super(model, pageDef);

    // Components collection
    this.collection = new ComponentCollection(hasComponents(pageDef) ? pageDef.components : [], {
      model,
      page: this
    });
    this.collection.formSchema = this.collection.formSchema.keys({
      crumb: crumbSchema,
      action: actionSchema
    });
  }
  get next() {
    const {
      def,
      pageDef
    } = this;
    if (!hasNext(pageDef)) {
      return [];
    }

    // Remove stale links
    return pageDef.next.filter(({
      path
    }) => {
      const linkPath = normalisePath(path);
      return def.pages.some(page => {
        const pagePath = normalisePath(page.path);
        return pagePath === linkPath;
      });
    });
  }
  get allowContinue() {
    if (this.model.engine === Engine.V2) {
      return this.pageDef.controller !== ControllerType.Terminal;
    }
    return this.next.length > 0;
  }
  getItemId(request) {
    const {
      itemId
    } = this.getFormParams(request);
    return itemId ?? request?.params.itemId;
  }

  /**
   * Used for mapping form payloads and errors to govuk-frontend's template api, so a page can be rendered
   * @param request - the hapi request
   * @param context - the form context
   */
  getViewModel(request, context) {
    const {
      collection,
      viewModel
    } = this;
    const {
      query
    } = request;
    const {
      payload,
      errors
    } = context;
    let {
      pageTitle,
      showTitle
    } = viewModel;
    const components = collection.getViewModel(payload, errors, query);
    const formComponents = components.filter(({
      isFormComponent
    }) => isFormComponent);

    // Single form component? Hide title and customise label or legend instead
    if (formComponents.length === 1) {
      const {
        model
      } = formComponents[0];
      const {
        fieldset,
        label
      } = model;

      // Set as page heading when not following other content
      const isPageHeading = formComponents[0] === components[0];

      // Check for legend or label
      const labelOrLegend = fieldset?.legend ?? label;

      // Use legend or label as page heading
      if (labelOrLegend) {
        const size = isPageHeading ? 'l' : 'm';
        labelOrLegend.classes = labelOrLegend === label ? `govuk-label--${size}` : `govuk-fieldset__legend--${size}`;
        if (isPageHeading) {
          labelOrLegend.isPageHeading = isPageHeading;

          // Check for optional in label
          const isOptional = this.collection.fields.at(0)?.options.required === false;
          if (pageTitle) {
            labelOrLegend.text = isOptional ? `${pageTitle}${optionalText}` : pageTitle;
          }
          pageTitle = pageTitle || labelOrLegend.text;
        }
      }
      showTitle = !isPageHeading;
    }
    return {
      ...viewModel,
      backLink: this.getBackLink(request, context),
      context,
      showTitle,
      components,
      errors
    };
  }
  getRelevantPath(request, context) {
    const {
      paths
    } = context;
    const startPath = this.getStartPath();
    const relevantPath = paths.at(-1) ?? startPath;
    return !paths.length ? startPath // First possible path
    : relevantPath; // Last possible path
  }

  /**
   * Apply conditions to evaluation state to determine next page path
   */
  getNextPath(context) {
    const {
      model,
      next,
      path
    } = this;
    const {
      evaluationState
    } = context;
    const summaryPath = this.getSummaryPath();
    const statusPath = this.getStatusPath();

    // Walk from summary page (no next links) to status page
    let defaultPath = path === summaryPath ? statusPath : undefined;
    if (model.engine === Engine.V2) {
      if (this.pageDef.controller !== ControllerType.Terminal) {
        const {
          pages
        } = this.model;
        const pageIndex = pages.indexOf(this);

        // The "next" page is the first found after the current which is
        // either unconditional or has a condition that evaluates to "true"
        const nextPage = pages.slice(pageIndex + 1).find(page => {
          const {
            condition
          } = page;
          if (condition) {
            const conditionResult = condition.fn(evaluationState);
            if (!conditionResult) {
              return false;
            }
          }
          return true;
        });
        return nextPage?.path ?? defaultPath;
      } else {
        return defaultPath;
      }
    }
    const nextLink = next.find(link => {
      const {
        condition
      } = link;
      if (condition) {
        return model.conditions[condition]?.fn(evaluationState) ?? false;
      }
      defaultPath = link.path;
      return false;
    });
    return nextLink?.path ?? defaultPath;
  }

  /**
   * Gets the form payload (from state) for this page only
   */
  getFormDataFromState(request, state) {
    const {
      collection
    } = this;

    // Form params from request
    const params = this.getFormParams(request);

    // Form payload from state
    const payload = collection.getFormDataFromState(state);
    return {
      ...params,
      ...payload
    };
  }

  /**
   * Gets form params (from payload) for this page only
   */
  getFormParams(request) {
    const {
      payload
    } = request ?? {};
    const result = paramsSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true
    });
    return result.value;
  }
  getStateFromValidForm(request, state, payload) {
    return this.collection.getStateFromValidForm(payload);
  }
  getErrors(details) {
    return getErrors(details);
  }
  async getState(request) {
    const {
      query
    } = request;

    // Skip get for preview URL direct access
    if ('force' in query) {
      return {};
    }
    const {
      cacheService
    } = request.services([]);
    return cacheService.getState(request);
  }
  async setState(request, state) {
    const {
      query
    } = request;

    // Skip set for preview URL direct access
    if ('force' in query) {
      return state;
    }
    const {
      cacheService
    } = request.services([]);
    return cacheService.setState(request, state);
  }
  async mergeState(request, state, update) {
    const {
      query
    } = request;

    // Merge state before set
    const updated = merge(state, update);

    // Skip set for preview URL direct access
    if ('force' in query) {
      return updated;
    }
    const {
      cacheService
    } = request.services([]);
    return cacheService.setState(request, updated);
  }
  makeGetRouteHandler() {
    return async (request, context, h) => {
      const {
        collection,
        model,
        viewName
      } = this;
      const {
        evaluationState
      } = context;
      const viewModel = this.getViewModel(request, context);
      viewModel.errors = collection.getErrors(viewModel.errors);

      /**
       * Content components can be hidden based on a condition. If the condition evaluates to true, it is safe to be kept, otherwise discard it
       */

      // Filter our components based on their conditions using our evaluated state
      viewModel.components = viewModel.components.filter(component => {
        if ((!!component.model.content || component.type === ComponentType.Details) && component.model.condition) {
          const condition = model.conditions[component.model.condition];
          return condition?.fn(evaluationState);
        }
        return true;
      });

      /**
       * For conditional reveal components (which we no longer support until GDS resolves the related accessibility issues {@link https://github.com/alphagov/govuk-frontend/issues/1991}
       */
      viewModel.components = viewModel.components.map(component => {
        const evaluatedComponent = component;
        const content = evaluatedComponent.model.content;
        if (content instanceof Array) {
          evaluatedComponent.model.content = content.filter(item => item.condition ? model.conditions[item.condition]?.fn(evaluationState) : true);
        }
        // apply condition to items for radios, checkboxes etc
        const items = evaluatedComponent.model.items;
        if (items instanceof Array) {
          evaluatedComponent.model.items = items.filter(item => item.condition ? model.conditions[item.condition]?.fn(evaluationState) : true);
        }
        return evaluatedComponent;
      });
      viewModel.hasMissingNotificationEmail = await this.hasMissingNotificationEmail(request, context);
      return h.view(viewName, viewModel);
    };
  }
  async hasMissingNotificationEmail(request, context) {
    const {
      path
    } = this;
    const {
      params
    } = request;
    const {
      isForceAccess
    } = context;
    const startPath = this.getStartPath();
    const summaryPath = this.getSummaryPath();
    const {
      formsService
    } = this.model.services;
    const {
      getFormMetadata
    } = formsService;

    // Warn the user if the form has no notification email set only on start page and summary page
    // if ([startPath, summaryPath].includes(path) && !isForceAccess) {
    //   const {
    //     notificationEmail
    //   } = await getFormMetadata(params.slug);
    //   return !notificationEmail;
    // }
    return false;
  }

  /**
   * Get the back link for a given progress.
   */
  getBackLink(request, context) {
    const {
      pageDef
    } = this;
    const {
      path,
      query
    } = request;
    const {
      returnUrl
    } = query;
    const {
      paths
    } = context;
    const itemId = this.getItemId(request);

    // Check answers back link
    if (returnUrl) {
      return {
        text: hasRepeater(pageDef) && itemId ? 'Go back to add another' : 'Go back to check answers',
        href: returnUrl
      };
    }

    // Item delete pages etc
    const backPath = itemId && !path.endsWith(itemId) ? paths.at(-1) // Back to main page
    : paths.at(-2); // Back to previous page

    // No back link
    if (!backPath) {
      return;
    }

    // Default back link
    return {
      text: 'Back',
      href: this.getHref(backPath)
    };
  }
  makePostRouteHandler() {
    return async (request, context, h) => {
      const {
        collection,
        viewName
      } = this;
      const {
        isForceAccess,
        state
      } = context;

      /**
       * If there are any errors, render the page with the parsed errors
       * @todo Refactor to match POST REDIRECT GET pattern
       */
      if (context.errors || isForceAccess) {
        const viewModel = this.getViewModel(request, context);
        viewModel.errors = collection.getErrors(viewModel.errors);
        return h.view(viewName, viewModel);
      }

      // Save and proceed
      await this.setState(request, state);
      return this.proceed(request, h, this.getNextPath(context));
    };
  }
  proceed(request, h, nextPath) {
    const nextUrl = nextPath ? this.getHref(nextPath) // Redirect to next page
    : this.href; // Redirect to current page (refresh)

    return proceed(request, h, nextUrl);
  }

  /**
   * {@link https://hapi.dev/api/?v=20.1.2#route-options}
   */
  get getRouteOptions() {
    return {
      ext: {
        onPostHandler: {
          method(_request, h) {
            return h.continue;
          }
        }
      }
    };
  }

  /**
   * {@link https://hapi.dev/api/?v=20.1.2#route-options}
   */
  get postRouteOptions() {
    return {
      payload: {
        parse: true,
        maxBytes: Number.MAX_SAFE_INTEGER,
        failAction: 'ignore'
      },
      ext: {
        onPostHandler: {
          method(_request, h) {
            return h.continue;
          }
        }
      }
    };
  }
}
//# sourceMappingURL=QuestionPageController.js.map