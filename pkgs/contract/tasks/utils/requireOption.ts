/**
 * Task options always have a default value, so required options default to
 * "" and are checked here.
 */
export const requireOption = (value: string, name: string): string => {
  if (value === "") {
    throw new Error(`Missing required option --${name}`);
  }
  return value;
};
