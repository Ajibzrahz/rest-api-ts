import type { QueryFilter, QueryOptions, UpdateQuery } from "mongoose";
import Product, { type ProductDocument } from "../models/product-model";
import type { CreateProductInput } from "../schema/product-schema";

export async function createProduct(
  input: CreateProductInput["body"] & { user: string },
) {
  return Product.create(input);
}
export async function findProduct(
  query: QueryFilter<ProductDocument>,
  options: QueryOptions = { lean: true },
) {
  return Product.findOne(query, {}, options);
}
export async function updateProduct(
  query: QueryFilter<ProductDocument>,
  update: UpdateQuery<ProductDocument>,
  options: QueryOptions = { lean: true },
) {
  return Product.findOneAndUpdate(query, update, options);
}
export async function deleteProduct(query: QueryFilter<ProductDocument>) {
  return Product.deleteOne(query);
}
