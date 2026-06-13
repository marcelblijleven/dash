export const PREFIX = "dash.";
export const SHORTCUT = `${PREFIX}shortcut.`;

type Labels = Record<string, string>;

/**
 * Picks the key with the dash. prefix from the provided labels.
 **/
export function pick(labels: Labels, key: string): string | undefined {
  const value: string | undefined = labels[PREFIX + key];
  return value;
}

/**
 * Checks the provided value against a set of truthy and falsy values
 * To determine whether it's true or false, defaults to null.
 **/
export function parseBool(value: string | undefined): boolean | null {
  if (value === undefined) return null;

  value = value.toLowerCase();

  if (["true", "1", "yes", "on"].includes(value)) return true;
  if (["false", "0", "no", "off"].includes(value)) return false;

  return null;
}

/**
 * Checks the provided labels for the dash.hide key and returns the value.
 * Defaults to false
 **/
export function shouldHide(labels: Labels): boolean {
  const value = pick(labels, "hide");
  return !!value;
}

/**
 * Checks the provided labels for the dash.enable key and returns the value.
 * Defaults to false
 **/
export function isEnabled(labels: Labels): boolean {
  const value = pick(labels, "enable");
  return !!value;
}
