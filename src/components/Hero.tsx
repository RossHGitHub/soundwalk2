interface HeroProps {
  image: string;
  title?: string | React.ReactNode;
}

export default function Hero({ image, title }: HeroProps) {
  return (
    <header className="mb-8 max-w-5xl mx-auto px-4">
      {/* Title above image */}
      {title && (
        <h1 className="text-5xl mt-6 text-center mb-6">{title}</h1>
      )}

      {/* Mobile image: fixed height 200px, not full screen width */}
      <div className="block md:hidden h-[200px] w-full overflow-hidden border-t-2 border-b-2 rounded-2xl border-t-emerald-600 border-b-emerald-600 mb-4">
        <img
          src={image}
          alt={typeof title === "string" ? title : "Hero image"}
          className="w-full h-full object-cover object-center"
          draggable={false}
        />
      </div>

      {/* Desktop image: fixed height 250px */}
      <div className="hidden md:block h-[250px] overflow-hidden border-2 rounded-2xl border-emerald-600">
        <img
          src={image}
          alt={typeof title === "string" ? title : "Hero image"}
          className="w-full h-full object-cover object-center"
        />
      </div>
    </header>
  );
}
