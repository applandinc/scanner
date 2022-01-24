import CheckConfig from './checkConfig';

/**
 * Configuration is the code representation of the scanner configuration file.
 */
export default interface Configuration {
  checks: CheckConfig[];
  // Disable a rule which is enabled by default.
  disableDefault: string[];
}
