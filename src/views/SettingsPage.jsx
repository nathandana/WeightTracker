import { Section, Heading, Paragraph } from '@gtivr4/a1-design-system-react';

export function SettingsPage() {
  return (
    <Section padding="md" contentWidth="sm" align="center" gap="md">
      <Heading type="display" size="jumbo" as="h1" align="center">
        Settings
      </Heading>
      <Paragraph color="muted" align="center">
        Preferences and account settings coming soon.
      </Paragraph>
    </Section>
  );
}
