"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BomItem } from "@/lib/bom/types";

type Props = {
  item: BomItem | null;
  saving?: boolean;
  onSave: (patch: Partial<BomItem> & { partNumber: string; quantity: number; unit: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
};

export function BomItemDetail({ item, saving, onSave, onDelete }: Props) {
  const [partNumber, setPartNumber] = useState(item?.partNumber ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [quantity, setQuantity] = useState(String(item?.quantity ?? 1));
  const [unit, setUnit] = useState(item?.unit ?? "piece");
  const [scrapRate, setScrapRate] = useState(String(item?.scrapRate ?? 0));
  const [yieldRate, setYieldRate] = useState(String(item?.yieldRate ?? 1));

  // sync when selection changes
  const itemId = item?.id;
  if (item && partNumber !== item.partNumber && document.activeElement?.tagName !== "INPUT") {
    /* controlled sync via key on parent preferred */
  }

  return (
    <div className="dash-card space-y-4 p-4" key={itemId ?? "empty"}>
      <h3 className="text-sm font-semibold">{item ? "BOM line" : "Select a line"}</h3>
      {!item ? (
        <p className="text-sm text-muted-foreground">Choose a BOM item to edit details.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Part number</Label>
              <Input className="mt-1" defaultValue={item.partNumber} onChange={(e) => setPartNumber(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Input className="mt-1" defaultValue={item.unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <Input className="mt-1" defaultValue={item.description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input className="mt-1" type="number" step="any" defaultValue={item.quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <Label>Scrap rate (0–1)</Label>
              <Input className="mt-1" type="number" step="any" defaultValue={item.scrapRate} onChange={(e) => setScrapRate(e.target.value)} />
            </div>
            <div>
              <Label>Yield rate (0–1]</Label>
              <Input className="mt-1" type="number" step="any" defaultValue={item.yieldRate} onChange={(e) => setYieldRate(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Input className="mt-1" defaultValue={item.itemType} disabled />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={saving}
              onClick={() =>
                onSave({
                  id: item.id,
                  partNumber: partNumber || item.partNumber,
                  description: description || item.description,
                  quantity: Number(quantity),
                  unit: unit || item.unit,
                  scrapRate: Number(scrapRate),
                  yieldRate: Number(yieldRate),
                  parentItemId: item.parentItemId,
                  itemType: item.itemType,
                  sequenceNo: item.sequenceNo,
                })
              }
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            {onDelete && (
              <Button variant="outline" disabled={saving} onClick={() => onDelete(item.id)}>
                Delete
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
