import './globals.css';

export const metadata = {
  title: 'SK Design Studio | Create, personalize, print',
  description: 'A modern design workspace for invitations, print graphics and branded content.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
