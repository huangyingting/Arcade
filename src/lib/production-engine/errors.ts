export class ProductionError extends Error {
  constructor(message: string, public readonly code: string, public readonly status = 422) {
    super(message);
    this.name = 'ProductionError';
  }
}
