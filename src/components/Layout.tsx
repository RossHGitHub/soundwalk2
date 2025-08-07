import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils'; // shadcn helper
import { Home, Calendar, Video, Phone } from 'lucide-react';
import logo from '../assets/img/logo.jpg';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Gigs', path: '/gigs', icon: Calendar },
  { name: 'Media', path: '/media', icon: Video },
  { name: 'Contact', path: '/contact', icon: Phone},
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
        <header className="md:hidden sticky top-0 z-50 bg-background shadow border-b py-3">
  <div className="flex justify-center">
    <img src={logo} alt="Soundwalk logo" className="h-20" />
  </div>
</header>
      {/* Top bar (desktop) */}
      <nav className="hidden md:flex sticky top-0 z-50 bg-background justify-between items-center px-6 py-4 shadow border-b">
      <img src={logo} alt="Soundwalk logo" className="h-20" />
        <div className="flex gap-5">
          {navItems.map(({ name, path }) => (
            <Link
              key={name}
              to={path}
              className={cn(
                "text-xl font-medium",
                location.pathname === path ? "text-emerald-600" : "text-muted-foreground"
              )}
            >
              {name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
     <main className="flex-1 p-4 pb-20 md:pb-4">
    

        <Outlet />
        {/* Footer */}
      <footer className="bg-muted text-muted-foreground px-6 py-6 mt-auto">
        <div className="flex justify-center space-x-8 mb-4">
          <a href="https://www.facebook.com/profile.php?id=61557765549373" aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
            {/* Facebook SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-brand-facebook-filled"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M18 2a1 1 0 0 1 .993 .883l.007 .117v4a1 1 0 0 1 -.883 .993l-.117 .007h-3v1h3a1 1 0 0 1 .991 1.131l-.02 .112l-1 4a1 1 0 0 1 -.858 .75l-.113 .007h-2v6a1 1 0 0 1 -.883 .993l-.117 .007h-4a1 1 0 0 1 -.993 -.883l-.007 -.117v-6h-2a1 1 0 0 1 -.993 -.883l-.007 -.117v-4a1 1 0 0 1 .883 -.993l.117 -.007h2v-1a6 6 0 0 1 5.775 -5.996l.225 -.004h3z"
                strokeWidth="0"
                fill="currentColor"
              />
            </svg>
          </a>

          <a
            href="https://www.instagram.com/soundwalkband/"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            {/* Instagram SVG icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-brand-instagram"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#ffffff"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M16.5 7.5l0 .01" />
            </svg>
          </a>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Pictures courtesy of Eliza Henderson and{" "}
          <a
            href="https://www.instagram.com/fraser_photography444/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            Fraser Farnan
          </a>
        </p>
      </footer>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="bg-background fixed bottom-0 left-0 right-0 md:hidden border-t shadow-md flex justify-around py-2">
        {navItems.map(({ name, path, icon: Icon }) => (
          <Link key={name} to={path} className="flex flex-col items-center text-sm">
            <Icon
              className={cn(
                "h-5 w-5 mb-1",
                location.pathname === path ? "text-emerald-600" : "text-muted-foreground"
              )}
            />
            {name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
