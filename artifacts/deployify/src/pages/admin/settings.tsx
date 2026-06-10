import { AdminLayout } from "./layout";
import { useGetSystemSettings, useUpdateSystemSettings, getGetSystemSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { format } from "date-fns";

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach(s => map[s.key] = s.value);
      setLocalSettings(map);
    }
  }, [settings]);

  const handleSave = () => {
    const items = Object.entries(localSettings).map(([key, value]) => ({ key, value }));
    updateSettings.mutate({ data: { settings: items } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSystemSettingsQueryKey() });
        toast({ title: "Settings saved successfully" });
      }
    });
  };

  const updateSetting = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading || !settings) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-6 w-32 bg-muted rounded" /></CardHeader>
              <CardContent className="space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  // Group settings by prefix
  const groups: Record<string, typeof settings> = {};
  settings.forEach(setting => {
    const prefix = setting.key.split('.')[0];
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(setting);
  });

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">System Configuration</h2>
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
            <Save className="h-4 w-4" /> {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {Object.entries(groups).map(([prefix, groupSettings]) => (
          <Card key={prefix} className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="capitalize text-base">{prefix} Settings</CardTitle>
              <CardDescription>Configure {prefix}-related system properties.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {groupSettings.map((setting) => {
                const value = localSettings[setting.key] ?? setting.value;
                const isBoolean = value === 'true' || value === 'false';
                const isNumber = !isNaN(Number(value)) && value !== '';
                
                return (
                  <div key={setting.key} className="flex flex-col space-y-2 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <Label className="font-mono text-sm">{setting.key}</Label>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <div className="min-w-[200px] shrink-0">
                        {isBoolean ? (
                          <div className="flex items-center justify-end">
                            <Switch 
                              checked={value === 'true'} 
                              onCheckedChange={(c) => updateSetting(setting.key, c ? 'true' : 'false')} 
                            />
                          </div>
                        ) : isNumber ? (
                          <Input 
                            type="number" 
                            value={value} 
                            onChange={(e) => updateSetting(setting.key, e.target.value)} 
                          />
                        ) : (
                          <Input 
                            type="text" 
                            value={value} 
                            onChange={(e) => updateSetting(setting.key, e.target.value)} 
                          />
                        )}
                      </div>
                    </div>
                    {setting.updatedAt && (
                      <div className="text-[10px] text-muted-foreground/60 text-right">
                        Last updated: {format(new Date(setting.updatedAt), "MMM d, yyyy HH:mm")}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
