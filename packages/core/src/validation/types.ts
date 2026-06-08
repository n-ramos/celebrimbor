export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  path: string;
  message: string;
  code?: string;
  /**
   * Gravite de l'anomalie. Une absence de severite est traitee comme `error`.
   * Seules les anomalies `error` rendent un document invalide ; les `warning`
   * (ex. bloc inconnu rendu via fallback) sont signalees sans bloquer.
   */
  severity?: ValidationSeverity;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};
