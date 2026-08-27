import { Breadcrumb } from "@/components/breadcrumb";

interface LegalSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

export function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: LegalSection[];
}) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: title }]} />

      <h1 className="mb-8 text-4xl font-bold md:text-5xl">{title}</h1>

      <div className="prose-article max-w-none">
        <p className="mb-6 text-muted-foreground">Last updated: {today}</p>

        {sections.map((section) => (
          <section key={section.heading} className="mb-8">
            <h2 className="mb-3 text-2xl font-bold">{section.heading}</h2>
            {section.body && <p className="mb-3 text-foreground/80">{section.body}</p>}
            {section.bullets && (
              <ul className="list-disc space-y-2 ps-6">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
