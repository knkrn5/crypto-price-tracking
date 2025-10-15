import { z } from "zod"

const numberSchema = z.number()

export const objectSchema = z.object({
    name: z.string(),
    age: z.number().min(1, { message: "Age must be at least 1" }).max(120),
    email: z.string().email().optional(),
})

function sum(a, b) {
    // Validate at runtime
    //   const validA = numberSchema.parse(a)
    //   const validB = numberSchema.parse(b)
    if (typeof a !== 'number') throw new Error('Invalid number for a received: ' + 'expected ' + typeof numberSchema + ' but received ' + typeof a)
    if (typeof b !== 'number') throw new Error('Invalid number for b, received: ' + 'expected ' + typeof numberSchema + ' but received ' + typeof b)
    //   return validA + validB
    return a + b
}

console.log(sum("a", 2))
// console.log(sum(1, "hello")) 