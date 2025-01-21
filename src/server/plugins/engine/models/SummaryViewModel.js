import { getAnswer } from "../components/helpers.js";
import { getError, getPageHref } from "../helpers.js";
import { RepeatPageController } from "../pageControllers/RepeatPageController.js";
import { validationOptions as opts } from "../pageControllers/validationOptions.js";
export class SummaryViewModel {
  /**
   * Responsible for parsing state values to the govuk-frontend summary list template
   */

  page;
  pageTitle;
  declaration;
  details;
  checkAnswers;
  context;
  name;
  backLink;
  feedbackLink;
  phaseTag;
  errors;
  serviceUrl;
  hasMissingNotificationEmail;
  constructor(request, page, context) {
    const {
      model
    } = page;
    const {
      basePath,
      def,
      sections
    } = model;
    const {
      isForceAccess,
      state
    } = context;
    this.page = page;
    this.pageTitle = page.title;
    this.serviceUrl = `/${basePath}`;
    this.name = def.name;
    this.declaration = def.declaration;
    this.context = context;
    const result = model.makeFilteredSchema(this.context.relevantPages).validate(this.context.relevantState, {
      ...opts,
      stripUnknown: true
    });

    // Format errors
    this.errors = result.error?.details.map(getError);
    this.details = this.summaryDetails(request, sections);
    
    // Format check answers
    this.checkAnswers = this.details.map(detail => {
      const {
        title
      } = detail;
      const rows = detail.items.map(item => {
        const items = [];

        // Remove summary list actions from previews
        if (!isForceAccess) {
          items.push({
            href: item.href,
            text: 'Change',
            classes: 'govuk-link--no-visited-state',
            visuallyHiddenText: item.label
          });
        }
        return {
          key: {
            text: item.title
          },
          value: {
            classes: 'app-prose-scope',
            html: item.value || 'Not supplied'
          },
          actions: {
            items
          }
        };
      });


      return {
        title: title ? {
          text: title
        } : undefined,
        summaryList: {
          rows
        }
      };
    });
  }
  summaryDetails(request, sections) {
    const {
      context,
      errors
    } = this;
    const {
      relevantPages,
      state
    } = context;
    const details = [];
    [undefined, ...sections].forEach(section => {
      const items = [];
      const sectionPages = relevantPages.filter(page => page.section === section);
      sectionPages.forEach(page => {
        const {
          collection,
          path
        } = page;
        if (page instanceof RepeatPageController) {
          items.push(ItemRepeat(page, state, {
            path: page.getSummaryPath(request),
            errors
          }));
        } else {
          for (const field of collection.fields) {
            items.push(ItemField(page, state, field, {
              path,
              errors
            }));
          }
        }
      });
      if (items.length) {
        details.push({
          name: section?.name,
          title: section?.title,
          items
        });
      }
    });
    return details;
  }
}

/**
 * Creates a repeater detail item
 * @see {@link DetailItemField}
 */
function ItemRepeat(page, state, options) {
  const {
    collection,
    repeat
  } = page;
  const {
    name,
    title
  } = repeat.options;
  const values = page.getListFromState(state);
  const unit = values.length === 1 ? title : `${title}s`;
  return {
    name,
    label: title,
    title: values.length ? `${unit} added` : unit,
    value: values.length ? `You added ${values.length} ${unit}` : '',
    href: getPageHref(page, options.path, {
      returnUrl: getPageHref(page, page.getSummaryPath())
    }),
    state,
    page,
    // Repeater field detail items
    subItems: values.map(repeatState => collection.fields.map(field => ItemField(page, repeatState, field, options)))
  };
}

/**
 * Creates a form field detail item
 * @see {@link DetailItemField}
 */
function ItemField(page, state, field, options) {
  return {
    name: field.name,
    label: field.title,
    title: field.title,
    error: field.getError(options.errors),
    value: getAnswer(field, state),
    href: getPageHref(page, options.path, {
      returnUrl: getPageHref(page, page.getSummaryPath())
    }),
    state,
    page,
    field
  };
}
//# sourceMappingURL=SummaryViewModel.js.map