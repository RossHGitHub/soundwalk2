import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "./ui/button";
import { reportAppError } from "../lib/appErrorReporting";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportAppError(error, {
      source: "react.error-boundary",
      context: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-300">
              Application Error
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              The app hit a render error
            </h1>
            <p className="mt-3 text-sm text-white/65">
              The latest console error is shown in the modal. Reload to recover the session.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
