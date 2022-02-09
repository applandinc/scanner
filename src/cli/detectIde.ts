// Defining these close together is the best I can think of right now.
export type IDE = 'vscode' | 'x-mine' | 'idea' | 'pycharm';
export const IDEOptions = ['vscode', 'x-mime', 'idea', 'pycharm'];

export function detectIde(): IDE | undefined {
  if (process.env.TERM_PROGRAM === 'vscode') {
    return 'vscode';
  }
}
