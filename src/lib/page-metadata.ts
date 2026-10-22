import { useEffect } from 'react'

export function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')!
    const previousDescription = meta.content
    document.title = title
    meta.content = description
    return () => { document.title = previousTitle; meta.content = previousDescription }
  }, [title, description])
}
