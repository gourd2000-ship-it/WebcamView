import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#111215] text-[#f3f4f6] p-6">
          <div className="max-w-md w-full bg-[#1a1c22] border border-[#2e3039] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-12 h-12 stroke-[1.5]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#f3f4f6]">애플리케이션 오류가 발생했습니다</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                렌더링 중 예기치 않은 오류가 일어났습니다. 아래 버튼을 눌러 앱을 새로고침해 주세요.
              </p>
              {this.state.error && (
                <pre className="text-xs text-rose-400/80 bg-[#111215] p-3 rounded-lg max-h-36 overflow-auto text-left border border-rose-950 font-mono">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>새로고침 및 복구</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
