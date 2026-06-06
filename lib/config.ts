import { z } from 'zod'

import { WIDGET_TYPES } from "./widgets/types";

const WidgetSchema = z.object({
  type: z.enum([WIDGET_TYPES[0], ...WIDGET_TYPES.slice(1)] as [string, ...string[]]).describe('Widget type, determines which fields are valid for each widget.'),
  title: z.string().optional(),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
})

export type WidgetConfig = z.infer<typeof WidgetSchema> & {
  id: string,
  [key: string]: unknown
}

export const ConfigSchema = z.object({
  widgets: z.array(WidgetSchema).default([]).describe("Widgets to include in the dashboard")
})

export function configJsonSchema() {
  return z.toJSONSchema(ConfigSchema, {
    target: 'draft-2020-12',
    metadata: z.globalRegistry,
    io: 'input',
  })
}
