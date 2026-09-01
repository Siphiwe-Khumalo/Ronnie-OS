import { z } from 'zod'

export const activityCategories = [
  'work',
  'lumen',
  'learning',
  'life',
  'uncategorized',
] as const

export const activityCategorySchema = z.enum(activityCategories)

export type ActivityCategory = z.infer<typeof activityCategorySchema>

const isoTimestampSchema = z.string().datetime({ offset: true })
const durationMinutesSchema = z.number().int().min(0)

export const activitySchema = z
  .object({
    id: z.string().min(1),
    timestamp: isoTimestampSchema,
    category: activityCategorySchema,
    subcategory: z.string().min(1).optional(),
    durationMinutes: durationMinutesSchema.optional(),
    note: z.string().min(1),
    source: z.literal('manual'),
    createdAt: isoTimestampSchema,
    updatedAt: isoTimestampSchema,
  })
  .strict()

export type Activity = z.infer<typeof activitySchema>

export const createActivityInputSchema = z
  .object({
    timestamp: isoTimestampSchema.optional(),
    category: activityCategorySchema,
    subcategory: z.string().min(1).optional(),
    durationMinutes: durationMinutesSchema.optional(),
    note: z.string().min(1),
  })
  .strict()

export type CreateActivityInput = z.infer<typeof createActivityInputSchema>

export const updateActivityInputSchema = createActivityInputSchema.partial().strict()

export type UpdateActivityInput = z.infer<typeof updateActivityInputSchema>
