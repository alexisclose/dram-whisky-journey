import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const sample = [
  {
    q: "Which region is famous for smoky, peaty whiskies?",
    a: ["Speyside", "Islay", "Lowland", "Campbeltown"],
    correct: 1,
  },
  {
    q: "What is the typical sequence of the 5 S's?",
    a: ["Sniff, Sip, Savor, Swirl, See", "See, Swirl, Sniff, Sip, Savor", "Sip, See, Swirl, Savor, Sniff", "Swirl, See, Sip, Sniff, Savor"],
    correct: 1,
  },
  {
    q: "ABV stands for?",
    a: ["Absolute Beverage Volume", "Alcohol by Volume", "Alcohol Beverage Value", "Average Bottled Volume"],
    correct: 1,
  },
];

const Quiz = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/quiz` : "/quiz";
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Master's Quiz — Test Your Knowledge</title>
        <meta name="description" content="A short multiple-choice quiz covering whisky history, tasting, and flavour." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">The Master's Quiz</h1>

      {!started ? (
        <div>
          <p className="text-muted-foreground mb-4">Ready to test your knowledge from Whisky University?</p>
          <Button variant="brand" onClick={() => setStarted(true)}>Start Quiz</Button>
        </div>
      ) : idx < sample.length ? (
        <div className="max-w-2xl">
          <p className="font-medium mb-4">Q{idx + 1}. {sample[idx].q}</p>
          <div className="grid gap-2">
            {sample[idx].a.map((ans, i) => (
              <Button
                key={ans}
                variant="outline"
                className="justify-start"
                onClick={() => {
                  if (i === sample[idx].correct) setScore((s) => s + 1);
                  setIdx((n) => n + 1);
                }}
              >
                {ans}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <p className="text-lg">Your score: {score} / {sample.length}</p>
          <p className="text-muted-foreground mt-2">Titles unlock once Supabase is connected and progress is saved.</p>
        </div>
      )}
    </main>
  );
};

export default Quiz;
