import type { Goal, Priority, Status } from './types';

export function parseMarkdown(markdown: string): Goal[] {
  let area = 'Импортированные цели';
  let id = Date.now();

  return markdown.split('\n').flatMap((raw): Goal[] => {
    const line = raw.trim();
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      area = heading[1];
      return [];
    }

    const task = line.match(/^[-*]\s+\[([ xX])\]\s+(.+)/);
    if (!task) return [];

    const done = task[1].toLowerCase() === 'x';
    const due = task[2].match(/@due\((\d{4}-\d{2}-\d{2})\)/)?.[1];
    const priority: Priority = task[2].includes('!high')
      ? 'high'
      : task[2].includes('!low')
        ? 'low'
        : 'medium';
    const title = task[2]
      .replace(/!(high|medium|low)/g, '')
      .replace(/@due\(\d{4}-\d{2}-\d{2}\)/g, '')
      .trim();
    const status: Status = done ? 'done' : 'backlog';

    return [{ id: id++, title, area, status, priority, due, progress: done ? 100 : 0 }];
  });
}
