import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router"
import { useTranslation } from "react-i18next"
import Button from "@/shared/ui/Button"
import Icon from "@/shared/ui/Icon"
import { Card } from "@/shared/ui/PageHeader"

type Kind = "notFound" | "chunk" | "generic"

// A lazy chunk that no longer exists on the server: the app was redeployed while the tab was open.
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "")
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    message,
  )
}

function kindOf(error: unknown): Kind {
  if (isRouteErrorResponse(error) && error.status === 404) return "notFound"
  if (isChunkLoadError(error)) return "chunk"
  return "generic"
}

function detailsOf(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`
  }
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

/** The card shown in place of a page that threw. Used by RouteErrorPage and by the app-wide AppErrorBoundary. */
export function ErrorCard({
  error,
  onRetry,
  onHome,
}: {
  error: unknown
  onRetry: () => void
  onHome: () => void
}) {
  const { t } = useTranslation()
  const kind = kindOf(error)

  const title =
    kind === "notFound"
      ? t("errorPage.notFoundTitle")
      : kind === "chunk"
        ? t("errorPage.chunkTitle")
        : t("errorPage.title")
  const body =
    kind === "notFound"
      ? t("errorPage.notFoundBody")
      : kind === "chunk"
        ? t("errorPage.chunkBody")
        : t("errorPage.body")

  return (
    <Card className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <span
        className={
          kind === "generic"
            ? "grid size-12 place-items-center rounded-full bg-danger-soft text-danger"
            : "grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"
        }
      >
        <Icon name="alert" />
      </span>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {kind !== "notFound" && (
          <Button
            type="button"
            variant="primary"
            onClick={
              kind === "chunk" ? () => window.location.reload() : onRetry
            }
          >
            {kind === "chunk" ? t("errorPage.reload") : t("errorPage.tryAgain")}
          </Button>
        )}
        <Button type="button" onClick={onHome}>
          {t("errorPage.goHome")}
        </Button>
      </div>
      {import.meta.env.DEV && kind === "generic" && (
        <details className="mt-3 w-full text-start">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t("errorPage.details")}
          </summary>
          <pre
            dir="ltr"
            className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed"
          >
            {detailsOf(error)}
          </pre>
        </details>
      )}
    </Card>
  )
}

/**
 * The router's ErrorBoundary (the errorElement of a route): what a route shows instead of crashing the app when it, or a
 * loader, throws. "Try again" re-renders the same URL; "Go to dashboard" leaves it.
 */
export default function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  if (import.meta.env.DEV) {
    console.error(error)
  }

  return (
    <div role="alert" className="px-4 py-6">
      <ErrorCard
        error={error}
        onRetry={() => void navigate(0)}
        onHome={() => void navigate("/")}
      />
    </div>
  )
}
