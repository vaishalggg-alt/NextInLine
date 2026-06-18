export interface Student {
  id: string;
  name: string;
  joinedAt: number;
}

export const queue: Student[] = [];

type Controller = ReadableStreamDefaultController;
const clients = new Set<Controller>();

export function addClient(controller: Controller) {
  clients.add(controller);
}

export function removeClient(controller: Controller) {
  clients.delete(controller);
}

export function broadcast() {
  const data = `data: ${JSON.stringify(queue)}\n\n`;
  for (const controller of clients) {
    try {
      controller.enqueue(new TextEncoder().encode(data));
    } catch {
      clients.delete(controller);
    }
  }
}
