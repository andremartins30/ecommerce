"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const NOTIFICATION_PREFS = [
  { key: "orderUpdates", label: "Order Updates", description: "Shipping, delivery, and order status changes." },
  { key: "promotions", label: "Promotions & Offers", description: "Sales, new arrivals, and exclusive discounts." },
  { key: "restock", label: "Back in Stock", description: "Get notified when wishlist items are restocked." },
  { key: "newsletter", label: "Weekly Newsletter", description: "Editorial content and styling guides." },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    orderUpdates: true,
    promotions: true,
    restock: false,
    newsletter: true,
  });

  function toggle(key: string, value: boolean) {
    setPrefs((p) => ({ ...p, [key]: value }));
    toast.success("Preferences updated");
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Manage notifications and preferences.</p>
      </div>

      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Notifications</h2>
        <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
          {NOTIFICATION_PREFS.map((pref) => (
            <div key={pref.key} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Switch
                checked={prefs[pref.key]}
                onCheckedChange={(checked) => toggle(pref.key, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Regional</h2>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select defaultValue="en">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select defaultValue="usd">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD ($)</SelectItem>
              <SelectItem value="eur">EUR (€)</SelectItem>
              <SelectItem value="gbp">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
