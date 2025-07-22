import { useBranding } from '../context/BrandingContext';

const Header = () => {
  const { branding } = useBranding();

  return (
    <header className="p-4 shadow" style={{ backgroundColor: branding?.theme?.color }}>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <img
          src={branding?.logo || '/pwa-512x512.png'}
          alt="Logo"
          onError={(e) => (e.target.src = '/pwa-512x512.png')}
          className="h-10"
        />
        <div>
          <h1 className="text-white text-xl font-semibold">
            {branding?.institute || 'Instify Platform'}
          </h1>
          {branding?.tagline && (
            <p className="text-white text-sm opacity-80">{branding.tagline}</p>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
