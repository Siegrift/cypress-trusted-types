export interface Violation {
  message: string;
  error: Error;
}

export interface EnableCspThroughMetaTagOptions {
  urlPattern?: string;
}

export interface AddCspMetaTagOptions {
  urlPattern?: string;
  cspValue: string;
}

export type TrustedValue = 'TrustedHTML' | 'TrustedScript' | 'TrustedScriptURL';
