import React from "react";
import { Header } from "./Header";
import { getCategories } from "@/lib/catalog/categories";

export default async function Navbar() {
  const categories = await getCategories();
  return <Header categories={categories} />;
}
