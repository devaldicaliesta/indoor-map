import { useParams } from 'react-router';

// Placeholder; mode Info Point dibuat di T-408.
export function InfoPointPage() {
  const { code } = useParams();
  return <h1 data-info-point-code={code}>Info Point {code}</h1>;
}
