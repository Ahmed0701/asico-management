import { Avatar } from "@/shared/list/cells"
import { useTranslation } from "react-i18next"
import { Link, useLocation } from "react-router"
import i18n from "@/shared/i18n"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { TableBodySkeleton } from "@/shared/ui/loading-skeletons"
import AuditActionLabel from "./AuditActionLabel"
import AuditEntityCell from "./AuditEntityCell"
import TruncatedText from "./TruncatedText"
import type { AuditLogListItem } from "../api"

function formatLocalTime(iso: string): string {
  const locale = i18n.language === "ar" ? "ar-EG-u-nu-latn" : "en-GB"
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso))
}

export default function AuditLogTable({
  rows,
  isLoading,
  sortAsc,
  onToggleSort,
  onActorFilter,
}: {
  rows: AuditLogListItem[]
  isLoading: boolean
  sortAsc: boolean
  onToggleSort: () => void
  onActorFilter: (actorId: string) => void
}) {
  const { t } = useTranslation()
  const location = useLocation()
  const skeletonRows = 8

  return (
    <div className="list-surface overflow-hidden">
      <Table className="min-w-180">
        <TableHeader>
          <TableRow className="list-head-row">
            <TableHead className="px-4 py-2.5 font-medium">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs uppercase tracking-wide hover:bg-transparent"
                onClick={onToggleSort}
                aria-label={t("audit.sortTime")}
              >
                {t("audit.when")}
                <Icon name={sortAsc ? "sortAsc" : "sortDesc"} size={14} />
              </Button>
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("audit.actor")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("audit.action")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("audit.entity")}
            </TableHead>
            <TableHead className="px-4 py-2.5 font-medium">
              {t("audit.ip")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableBodySkeleton
              columns={5}
              rows={skeletonRows}
              cellClassName="px-4 py-3"
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="px-4 py-3 whitespace-nowrap tabular-nums">
                  <Link
                    to={`/audit/${row.id}`}
                    state={{ listSearch: location.search }}
                    className="block hover:underline"
                    title={row.createdAt}
                  >
                    {formatLocalTime(row.createdAt)}
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3">
                  {row.actor ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto flex-col items-start px-0 py-0 text-start hover:bg-transparent"
                      onClick={() => onActorFilter(row.actor!.id)}
                    >
                      <span className="flex items-center gap-2">
                        <Avatar name={row.actor!.name} />
                        <span className="flex flex-col items-start">
                          <span className="font-medium">{row.actor!.name}</span>
                          <span
                            dir="ltr"
                            className="text-xs text-muted-foreground"
                          >
                            {row.actor!.email}
                          </span>
                        </span>
                      </span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("audit.deletedActor")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <Link
                    to={`/audit/${row.id}`}
                    state={{ listSearch: location.search }}
                    className="hover:underline"
                  >
                    <AuditActionLabel
                      action={row.action}
                      actionLabel={row.actionLabel}
                    />
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3">
                  <AuditEntityCell
                    entity={row.entity}
                    entityCode={row.entityCode}
                    entityName={row.entityName}
                    entityDetail={row.entityDetail}
                    entityId={row.entityId}
                  />
                </TableCell>
                <TableCell className="px-4 py-3">
                  {row.ip ? (
                    <TruncatedText
                      text={row.ip}
                      className="font-mono text-xs text-muted-foreground"
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {t("common.none")}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
