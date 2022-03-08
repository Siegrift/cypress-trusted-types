export interface Violation {
  message: string;
  error: Error;
}

export interface EnableCspThroughMetaTagOptions {
  urlPattern?: string;
}

export type ViolationType = 'TrustedHTML' | 'TrustedScript' | 'TrustedScriptURL' | 'PolicyCreation';
