import { dirname, join } from 'node:path';
import nunjucks from 'nunjucks';
import resolvePkg from 'resolve';
import { config } from "../../../config/index.js";
import * as filters from "./filters/index.js";
const govukFrontendPath = dirname(resolvePkg.sync('govuk-frontend/package.json'));
export const paths = [join(config.get('appDir'), 'plugins/engine/views'), join(config.get('appDir'), 'views')];
export const environment = nunjucks.configure([...paths, join(govukFrontendPath, 'dist')], {
  trimBlocks: true,
  lstripBlocks: true,
  watch: config.get('isDevelopment'),
  noCache: config.get('isDevelopment')
});
for (const [name, nunjucksFilter] of Object.entries(filters)) {
  environment.addFilter(name, nunjucksFilter);
}
//# sourceMappingURL=environment.js.map