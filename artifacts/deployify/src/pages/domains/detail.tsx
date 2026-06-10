import { useParams, Link } from "wouter";
import { 
  useGetDomain, 
  useListDnsRecords, 
  useVerifyDomain,
  useCreateDnsRecord,
  useDeleteDnsRecord,
  getGetDomainQueryKey,
  getListDnsRecordsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, Trash2, ShieldAlert, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
type DnsRecordInputType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
import { useToast } from "@/hooks/use-toast";

const DNS_RECORD_TYPES: DnsRecordInputType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

export default function DomainDetail() {
  const params = useParams();
  const domainId = parseInt(params.id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: domain, isLoading: domainLoading } = useGetDomain(domainId, { query: { enabled: !!domainId } });
  const { data: records, isLoading: recordsLoading } = useListDnsRecords(domainId, { query: { enabled: !!domainId } });
  
  const verifyDomain = useVerifyDomain();
  const createRecord = useCreateDnsRecord();
  const deleteRecord = useDeleteDnsRecord();

  const [recType, setRecType] = useState<DnsRecordInputType>("A");
  const [recName, setRecName] = useState("");
  const [recValue, setRecValue] = useState("");

  if (domainLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded" /></div>;
  }

  if (!domain) {
    return <div className="p-8 text-center text-red-500">Domain not found</div>;
  }

  const handleVerify = () => {
    verifyDomain.mutate({ id: domainId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDomainQueryKey(domainId) });
        toast({ title: "Verification initiated", description: "Checking DNS records..." });
      }
    });
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    createRecord.mutate({
      data: { domainId, type: recType, name: recName, value: recValue, ttl: 3600 }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDnsRecordsQueryKey(domainId) });
        setRecName("");
        setRecValue("");
        toast({ title: "Record added" });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", duration: 2000 });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/domains">
          <Button variant="outline" size="icon" className="shrink-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate">{domain.name}</h1>
            <StatusBadge status={domain.status} />
            {domain.verified && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Shield className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>
        {!domain.verified && (
          <Button size="sm" onClick={handleVerify} disabled={verifyDomain.isPending} className="gap-1.5 shrink-0">
            <RefreshCw className={`h-3.5 w-3.5 ${verifyDomain.isPending ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Verify Now</span>
          </Button>
        )}
      </div>

      {/* Verification banner */}
      {!domain.verified && domain.verificationToken && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-amber-500 text-sm md:text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              Verification Required
            </CardTitle>
            <CardDescription className="text-amber-500/80 text-xs">
              Add this TXT record to your DNS provider to verify ownership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-card/50 p-3 rounded-md border border-border/50 font-mono text-xs">
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-2 items-center mb-2 pb-2 border-b border-border/50 text-muted-foreground text-xs">
                <div>Type</div>
                <div>Value</div>
                <div />
              </div>
              <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 items-center">
                <div className="font-semibold">TXT</div>
                <div className="truncate text-muted-foreground">{domain.verificationToken}</div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(domain.verificationToken || "")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* DNS records */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-sm md:text-base">DNS Records</CardTitle>
          <CardDescription className="text-xs">Manage DNS records for {domain.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Add record form — stacked on mobile */}
          <form onSubmit={handleAddRecord} className="space-y-3 p-4 border border-border/50 rounded-lg bg-card/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select value={recType} onValueChange={(v) => setRecType(v as DnsRecordInputType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DNS_RECORD_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input placeholder="@" value={recName} onChange={(e) => setRecName(e.target.value)} required />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label className="text-xs">Value</Label>
                <Input placeholder="192.168.1.1" value={recValue} onChange={(e) => setRecValue(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" size="sm" disabled={createRecord.isPending} className="w-full sm:w-auto">
              Add Record
            </Button>
          </form>

          {/* DNS records table — horizontally scrollable on mobile */}
          <div className="border border-border/50 rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[480px]">
                <thead className="bg-card/80 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-3 py-2.5 font-medium text-xs">Type</th>
                    <th className="px-3 py-2.5 font-medium text-xs">Name</th>
                    <th className="px-3 py-2.5 font-medium text-xs">Value</th>
                    <th className="px-3 py-2.5 font-medium text-xs w-16">TTL</th>
                    <th className="px-3 py-2.5 w-10 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {recordsLoading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground text-xs animate-pulse">
                        Loading records...
                      </td>
                    </tr>
                  ) : records && records.length > 0 ? (
                    records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-card/40 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-medium text-xs">{rec.type}</td>
                        <td className="px-3 py-2.5 text-xs">{rec.name}</td>
                        <td className="px-3 py-2.5 font-mono text-muted-foreground text-xs max-w-[200px] truncate">{rec.value}</td>
                        <td className="px-3 py-2.5 text-muted-foreground text-xs">{rec.ttl}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm("Delete this record?")) {
                                deleteRecord.mutate({ id: rec.id }, {
                                  onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDnsRecordsQueryKey(domainId) })
                                });
                              }
                            }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground text-xs">
                        No DNS records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
