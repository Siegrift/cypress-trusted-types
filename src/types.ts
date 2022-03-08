export interface Violation {
  message: string;
  error: Error;
}

export interface EnableCspThroughMetaTagOptions {
  urlPattern?: string;
}

export type TrustedValue = 'TrustedHTML' | 'TrustedScript' | 'TrustedScriptURL';
