export class RecordDoesNotExists extends Error {
  constructor(
    public readonly message: string = 'El registro no existe en la base de datos',
    public readonly statusCode: number = 409,
    public readonly res: boolean = false,
  ) {
    super();
    this.stack = '';
  }
}
