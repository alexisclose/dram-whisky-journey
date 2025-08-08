import { Helmet } from "react-helmet-async";
import FlavorWheel from "@/components/FlavorWheel";

const University = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/university` : "/university";
  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Whisky University — Learn the Craft</title>
        <meta name="description" content="History of whisky, the 5 S's of tasting, and the language of flavour — all in one educational hub." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Whisky University</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">The History of Whisky</h2>
        <ol className="relative border-s ps-6 space-y-6 text-sm">
          <li>
            <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="font-medium">15th–17th Centuries</p>
            <p className="text-muted-foreground">Origins and early distillation traditions across Scotland and Ireland.</p>
          </li>
          <li>
            <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="font-medium">19th Century</p>
            <p className="text-muted-foreground">Industrialisation, the Coffey still, and global expansion.</p>
          </li>
          <li>
            <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
            <p className="font-medium">Modern Era</p>
            <p className="text-muted-foreground">Single malt renaissance, experimentation, and regional styles.</p>
          </li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-3">How to Taste Whisky — The 5 S's</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {["See", "Swirl", "Sniff", "Sip", "Savor"].map((step) => (
            <div key={step} className="rounded-lg border p-4">
              <p className="font-semibold">{step}</p>
              <p className="text-sm text-muted-foreground mt-1">Guided technique and cues to look for during {step.toLowerCase()}.</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-3">The Language of Flavour</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <FlavorWheel />
          <div className="rounded-lg border p-6">
            <p className="font-medium mb-2">Descriptors</p>
            <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
              {[
                "Peat Smoke",
                "Citrus Zest",
                "Honey",
                "Vanilla",
                "Dried Fruit",
                "Baking Spice",
                "Dark Chocolate",
                "Sea Spray",
              ].map((d) => (
                <li key={d} className="rounded bg-secondary px-2 py-1">{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
};

export default University;
