"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Search } from "lucide-react"

type Status = "Active" | "Paused" | "Archived"
type Project = {
  id: string
  name: string
  owner: string
  updated: string
  status: Status
}

const SAMPLE_PROJECTS: Project[] = [
  { id: "P-1001", name: "Alpha Website", owner: "Alice", updated: "2025-09-10", status: "Active" },
  { id: "P-1002", name: "Beta API", owner: "Bob", updated: "2025-09-08", status: "Paused" },
  { id: "P-1003", name: "Gamma Mobile", owner: "Charlie", updated: "2025-09-09", status: "Active" },
  { id: "P-1004", name: "Delta ML Ops", owner: "Diana", updated: "2025-09-07", status: "Archived" },
  { id: "P-1005", name: "Epsilon Docs", owner: "Eve", updated: "2025-09-05", status: "Active" },
  { id: "P-1006", name: "Zeta Infra", owner: "Zane", updated: "2025-09-03", status: "Active" },
  { id: "P-1007", name: "Eta Monitor", owner: "Erin", updated: "2025-09-02", status: "Paused" },
  { id: "P-1008", name: "Theta Billing", owner: "Theo", updated: "2025-09-01", status: "Active" },
  { id: "P-1009", name: "Iota Backoffice", owner: "Ivy", updated: "2025-08-30", status: "Archived" },
  { id: "P-1010", name: "Kappa Search", owner: "Ken", updated: "2025-08-29", status: "Active" },
]

export default function ProjectsPage() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"all" | Status>("all")

  const filtered = useMemo(() => {
    return SAMPLE_PROJECTS.filter((p) => {
      const matchesQuery =
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.owner.toLowerCase().includes(query.toLowerCase()) ||
        p.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" ? true : p.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Projects</CardTitle>
          <CardDescription>Browse and filter your projects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Search projects"
                placeholder="Search by name, owner, or ID"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="sr-only">Status filter</label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger id="status-filter" className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.id}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.owner}</TableCell>
                    <TableCell>{p.updated}</TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      No projects match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "Active":
      return <Badge>Active</Badge>
    case "Paused":
      return <Badge variant="secondary">Paused</Badge>
    case "Archived":
      return <Badge variant="outline">Archived</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}