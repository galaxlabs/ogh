"use client";

import { Breadcrumb } from "@/components/breadcrumb";
import { useLanguage } from "@/components/language-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Heart, Users, Zap } from "lucide-react";

const values = [
  { icon: Heart, title: "Quality Content", description: "We create well-researched, accurate content that helps you learn effectively" },
  { icon: Users, title: "Community First", description: "Building a global community of learners and knowledge sharers" },
  { icon: Globe, title: "Accessibility", description: "Making knowledge available in multiple languages for everyone" },
  { icon: Zap, title: "Practical Learning", description: "Focus on actionable insights and real-world applications" },
];

export function AboutClient() {
  const { translations } = useLanguage();
  const about = translations?.about || {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: "About" }]} />

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{about.title || "About OpenGuideHub"}</h1>
        <p className="text-xl text-muted-foreground">{about.subtitle}</p>
      </div>

      <div className="mb-12 space-y-8">
        <Card>
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-bold">{about.mission || "Our Mission"}</h2>
            <p className="text-muted-foreground">{about.missionDesc}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-bold">{about.vision || "Our Vision"}</h2>
            <p className="text-muted-foreground">{about.visionDesc}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-12">
        <h2 className="mb-8 text-center text-3xl font-bold">{about.values || "Our Values"}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {values.map((value) => (
            <Card key={value.title}>
              <CardContent className="p-6">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="bg-muted">
        <CardContent className="p-8">
          <h2 className="mb-3 text-2xl font-bold">Our Story</h2>
          <p className="leading-7 text-muted-foreground">
            OpenGuideHub started with a simple idea: quality knowledge about science, technology,
            and open source software should be accessible to everyone. What began as a small
            collection of guides has grown into a multilingual knowledge hub, where readers can
            explore tutorials, in-depth articles, and resources in English, Urdu, and Arabic.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
