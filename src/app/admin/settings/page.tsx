"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_NOTIFICATIONS = [
  { key: "newOrder", label: "New Order", description: "Get notified when a new order comes in." },
  { key: "lowStock", label: "Low Stock Alerts", description: "Alert when a product falls below threshold." },
  { key: "newReview", label: "New Review", description: "Notify when a customer leaves a review." },
  { key: "customerSignup", label: "New Customer Signup", description: "Notify when a new customer registers." },
];

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    newOrder: true,
    lowStock: true,
    newReview: false,
    customerSignup: false,
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved");
    }, 700);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage store preferences and configuration.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" defaultValue="ARKIVE" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input id="supportEmail" type="email" defaultValue="support@arkive.example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storeDescription">Store Description</Label>
            <Textarea
              id="storeDescription"
              rows={3}
              defaultValue="A considered edit of apparel, footwear, and objects for everyday life."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select defaultValue="usd">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR (€)</SelectItem>
                  <SelectItem value="gbp">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select defaultValue="pt">
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Pacific Time (US)</SelectItem>
                  <SelectItem value="et">Eastern Time (US)</SelectItem>
                  <SelectItem value="gmt">GMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="flatRate">Standard Shipping Rate ($)</Label>
              <Input id="flatRate" type="number" defaultValue={12} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expressRate">Express Shipping Rate ($)</Label>
              <Input id="expressRate" type="number" defaultValue={24} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="freeThreshold">Free Shipping Threshold ($)</Label>
            <Input id="freeThreshold" type="number" defaultValue={100} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Enable International Shipping</p>
              <p className="text-xs text-muted-foreground">Allow orders to ship outside the US.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-0 divide-y divide-border rounded-2xl border border-border bg-card">
          {ADMIN_NOTIFICATIONS.map((n) => (
            <div key={n.key} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-foreground">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
              </div>
              <Switch
                checked={notifications[n.key]}
                onCheckedChange={(checked) => setNotifications((s) => ({ ...s, [n.key]: checked }))}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
