import { errorMessage } from '@/api/http'
import { Button } from './ui/button'

export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return <div className="state-panel" role="alert"><h2>{errorMessage(error)}</h2><Button onClick={retry} variant="outline">Tentar novamente</Button></div>
}
