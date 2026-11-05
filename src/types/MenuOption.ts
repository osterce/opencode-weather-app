export type MenuOption = "1" | "2" | "3" | "4" | "5" | "8" | "9";

export const MENU_OPTIONS: readonly MenuOption[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "8",
  "9",
];

export function isMenuOption(value: string): value is MenuOption {
  return (MENU_OPTIONS as readonly string[]).includes(value);
}
