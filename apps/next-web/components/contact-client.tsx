"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, Send } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { useLanguage } from "@/components/language-provider";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY_FORM: ContactFormData = { name: "", email: "", subject: "", message: "" };

export function ContactClient() {
  const { translations } = useLanguage();
  const contact = translations?.contact || {};
  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const messages = JSON.parse(localStorage.getItem("contact_messages") || "[]");
      messages.push({ ...formData, timestamp: new Date().toISOString() });
      localStorage.setItem("contact_messages", JSON.stringify(messages));
    } catch {
      // ignore storage errors
    }

    setTimeout(() => {
      setIsLoading(false);
      toast.success(contact.success || "Message sent successfully");
      setFormData(EMPTY_FORM);
    }, 500);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Breadcrumb items={[{ label: contact.title || "Contact" }]} />

      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold md:text-5xl">{contact.title || "Contact Us"}</h1>
        <p className="text-xl text-muted-foreground">{contact.subtitle}</p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 font-semibold">Email Us</h3>
            <p className="text-sm text-muted-foreground">contact@openguidehub.org</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4 inline-flex rounded-xl bg-secondary/10 p-3">
              <MessageSquare className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="mb-2 font-semibold">Live Chat</h3>
            <p className="text-sm text-muted-foreground">Available 24/7</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="mb-4 inline-flex rounded-xl bg-accent/10 p-3">
              <Send className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 font-semibold">Social Media</h3>
            <p className="text-sm text-muted-foreground">Follow us online</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{contact.name || "Name"}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={contact.namePlaceholder || "Your name"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{contact.email || "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={contact.emailPlaceholder || "your@email.com"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{contact.subject || "Subject"}</Label>
              <Input
                id="subject"
                type="text"
                placeholder={contact.subjectPlaceholder || "How can we help?"}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{contact.message || "Message"}</Label>
              <Textarea
                id="message"
                placeholder={contact.messagePlaceholder || "Your message..."}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : contact.send || "Send Message"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
