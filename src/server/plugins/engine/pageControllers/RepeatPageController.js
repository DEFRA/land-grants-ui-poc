import { randomUUID } from 'crypto';
import Boom from '@hapi/boom';
import Joi from 'joi';
import { isRepeatState } from "../components/FormComponent.js";
import { redirectPath } from "../helpers.js";
import { QuestionPageController } from "./QuestionPageController.js";
import { FormAction } from "../../../routes/types.js";
export class RepeatPageController extends QuestionPageController {
  listSummaryViewName = 'repeat-list-summary';
  listDeleteViewName = 'item-delete';
  repeat;
  constructor(model, pageDef) {
    super(model, pageDef);
    this.repeat = pageDef.repeat;
    const {
      options,
      schema
    } = this.repeat;
    const itemId = Joi.string().uuid().required();
    this.collection.formSchema = this.collection.formSchema.append({
      itemId
    });
    this.collection.stateSchema = Joi.object().keys({
      [options.name]: Joi.array().items(this.collection.stateSchema.append({
        itemId
      })).min(schema.min).max(schema.max).label(`${options.title} list`).required()
    });
  }
  get keys() {
    const {
      repeat
    } = this;
    return [repeat.options.name, ...super.keys];
  }
  getFormParams(request) {
    const params = super.getFormParams(request);

    // Apply an itemId to the form payload
    if (request?.payload) {
      params.itemId = request.params.itemId ?? randomUUID();
    }
    return params;
  }
  getFormDataFromState(request, state) {
    const {
      repeat
    } = this;
    const params = this.getFormParams(request);
    const list = this.getListFromState(state);
    const itemId = this.getItemId(request);

    // Create payload with repeater list state
    if (!itemId) {
      return {
        ...params,
        [repeat.options.name]: list
      };
    }

    // Create payload with repeater item state
    const item = this.getItemFromList(list, itemId);
    return {
      ...params,
      ...item
    };
  }
  getStateFromValidForm(request, state, payload) {
    const itemId = this.getItemId(request);
    if (!itemId) {
      throw Boom.badRequest('No item ID found');
    }
    const list = this.getListFromState(state);
    const item = this.getItemFromList(list, itemId);
    const itemState = super.getStateFromValidForm(request, state, payload);
    const updated = {
      ...itemState,
      itemId
    };
    const newList = [...list];
    if (!item) {
      // Adding a new item
      newList.push(updated);
    } else {
      // Update an existing item
      newList[list.indexOf(item)] = updated;
    }
    return {
      [this.repeat.options.name]: newList
    };
  }
  proceed(request, h) {
    const nextPath = this.getSummaryPath(request);
    return super.proceed(request, h, nextPath);
  }
  getItemFromList(list, itemId) {
    return list.find(item => item.itemId === itemId);
  }
  getListFromState(state) {
    const {
      name
    } = this.repeat.options;
    const values = state[name];
    return isRepeatState(values) ? values : [];
  }
  makeGetRouteHandler() {
    return async (request, context, h) => {
      const {
        path
      } = this;
      const {
        query
      } = request;
      const {
        state
      } = context;
      const itemId = this.getItemId(request);
      const list = this.getListFromState(state);
      if (!itemId) {
        const summaryPath = this.getSummaryPath(request);
        const nextPath = redirectPath(`${path}/${randomUUID()}`, {
          returnUrl: query.returnUrl,
          force: query.force
        });

        // Only redirect to new item when list is empty
        return super.proceed(request, h, list.length ? summaryPath : nextPath);
      }
      return super.makeGetRouteHandler()(request, context, h);
    };
  }
  makeGetListSummaryRouteHandler() {
    return (request, context, h) => {
      const {
        path
      } = this;
      const {
        query
      } = request;
      const {
        state
      } = context;
      const list = this.getListFromState(state);
      if (!list.length) {
        const nextPath = redirectPath(`${path}/${randomUUID()}`, {
          returnUrl: query.returnUrl
        });
        return super.proceed(request, h, nextPath);
      }
      const viewModel = this.getListSummaryViewModel(request, context, list);
      return h.view(this.listSummaryViewName, viewModel);
    };
  }
  makePostListSummaryRouteHandler() {
    return (request, context, h) => {
      const {
        path,
        repeat
      } = this;
      const {
        query
      } = request;
      const {
        schema,
        options
      } = repeat;
      const {
        state
      } = context;
      const list = this.getListFromState(state);
      if (!list.length) {
        const nextPath = redirectPath(`${path}/${randomUUID()}`, {
          returnUrl: query.returnUrl
        });
        return super.proceed(request, h, nextPath);
      }
      const {
        action
      } = this.getFormParams(request);
      const hasErrorMin = action === FormAction.Continue && list.length < schema.min;
      const hasErrorMax = action === FormAction.AddAnother && list.length >= schema.max || action === FormAction.Continue && list.length > schema.max;

      // Show error if repeat limits apply
      if (hasErrorMin || hasErrorMax) {
        const count = hasErrorMax ? schema.max : schema.min;
        const itemTitle = `${options.title}${count === 1 ? '' : 's'}`;
        context.errors = [{
          path: [],
          href: '',
          name: '',
          text: hasErrorMax ? `You can only add up to ${count} ${itemTitle}` : `You must add at least ${count} ${itemTitle}`
        }];
        const viewModel = this.getListSummaryViewModel(request, context, list);
        return h.view(this.listSummaryViewName, viewModel);
      }
      if (action === FormAction.AddAnother) {
        const nextPath = redirectPath(`${path}/${randomUUID()}`, {
          returnUrl: query.returnUrl
        });
        return super.proceed(request, h, nextPath);
      }
      const nextPath = this.getNextPath(context);
      return super.proceed(request, h, nextPath);
    };
  }
  makeGetItemDeleteRouteHandler() {
    return (request, context, h) => {
      const {
        viewModel
      } = this;
      const {
        state
      } = context;
      const list = this.getListFromState(state);
      const itemId = this.getItemId(request);
      const item = this.getItemFromList(list, itemId);
      if (!item || list.length === 1) {
        throw Boom.notFound(item ? 'Last list item cannot be removed' : 'List item to remove not found');
      }
      const {
        title
      } = this.repeat.options;
      return h.view(this.listDeleteViewName, {
        ...viewModel,
        context,
        backLink: this.getBackLink(request, context),
        pageTitle: `Are you sure you want to remove this ${title}?`,
        itemTitle: `${title} ${list.indexOf(item) + 1}`,
        buttonConfirm: {
          text: `Remove ${title}`
        },
        buttonCancel: {
          text: 'Cancel'
        }
      });
    };
  }
  makePostItemDeleteRouteHandler() {
    return async (request, context, h) => {
      const {
        repeat
      } = this;
      const {
        state
      } = context;
      const {
        confirm
      } = this.getFormParams(request);
      const list = this.getListFromState(state);
      const itemId = this.getItemId(request);
      const item = this.getItemFromList(list, itemId);
      if (!item || list.length === 1) {
        throw Boom.notFound(item ? 'Last list item cannot be removed' : 'List item to remove not found');
      }

      // Remove the item from the list
      if (confirm) {
        list.splice(list.indexOf(item), 1);
        const update = {
          [repeat.options.name]: list
        };
        await this.mergeState(request, state, update);
      }
      return this.proceed(request, h);
    };
  }
  getViewModel(request, context) {
    const {
      state
    } = context;
    const list = this.getListFromState(state);
    const itemId = this.getItemId(request);
    const item = this.getItemFromList(list, itemId);
    const viewModel = super.getViewModel(request, context);
    const itemNumber = item ? list.indexOf(item) + 1 : list.length + 1;
    const repeatCaption = `${this.repeat.options.title} ${itemNumber}`;
    return {
      ...viewModel,
      sectionTitle: viewModel.sectionTitle ? `${viewModel.sectionTitle}: ${repeatCaption}` : repeatCaption
    };
  }
  getListSummaryViewModel(request, context, list) {
    const {
      collection,
      href,
      repeat
    } = this;
    const {
      query
    } = request;
    const {
      isForceAccess,
      errors
    } = context;
    const {
      title
    } = repeat.options;
    const summaryList = {
      classes: 'govuk-summary-list--long-actions',
      rows: []
    };
    let count = 0;
    if (Array.isArray(list)) {
      count = list.length;
      const summaryPath = this.getSummaryPath(request);
      list.forEach((item, index) => {
        const items = [];

        // Remove summary list actions from previews
        if (!isForceAccess) {
          items.push({
            href: redirectPath(`${href}/${item.itemId}`, {
              returnUrl: query.returnUrl ?? this.getHref(summaryPath)
            }),
            text: 'Change',
            classes: 'govuk-link--no-visited-state',
            visuallyHiddenText: `item ${index + 1}`
          });
          if (count > 1) {
            items.push({
              href: redirectPath(`${href}/${item.itemId}/confirm-delete`, {
                returnUrl: query.returnUrl
              }),
              text: 'Remove',
              classes: 'govuk-link--no-visited-state',
              visuallyHiddenText: `item ${index + 1}`
            });
          }
        }
        const itemDisplayText = collection.fields.length ? collection.fields[0].getDisplayStringFromState(item) : '';
        summaryList.rows.push({
          key: {
            text: `${title} ${index + 1}`
          },
          value: {
            text: itemDisplayText || 'Not supplied'
          },
          actions: {
            items
          }
        });
      });
    }
    return {
      ...this.viewModel,
      backLink: this.getBackLink(request, context),
      repeatTitle: title,
      pageTitle: `You have added ${count} ${title}${count === 1 ? '' : 's'}`,
      showTitle: true,
      context,
      errors,
      checkAnswers: [{
        summaryList
      }]
    };
  }
  getSummaryPath(request) {
    const {
      path
    } = this;
    const summaryPath = super.getSummaryPath();
    if (!request) {
      return summaryPath;
    }
    const {
      query
    } = request;
    return redirectPath(`${path}${summaryPath}`, {
      returnUrl: query.returnUrl
    });
  }
}
//# sourceMappingURL=RepeatPageController.js.map