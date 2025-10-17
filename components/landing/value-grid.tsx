export type ValueProp = {
  title: string;
  body: string;
};

type ValueGridProps = {
  items: ValueProp[];
};

export function ValueGrid({ items }: ValueGridProps) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/75 p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-foreground">{item.title}</h2>
          <p className="mt-3 text-sm text-foreground/75">{item.body}</p>
        </article>
      ))}
    </section>
  );
}
