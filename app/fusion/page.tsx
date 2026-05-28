return (
  <Card key={log.id}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <div className="flex items-center gap-3">
        <Box className="w-4 h-4 text-orange-500" />
        <div>
          <CardTitle className="text-base">{log.modelName}</CardTitle>
          {log.job && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {log.job.customerName}
              {log.job.jobNumber ? ` · #${log.job.jobNumber}` : ""}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">
          {log.boundingX}" × {log.boundingY}" × {log.boundingZ}"
        </span>
        <Badge variant="outline" className="text-xs">
          {log.type === "DRAWING" ? "Drawing" : "Model"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {log.bodies} {log.bodies === 1 ? "body" : "bodies"}
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {/* Blueprint image preview */}
      {log.imageData && (
        <div className="border border-border rounded overflow-hidden">
          <img
            src={`data:image/png;base64,${log.imageData}`}
            alt={log.modelName}
            className="w-full object-contain max-h-64 bg-white"
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {components.map((c: string) => (
            <Badge key={c} variant="secondary" className="text-xs">
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {log.notes && (
            <span className="text-xs text-muted-foreground">{log.notes}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(log.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);
