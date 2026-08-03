import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { sanitizeDescription } from "@/lib/sanitize-description";
import { getProducts } from "@/lib/store-api";

type Props = { params: Promise<{ id: string }> };

async function findProduct(params: Props["params"]) {
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) return null;
  const response = await getProducts();
  return (
    response.sara_products.find((product) => product.id === productId) ?? null
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await findProduct(params);
  return product
    ? { title: product.name, description: `${product.name}への皿ランクアップ` }
    : { title: "商品が見つかりません" };
}

export default async function SaraProductPage({ params }: Props) {
  const product = await findProduct(params);
  if (!product) notFound();
  return (
    <ProductDetail
      product={{ ...product, kind: "sara" }}
      description={sanitizeDescription(product.description)}
    />
  );
}
