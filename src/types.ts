export interface Violation {
  message: string;
  error: Error;
  type: ViolationType;
}

export interface EnableCspThroughMetaTagOptions {
  urlPattern?: string;
}

export type ViolationType = 'TrustedHTML' | 'TrustedScript' | 'TrustedScriptURL' | 'TrustedTypePolicyFactory';
