import { z } from "zod";

export const createTaskSchema = z.object({

  title: z.string({ required_error: "Título es requerido",}) .max(90),
  description: z.string().optional(),
  date: z.string().optional(),
  place: z.string({ required_error: "lugar es requerido", }) .max(30),
  responsible: z.string({ required_error: "Responsable es requerido", }) 
});


// Nuevo esquema para la promoción
export const promotionSchema = z.object({
  isPromoted: z.boolean({
    required_error: "isPromoted is required",
  }),
  promotion: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),

  }).optional()
});