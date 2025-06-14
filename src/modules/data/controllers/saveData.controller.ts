import type { Request, Response } from 'express';

export const saveData = async (req: Request, res: Response) => {
  try {
    console.log(req, res);
  } catch (error) {
    console.log(error);
  }
};
