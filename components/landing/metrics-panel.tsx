export type Metric = {
  label: string;
  value: string;
};

type MetricsProps = {
  metrics: Metric[];
};

export function MetricsPanel({ metrics }: MetricsProps) {
  return (
    <dl className="grid gap-6 pt-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[28px] border border-foreground/10 bg-surface/70 p-6 shadow-sm"
        >
          <dt className="text-sm font-medium text-foreground/70">{metric.label}</dt>
          <dd className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
