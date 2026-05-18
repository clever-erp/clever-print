// Shared app-level state. Avoids module augmentation of Electron's App type.

let quittingFully = false;

export function isQuittingFully(): boolean {
  return quittingFully;
}

export function setQuittingFully(): void {
  quittingFully = true;
}
