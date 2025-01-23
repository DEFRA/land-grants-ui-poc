import Boom from '@hapi/boom';
import { addDays, format } from 'date-fns';
import { config } from "../../../../config/index.js";
import { FileUploadField } from "../components/FileUploadField.js";
import { escapeMarkdown, getAnswer } from "../components/helpers.js";
import { checkEmailAddressForLiveFormSubmission, checkFormStatus } from "../helpers.js";
import { SummaryViewModel } from "../models/index.js";
import { QuestionPageController } from "./QuestionPageController.js";
import { sendNotification } from "../../../utils/notify.js";
const designerUrl = config.get('designerUrl');
const templateId = config.get('notifyTemplateId');
export class SummaryPageController extends QuestionPageController {
  /**
   * The controller which is used when Page["controller"] is defined as "./pages/summary.js"
   */

  constructor(model, pageDef) {
    super(model, pageDef);
    this.viewName = 'summary';
  }
  getSummaryViewModel(request, context) {
    const viewModel = new SummaryViewModel(request, this, context);

    // We already figure these out in the base page controller. Take them and apply them to our page-specific model.
    // This is a stop-gap until we can add proper inheritance in place.
    viewModel.backLink = this.getBackLink(request, context);
    viewModel.feedbackLink = this.feedbackLink;
    viewModel.phaseTag = this.phaseTag;
    return viewModel;
  }

  /**
   * Returns an async function. This is called in plugin.ts when there is a GET request at `/{id}/{path*}`,
   */
  makeGetRouteHandler() {
    return async (request, context, h) => {
      const {
        viewName
      } = this;
      const viewModel = this.getSummaryViewModel(request, context);
      viewModel.hasMissingNotificationEmail = await this.hasMissingNotificationEmail(request, context);
      return h.view(viewName, viewModel);
    };
  }

