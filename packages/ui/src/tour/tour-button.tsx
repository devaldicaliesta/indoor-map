import { CircleHelpIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
import { Button } from '../components/button';

/** Mengulang tur halaman dari langkah pertama ("Tur halaman" di Admin, "Cara pakai" di Info Point). */
export function TourButton({
  label,
  ...props
}: { label: string } & Omit<ComponentProps<typeof Button>, 'children'>) {
  return (
    <Button variant="ghost" data-tour="tour-button" {...props}>
      <CircleHelpIcon aria-hidden="true" strokeWidth={1.75} />
      {label}
    </Button>
  );
}
