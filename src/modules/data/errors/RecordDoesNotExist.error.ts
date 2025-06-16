export class RecordDoesNotExists extends Error {
  constructor(
    public readonly message: string = 'El sensor no se encuentra registrado en la base de datos.',
    public readonly statusCode: number = 409,
    public readonly res: boolean = false,
  ) {
    super();
    this.stack = '';
  }
}
