import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

interface State {
  hasError: boolean
}

export class ImageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Image Error Boundary caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      return (
        <div className={`${this.props.className || ''} bg-gray-200 flex items-center justify-center min-h-[100px]`}>
          <span className="text-gray-500 text-sm">画像の読み込みに失敗しました</span>
        </div>
      )
    }

    return this.props.children
  }
}