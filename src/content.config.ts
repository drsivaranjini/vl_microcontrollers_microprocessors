import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const experiments = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experiments' }),
  schema: z.object({
    id: z.string(), // "lab-1a"
    unit: z.number(), // 1..4
    order: z.number(),
    title: z.string(),
    device: z.enum(['8086', '8051', 'ARM']),
    engine: z.enum(['8086emu', 'i8051emu', 'cpulator']),
    widget: z.enum(['none', 'dac-scope', 'stepper']).default('none'),
    hexFile: z.string().optional(), // "/hex/lab7-sawtooth.hex" for i8051emu
    cpulatorUrl: z.string().optional(),
    aim: z.string(),
    objectives: z.array(z.string()).default([]),
  }),
});

export const collections = { experiments };
