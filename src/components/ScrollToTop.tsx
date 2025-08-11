import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // ページ遷移時に必ずトップに戻す
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // アニメーションなしで即座に
    })
  }, [pathname])

  return null
}