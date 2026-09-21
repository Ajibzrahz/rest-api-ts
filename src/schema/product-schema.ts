import { number, string, z } from "zod";

const payload = {
  body: z.object({
    title: string({
      error: "Title is required",
    }),
    description: string({
      error: "Description is required",
    }).min(120, "Description should be at least 120 characters"),
    price: number({
      error: "Price is required",
    }),
    image: string({
      error: "Image is required",
    }),
  }),
};
const params = {
  params: z.object({
    productId: string({
      error: "productId is required",
    }),
  }),
};

export const createProductSchema = z.object({
  ...payload,
});
export const updateProductSchema = z.object({
  ...payload,
  ...params,
});
export const deleteProductSchema = z.object({
  ...params,
});
export const getProductSchema = z.object({
  ...params,
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductInput = z.infer<typeof getProductSchema>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
