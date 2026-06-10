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
import { ArrowLeft, CheckCircle2, Shield, Trash2, ShieldAlert, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
type DnsRecordInputType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "CAA";
import { useToast } from "@/hooks/use-toast";

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

  const [recType, setRecType] = useState<DnsRecordInputType>(DnsRecordInputType.A);
  const [recName, setRecName] = useState("");
  const [recValue, setRecValue] = useState("");

  if (domainLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse h-8 w-32 bg-muted mx-auto rounded"></div></div>;
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
      data: {
        domainId,
        type: recType,
        name: recName,
        value: recValue,
        ttl: 3600
      }
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/domains">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{domain.name}</h1>
            <StatusBadge status={domain.status} />
            {domain.verified && <StatusBadge status="verified" className="bg-blue-500/10 text-blue-400 border-blue-500/20" label="Verified" />}
          </div>
        </div>
        {!domain.verified && (
          <Button onClick={handleVerify} disabled={verifyDomain.isPending} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${verifyDomain.isPending ? 'animate-spin' : ''}`} />
            Verify Now
          </Button>
        )}
      </div>

      {!domain.verified && domain.verificationToken && (
        <Card className="bg-amber-500/5 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-500 text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Verification Required
            </CardTitle>
            <CardDescription className="text-amber-500/80">
              Please add the following TXT record to your DNS provider to verify ownership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-card/50 p-4 rounded-md border border-border/50 font-mono text-sm">
              <div className="grid grid-cols-[100px_1fr_40px] gap-4 mb-2 pb-2 border-b border-border/50 text-muted-foreground">
                <div>Type</div>
                <div>Value</div>
                <div></div>
              </div>
              <div className="grid grid-cols-[100px_1fr_40px] gap-4 items-center">
                <div className="font-semibold">TXT</div>
                <div className="truncate">{domain.verificationToken}</div>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(domain.verificationToken || "")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>DNS Records</CardTitle>
          <CardDescription>Manage DNS records for {domain.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddRecord} className="flex items-end gap-4 p-4 border border-border/50 rounded-lg bg-card/30">
            <div className="space-y-2 w-32">
              <Label>Type</Label>
              <Select value={recType} onValueChange={(v) => setRecType(v as DnsRecordInputType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(DnsRecordInputType).map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-48">
              <Label>Name</Label>
              <Input placeholder="@" value={recName} onChange={(e) => setRecName(e.target.value)} required />
            </div>
            <div className="space-y-2 flex-1">
              <Label>Value</Label>
              <Input placeholder="192.168.1.1" value={recValue} onChange={(e) => setRecValue(e.target.value)} required />
            </div>
            <Button type="submit" disabled={createRecord.isPending}>Add Record</Button>
          </form>

          <div className="border border-border/50 rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-card/80 text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium w-24">TTL</th>
                  <th className="px-4 py-3 font-medium w-16 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recordsLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground animate-pulse">Loading records...</td></tr>
                ) : records && records.length > 0 ? (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-card/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{rec.type}</td>
                      <td className="px-4 py-3">{rec.name}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground truncate max-w-[300px]">{rec.value}</td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.ttl}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" 
                          onClick={() => {
                            if(confirm("Delete this record?")) {
                              deleteRecord.mutate({ id: rec.id }, {
                                onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDnsRecordsQueryKey(domainId) })
                              });
                            }
                          }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No DNS records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}