  /**
   * Returns an async function. This is called in plugin.ts when there is a POST request at `/{id}/{path*}`.
   * If a form is incomplete, a user will be redirected to the start page.
   */
  makePostRouteHandler() {
    return async (request, context, h) => {
      const {
        model
      } = this;
      const {
        params
      } = request;
      const {
        state
      } = context;
      const {
        cacheService
      } = request.services([]);
      const {
        formsService
      } = this.model.services;
      const {
        getFormMetadata
      } = formsService;

      // Get the form metadata using the `slug` param
      const {
        notificationEmail
      } = await getFormMetadata(params.slug);
      const {
        isPreview
      } = checkFormStatus(request.path);
      const emailAddress = notificationEmail ?? this.model.def.outputEmail;
      checkEmailAddressForLiveFormSubmission(emailAddress, isPreview);

      // Send submission email
      if (emailAddress) {
        const viewModel = this.getSummaryViewModel(request, context);
        await submitForm(request, viewModel, model, state, emailAddress);
      }
      await cacheService.setConfirmationState(request, {
        confirmed: true
      });

      // Clear all form data
      await cacheService.clearState(request);
      return this.proceed(request, h, this.getStatusPath());
    };
  }
  get postRouteOptions() {
    return {
      ext: {
        onPreHandler: {
          method(request, h) {
            return h.continue;
          }
        }
      }
    };
  }
}
async function submitForm(request, summaryViewModel, model, state, emailAddress) {
  await extendFileRetention(model, state, emailAddress);
  await sendEmail(request, summaryViewModel, model, emailAddress);
}
async function extendFileRetention(model, state, updatedRetrievalKey) {
  const {
    formSubmissionService
  } = model.services;
  const {
    persistFiles
  } = formSubmissionService;
  const files = [];

  // For each file upload component with files in
  // state, add the files to the batch getting persisted
  model.pages.forEach(page => {
    const fileUploadComponents = page.collection.fields.filter(component => component instanceof FileUploadField);
    fileUploadComponents.forEach(component => {
      const values = component.getFormValueFromState(state);
      if (!values?.length) {
        return;
      }
      files.push(...values.map(({
        status
      }) => ({
        fileId: status.form.file.fileId,
        initiatedRetrievalKey: status.metadata.retrievalKey
      })));
    });
  });
  if (files.length) {
    return persistFiles(files, updatedRetrievalKey);
  }
}
function submitData(model, items, retrievalKey, sessionId) {
  const {
    formSubmissionService
  } = model.services;
  const {
    submit
  } = formSubmissionService;
  const payload = {
    sessionId,
    retrievalKey,
    // Main form answers
    main: items.filter(item => 'field' in item).map(item => ({
      name: item.name,
      title: item.label,
      value: getAnswer(item.field, item.state, {
        format: 'data'
      })
    })),
    // Repeater form answers
    repeaters: items.filter(item => 'subItems' in item).map(item => ({
      name: item.name,
      title: item.label,
      // Repeater item values
      value: item.subItems.map(detailItems => detailItems.map(subItem => ({
        name: subItem.name,
        title: subItem.label,
        value: getAnswer(subItem.field, subItem.state, {
          format: 'data'
        })
      })))
    }))
  };
  return submit(payload);
}
async function sendEmail(request, summaryViewModel, model, emailAddress) {
  const {
    path
  } = request;
  const formStatus = checkFormStatus(path);
  const logTags = ['submit', 'email'];
  request.logger.info(logTags, 'Preparing email', formStatus);

  // Get detail items
  const items = getFormSubmissionData(summaryViewModel.context, summaryViewModel.details);

  // Submit data
  request.logger.info(logTags, 'Submitting data');
  const submitResponse = await submitData(model, items, emailAddress, request.yar.id);
  if (submitResponse === undefined) {
    throw Boom.badRequest('Unexpected empty response from submit api');
  }

  // Get submission email personalisation
  request.logger.info(logTags, 'Getting personalisation data');
  const personalisation = getPersonalisation(items, model, submitResponse, formStatus);
  request.logger.info(logTags, 'Sending email');
  try {
    // Send submission email
    await sendNotification({
      templateId,
      emailAddress,
      personalisation
    });
    request.logger.info(logTags, 'Email sent successfully');
  } catch (err) {
    request.logger.error(logTags, 'Error sending email', err);
    throw err;
  }
}
export function getPersonalisation(items, model, submitResponse, formStatus) {
  const {
    files
  } = submitResponse.result;

  /**
   * @todo Refactor this below but the code to
   * generate the question and answers works for now
   */
  const now = new Date();
  const formattedNow = `${format(now, 'h:mmaaa')} on ${format(now, 'd MMMM yyyy')}`;
  const fileExpiryDate = addDays(now, 30);
  const formattedExpiryDate = `${format(fileExpiryDate, 'h:mmaaa')} on ${format(fileExpiryDate, 'eeee d MMMM yyyy')}`;
  const formName = escapeMarkdown(model.name);
  const subject = formStatus.isPreview ? `TEST FORM SUBMISSION: ${formName}` : `Form submission: ${formName}`;
  const lines = [];
  lines.push(`^ For security reasons, the links in this email expire at ${escapeMarkdown(formattedExpiryDate)}\n`);
  if (formStatus.isPreview) {
    lines.push(`This is a test of the ${formName} ${formStatus.state} form.\n`);
  }
  lines.push(`Form submitted at ${escapeMarkdown(formattedNow)}.\n`);
  lines.push('---\n');
  items.forEach(item => {
    const label = escapeMarkdown(item.label);
    lines.push(`## ${label}\n`);
    if ('subItems' in item) {
      const filename = escapeMarkdown(`Download ${label} (CSV)`);
      const fileId = files.repeaters[item.name];
      lines.push(`[${filename}](${designerUrl}/file-download/${fileId})\n`);
    } else {
      lines.push(getAnswer(item.field, item.state, {
        format: 'email'
      }));
    }
    lines.push('---\n');
  });
  const filename = escapeMarkdown('Download main form (CSV)');
  lines.push(`[${filename}](${designerUrl}/file-download/${files.main})\n`);
  return {
    body: lines.join('\n'),
    subject
  };
}
export function getFormSubmissionData(context, details) {
  return context.relevantPages.map(({
    href
  }) => details.flatMap(({
    items
  }) => items.filter(({
    page
  }) => page.href === href))).flat();
}
//# sourceMappingURL=SummaryPageController.js.map