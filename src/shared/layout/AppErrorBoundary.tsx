import { Component, type ErrorInfo, type ReactNode } from "react"
import { ErrorCard } from "./RouteErrorPage"

// Written over several lines: the project's formatter (oxfmt 0.2) drops the ";" of a one-line type and breaks it.
type State = {
  error: unknown
  hasError: boolean
}

/**
 * The last line of defence, outside the router: catches an error thrown while rendering the providers or the router itself,
 * which a route's ErrorBoundary cannot see. Without it such an error leaves a blank white page.
 */
export default class AppErrorBoundary extends Component<{
  children: ReactNode
}, State> {
  state: State = { error: null, hasError: false }

  static getDerivedStateFromError(error: unknown): State {
    return { error, hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div role="alert" className="min-h-screen px-4 py-10">
        <ErrorCard
          error={this.state.error}
          onRetry={() => this.setState({ error: null, hasError: false })}
          onHome={() => window.location.assign("/")}
        />
      </div>
    )
  }
}
