import { useEffect } from 'react'

export default function Notification({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [onDone])

  return <div className="notif">{msg}</div>
}
