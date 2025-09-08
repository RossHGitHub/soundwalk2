// components/Hero.tsx
interface HeroProps {
  image: string;
  title?: string | React.ReactNode;
  fullBleed?: boolean; // ← NEW
}

export default function Hero({ image, title, fullBleed }: HeroProps) {
  return (
    <header
      className={[
        // breakout on mobile, normal on md+
        fullBleed
          ? "mx-[calc(50%-50vw)] w-screen md:mx-auto md:w-auto"
          : "mx-auto",
        "mb-8 px-0 md:px-4 md:max-w-5xl" // keep your desktop look
      ].join(" ")}
    >
      {title && (
        <h1 className="text-4xl sm:text-5xl mt-6 text-center mb-6 px-4">
          {title}
        </h1>
      )}

      {/* Mobile: slightly taller + full width */}
      <div className="block md:hidden h-[240px] w-full overflow-hidden border-t-2 border-b-2 border-t-emerald-600 border-b-emerald-600 mb-4 rounded-none">
        <img src={image} alt={typeof title === "string" ? title : "Hero image"}
             className="w-full h-full object-cover object-center" draggable={false}/>
      </div>

      {/* Desktop: your original */}
      <div className="hidden md:block h-[250px] overflow-hidden border-2 rounded-2xl border-emerald-600">
        <img src={image} alt={typeof title === "string" ? title : "Hero image"}
             className="w-full h-full object-cover object-center"/>
      </div>
    </header>
  );
}
