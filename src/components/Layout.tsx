import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils'; // shadcn helper
import { Home, Calendar, Video, Phone } from 'lucide-react';
import logo from '../assets/img/logo.jpg';
import { useEffect } from "react";
import { FaFacebook, FaInstagram } from "react-icons/fa"



function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

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
         <ScrollToTop />
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
            <FaFacebook className="h-6 w-6" />
          </a>

          <a
            href="https://www.instagram.com/soundwalkband/"
            aria-label="Instagram"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary"
          >
            {/* Instagram SVG icon */}
            <FaInstagram className="h-6 w-6" />
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
        <Link className='underline hover:text-primary flex justify-center text-xs'
              to={'/admin'}>Admin</Link>
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
