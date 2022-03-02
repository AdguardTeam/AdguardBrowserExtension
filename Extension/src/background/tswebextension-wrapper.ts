import { TsWebExtension, Configuration } from '@adguard/tswebextension';
import merge from 'deepmerge';

export class TsWebExtensionWrapper {
  config: Configuration = {
      filters: [],
      allowlist: [],
      userrules: [],
      verbose: false,
      settings: {
          collectStats: true,
          allowlistInverted: false,
          stealth: {
              blockChromeClientData: true,
              hideReferrer: true,
              hideSearchQueries: true,
              sendDoNotTrack: true,
              blockWebRTC: true,
              selfDestructThirdPartyCookies: true,
              selfDestructThirdPartyCookiesTime: 3600,
              selfDestructFirstPartyCookies: true,
              selfDestructFirstPartyCookiesTime: 3600,
          },
      },
  };

  constructor(
      public tsWebExtension = new TsWebExtension('web-accessible-resources'),
  ) { }

  async start(config: Partial<Configuration>): Promise<void> {
      const nextConfig = TsWebExtensionWrapper.mergeConfig(this.config, config);

      await this.tsWebExtension.start(nextConfig);

      this.config = nextConfig;
  }

  async stop(): Promise<void> {
      await this.tsWebExtension.stop();
  }

  async configure(config: Partial<Configuration>): Promise<void> {
      const nextConfig = TsWebExtensionWrapper.mergeConfig(this.config, config);

      await this.tsWebExtension.configure(nextConfig);

      this.config = nextConfig;
  }

  getRulesCount(): number {
      return this.tsWebExtension.getRulesCount();
  }

  private static mergeConfig(
      target: Configuration,
      source: Partial<Configuration>,
  ) {
      return merge<Configuration>(target, source, {
          arrayMerge: (_, source) => source,
      });
  }
}

export const tsWebExtensionWrapper = new TsWebExtensionWrapper();
