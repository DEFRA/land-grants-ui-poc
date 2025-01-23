import { ControllerPath } from '@defra/forms-model';
import Boom from '@hapi/boom';
import { encodeUrl, getStartPath, normalisePath } from "../helpers.js";
export class PageController {
  /**
   * The base class for all page controllers. Page controllers are responsible for generating the get and post route handlers when a user navigates to `/{id}/{path*}`.
   */
  def;
  name;
  model;
  pageDef;
  title;
  section;
  condition;
  collection;
  viewName = 'index';
  constructor(model, pageDef) {
    const {
      def
    } = model;
    this.def = def;
    this.name = def.name;
    this.model = model;
    this.pageDef = pageDef;
    this.title = pageDef.title;

    // Resolve section
    this.section = model.sections.find(section => section.name === pageDef.section);

    // Resolve condition
    if (pageDef.condition) {
      this.condition = model.conditions[pageDef.condition];
    }
  }
  get path() {
    return this.pageDef.path;
  }
  get href() {
    const {
      path
    } = this;
    return this.getHref(`/${normalisePath(path)}`);
  }
  get keys() {
    return this.collection?.keys ?? [];
  }

  /**
   * {@link https://hapi.dev/api/?v=20.1.2#route-options}
   */
  get getRouteOptions() {
    return {};
  }

  /**
   * {@link https://hapi.dev/api/?v=20.1.2#route-options}
   */
  get postRouteOptions() {
    return {};
  }
  get viewModel() {
    const {
      name,
      section,
      title
    } = this;
    const showTitle = true;
    const pageTitle = title;
    const sectionTitle = section?.hideTitle !== true ? section?.title : '';
    return {
      name,
      page: this,
      pageTitle,
      sectionTitle,
      showTitle,
      isStartPage: false,
      serviceUrl: this.getHref('/'),
      feedbackLink: this.feedbackLink,
      phaseTag: this.phaseTag
    };
  }
  get feedbackLink() {
    const {
      def
    } = this;

    // setting the feedbackLink to undefined here for feedback forms prevents the feedback link from being shown
    const feedbackLink = def.feedback?.emailAddress ? `mailto:${def.feedback.emailAddress}` : def.feedback?.url;
    return encodeUrl(feedbackLink);
  }
  get phaseTag() {
    const {
      def
    } = this;
    return def.phaseBanner?.phase;
  }
  getHref(path) {
    const {
      model
    } = this;
    return path === '/' ? `/${model.basePath}` // Strip trailing slash
    : `/${model.basePath}${path}`;
  }
  getStartPath() {
    return getStartPath(this.model);
  }
  getSummaryPath() {
    return ControllerPath.Summary.valueOf();
  }
  getStatusPath() {
    return ControllerPath.Status.valueOf();
  }
  makeGetRouteHandler() {
    return (request, context, h) => {
      const {
        viewModel,
        viewName
      } = this;
      return h.view(viewName, viewModel);
    };
  }
  makePostRouteHandler() {
    throw Boom.badRequest('Unsupported POST route handler for this page');
  }
}
//# sourceMappingURL=PageController.js.map