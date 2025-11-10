import { redirect } from 'next/navigation';

// Root page just redirects to default locale
// This avoids static generation issues with the locale page
export default function RootPage() {
  redirect('/en');
}
