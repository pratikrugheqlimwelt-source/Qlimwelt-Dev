"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  busy?: boolean;
  onCreate: (input: {
    productNumber: string;
    name: string;
    category?: string;
    declaredUnit?: string;
    description?: string;
  }) => Promise<void>;
};

export function ProductForm({ busy, onCreate }: Props) {
  const [productNumber, setProductNumber] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [declaredUnit, setDeclaredUnit] = useState("piece");
  const [description, setDescription] = useState("");

  return (
    <form
      className="dash-card space-y-4 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!productNumber.trim() || !name.trim()) return;
        await onCreate({ productNumber, name, category, declaredUnit, description });
        setProductNumber("");
        setName("");
        setDescription("");
      }}
    >
      <h3 className="text-sm font-semibold">New product</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pn">Product number</Label>
          <Input id="pn" className="mt-1" value={productNumber} onChange={(e) => setProductNumber(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pname">Name</Label>
          <Input id="pname" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="pcat">Category</Label>
          <Input id="pcat" className="mt-1" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="punit">Declared unit</Label>
          <Input id="punit" className="mt-1" value={declaredUnit} onChange={(e) => setDeclaredUnit(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pdesc">Description</Label>
          <Input id="pdesc" className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={busy || !productNumber.trim() || !name.trim()}>
        {busy ? "Creating…" : "Create product"}
      </Button>
    </form>
  );
}
