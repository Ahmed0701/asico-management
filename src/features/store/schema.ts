import { z } from "zod"
import {
  STORE_CATEGORIES,
  STORE_FACTORY_CATEGORIES,
  STORE_MOVEMENT_KINDS,
} from "./api"

// A quantity typed in a field: empty, or a number of 0 or more with at most two decimals (as the server checks it).
const QUANTITY = /^\d{1,10}(\.\d{1,2})?$/
const quantityText = (requiredKey?: string) =>
  z.string()
    .trim()
    .refine((value) => (requiredKey ? value !== "" : true), {
      message: requiredKey ?? "validation.required",
    })
    .refine((value) => value === "" || QUANTITY.test(value), {
      message: "store.errors.quantity",
    })

export const storeItemFormSchema = z
  .object({
    // Adding: the entry of the items reference list the item is made from.
    referenceId: z.string(),
    name: z
      .string()
      .trim()
      .min(1, "validation.required")
      .max(120, "store.errors.nameLength"),
    category: z.enum(STORE_CATEGORIES),
    unit: z
      .string()
      .trim()
      .min(1, "validation.required")
      .max(20, "store.errors.unitLength"),
    minQuantity: quantityText(),
    openingQuantity: quantityText(),
    // The store the opening stock is in.
    openingWarehouseId: z.string(),
    // A wire or a box comes from one of that category's factories; anything else from none.
    factoryId: z.string(),
    notes: z.string().trim().max(1000, "store.errors.textLength"),
  })
  .superRefine((value, ctx) => {
    // Adding: the item is picked from the reference list (an item being edited already has its name).
    if (!value.referenceId && !value.name) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.pickItem",
        path: ["referenceId"],
      })
      return
    }
    // Only a wire has a factory, and it needs one.
    if (value.category === "WIRE" && !value.factoryId) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.pickFactory",
        path: ["factoryId"],
      })
    }
  })

export type StoreItemFormValues = z.infer<typeof storeItemFormSchema>

export const storeFactoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.required")
    .max(80, "store.errors.factoryNameLength"),
  category: z.enum(STORE_FACTORY_CATEGORIES),
})

export const storeItemNameFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "validation.required")
      .max(120, "store.errors.nameLength"),
    category: z.enum(STORE_CATEGORIES),
    // A wire's factory (a wire needs one); none for anything else.
    factoryId: z.string(),
    unit: z.string().min(1, "validation.required"),
  })
  .superRefine((value, ctx) => {
    if (value.category === "WIRE" && !value.factoryId) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.pickFactory",
        path: ["factoryId"],
      })
    }
  })

export type StoreItemNameFormValues = z.infer<typeof storeItemNameFormSchema>

export type StoreFactoryFormValues = z.infer<typeof storeFactoryFormSchema>

export const storeMovementFormSchema = z
  .object({
    itemId: z.string().min(1, "store.errors.pickItem"),
    // The store it happens in (for a transfer, the store it leaves), and for a transfer the other one.
    warehouseId: z.string().min(1, "store.errors.pickStore"),
    toWarehouseId: z.string(),
    kind: z.enum(STORE_MOVEMENT_KINDS),
    quantity: quantityText("store.errors.quantity"),
    villaId: z.string(),
    party: z.string().trim().max(120, "store.errors.textLength"),
    reference: z.string().trim().max(60, "store.errors.textLength"),
    note: z.string().trim().max(1000, "store.errors.textLength"),
    movedOn: z.string(),
  })
  .superRefine((value, ctx) => {
    if (
      value.kind !== "ADJUST" &&
      QUANTITY.test(value.quantity) &&
      Number(value.quantity) <= 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.positive",
        path: ["quantity"],
      })
    }
    if (
      value.kind === "TRANSFER" &&
      (!value.toWarehouseId || value.toWarehouseId === value.warehouseId)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.transferTarget",
        path: ["toWarehouseId"],
      })
    }
    if (value.kind === "ISSUE" && !value.villaId && !value.party.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "store.errors.issueTarget",
        path: ["party"],
      })
    }
  })

export type StoreMovementFormValues = z.infer<typeof storeMovementFormSchema>
