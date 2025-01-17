import { tmpdir } from 'node:os';
import { config } from "../../../config/index.js";
import { encodeUrl } from "../engine/helpers.js";
import { context } from "./context.js";
describe('Nunjucks context', () => {
  beforeEach(() => jest.resetModules());
  describe('Asset path', () => {
    it("should include 'assetPath' for GOV.UK Frontend icons", () => {
      const {
        assetPath
      } = context(null);
      expect(assetPath).toBe('/assets');
    });
  });
  describe('Asset helper', () => {
    it("should locate 'assets-manifest.json' assets", () => {
      const {
        getAssetPath
      } = context(null);
      expect(getAssetPath('example.scss')).toBe('/stylesheets/example.xxxxxxx.min.css');
      expect(getAssetPath('example.mjs')).toBe('/javascripts/example.xxxxxxx.min.js');
    });
    it("should return path when 'assets-manifest.json' is missing", async () => {
      await jest.isolateModulesAsync(async () => {
        const {
          config
        } = await import("../../../config/index.js");

        // Import when isolated to avoid cache
        const {
          context
        } = await import("./context.js");

        // Update config for missing manifest
        config.set('publicDir', tmpdir());
        const {
          getAssetPath
        } = context(null);

        // Uses original paths when missing
        expect(getAssetPath('example.scss')).toBe('/example.scss');
        expect(getAssetPath('example.mjs')).toBe('/example.mjs');
      });
    });
    it('should return path to unknown assets', () => {
      const {
        getAssetPath
      } = context(null);
      expect(getAssetPath()).toBe('/');
      expect(getAssetPath('example.jpg')).toBe('/example.jpg');
      expect(getAssetPath('example.gif')).toBe('/example.gif');
    });
  });
  describe('Config', () => {
    it('should include environment, phase tag and service info', () => {
      const ctx = context(null);
      expect(ctx.config).toEqual(expect.objectContaining({
        cdpEnvironment: config.get('cdpEnvironment'),
        feedbackLink: encodeUrl(config.get('feedbackLink')),
        googleAnalyticsTrackingId: config.get('googleAnalyticsTrackingId'),
        phaseTag: config.get('phaseTag'),
        serviceBannerText: config.get('serviceBannerText'),
        serviceName: config.get('serviceName'),
        serviceVersion: config.get('serviceVersion')
      }));
    });
  });
});
//# sourceMappingURL=context.test.js.map