export type IntakeStatus =
  | "inbox"
  | "triage"
  | "needs-review"
  | "ready-for-route"
  | "routed"
  | "blocked"
  | "archived"
  | "rejected";

export interface ProjectionContract {
  projectionId: string;
  version: string;
  authorityEffect: "derived-non-authoritative";
  canonical: false;
  syntheticOnly: true;
  sourceIdentity: string;
  sourceDigest: string;
  limits: string[];
}

export interface CoreCategoryProjection {
  coreId: string;
  group: string;
  title: string;
  boundary: string;
  nonGoals: string[];
  defaultPrivacyTier: string;
  requiredReviewState: string;
  humanGateBefore: string | null;
  publicationDefault: string;
  authorityEffect: string;
}

export interface ProfileProjection {
  profileId: string;
  profileKind: string;
  eligibleCoreRefs: string[];
  selection: string;
  privacyOverride: string | null;
  requiredFields: string[];
  constraints: string[];
  authorityEffect: string;
}

export interface FacetProjection {
  facetId: string;
  axis: string;
  allowedValues: string[];
  meaning: string;
  authorityEffect: string;
}

export interface FormProjection {
  formId: string;
  title: string;
  purpose: string;
  sourceFormRefs: string[];
  newFormRationale: string | null;
  sections: string[];
  eligibleCoreRefs: string[];
  eligibleProfileRefs: string[];
  eligibleFacetRefs: string[];
  selectionRule: string;
  submitState: IntakeStatus;
  publicationDefault: string;
  authorityEffect: string;
}

export interface DefinitionProjection {
  definitionId: string;
  version: string;
  coreRef: string;
  title: string;
  definition: string;
  intentQuestion: string;
  inclusionRules: string[];
  exclusionRules: string[];
  requiredEvidence: string[];
  proofBoundary: string;
  eligibleFormRefs: string[];
  compatibleProfileRefs: string[];
  compatibleFacetRefs: string[];
  overlapResolution: string;
  publicationDefault: string;
  authorityEffect: string;
}

export interface TransitionProjection {
  transitionId: string;
  from: IntakeStatus;
  to: IntakeStatus;
  actorClass: string;
  humanGate: boolean;
  effectClass: string;
  unknownEffect: "block";
}

export interface ConsequentialGateProjection {
  effectId: string;
  humanAuthority: string;
  automatic: false;
  unknownEffect: "block";
}

export interface DatabaseProjection {
  databaseId: string;
  title: string;
  owner: string;
  recordKinds: string[];
  sourceIdField: string;
  mutableAuthority: false;
}

export interface CrosswalkProjection {
  oldDatabaseId: string;
  targetDatabaseId: string;
  treatment: string;
}

export interface ModuleProjection {
  moduleId: string;
  semanticOwner: string;
  presentationOwner: string;
  capabilities: string[];
  writesAuthority: false;
}

export interface IntakeRegistryProjection {
  contract: ProjectionContract;
  taxonomy: {
    cores: CoreCategoryProjection[];
    profiles: ProfileProjection[];
    facets: FacetProjection[];
  };
  forms: FormProjection[];
  definitions: DefinitionProjection[];
  workflow: {
    statuses: IntakeStatus[];
    reviewStates: string[];
    readyForRouteMeaning: string;
    transitions: TransitionProjection[];
    consequentialGates: ConsequentialGateProjection[];
  };
  projection: {
    posture: string;
    databases: DatabaseProjection[];
    crosswalk: CrosswalkProjection[];
    conflictPolicy: string;
    automaticWriteBack: false;
    silentOverwrite: false;
  };
  modules: {
    applicationPosture: string;
    mountState: "unmounted-candidate";
    items: ModuleProjection[];
    authorityPlanes: Array<{ plane: string; owns: string[]; mustNotOwn: string[] }>;
    futureCortexPort: {
      portId: string;
      status: string;
      direction: string;
      returns: string;
      mayAdvanceWorkflow: false;
      mayClassifyIntake: false;
      failureMode: string;
    };
    typescriptMayOwn: string[];
    typescriptMustNotOwn: string[];
  };
  taskCalendar: {
    posture: "metadata-only-derived-view";
    fields: string[];
    humanSelectionRequired: string[];
    prohibitedEffects: string[];
  };
}

export interface ProjectionDiagnostic {
  code: string;
  message: string;
}

export interface ProjectionValidation {
  valid: boolean;
  diagnostics: ProjectionDiagnostic[];
}
