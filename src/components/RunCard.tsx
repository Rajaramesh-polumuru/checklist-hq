import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Play, Clock, CheckCircle2 } from 'lucide-react'
import type { Run } from '@/types/database'

interface RunCardProps {
    run: Run & { repository: { title: string; owner_id: string } }
}

export function RunCard({ run }: RunCardProps) {
    return (
        <Link to={`/app/run/${run.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Play className="h-4 w-4 text-primary" />
                            {run.repository.title}
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Started {new Date(run.started_at).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                                {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {run.status === 'completed' && (
                            <div className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Completed</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
