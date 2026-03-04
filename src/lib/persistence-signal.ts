let importInProgress = false

export function setImportInProgress(value: boolean): void {
  importInProgress = value
}

export function isImportInProgress(): boolean {
  return importInProgress
}
