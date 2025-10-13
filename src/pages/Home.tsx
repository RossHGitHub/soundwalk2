import { Card } from "../components/ui/card"
import { Avatar } from "../components/ui/avatar"
import promoVideo from "../assets/vid/soundwalkPromo.mp4"
import RossProfile from "../assets/img/RossProfile.jpg"
import KeithProfile from "../assets/img/KeithProfile.jpg"
import BarryProfile from "../assets/img/BarryProfile.jpg"

// 👇 Add hero images for the staggered sections (replace with your real files)
import musicalStyleImg from "../assets/img/SoundwalkAtOktoberfest.jpeg"
import silentStageImg from "../assets/img/soundwalkStack2.jpeg"
import proSoundImg from "../assets/img/soundwalkStack3.jpeg"

function FeatureRow({
  title,
  image,
  reverse = false,
  children,
}) {
  return (
    <Card className="w-full p-0 overflow-hidden border-1 border-emerald-600 rounded-none lg:rounded-xl">
      <div
        className={[
          "grid md:grid-cols-2 items-stretch",
          reverse ? "md:[&>div:first-child]:order-2" : "",
        ].join(" ")}
      >
        {/* Image */}
        <div className="relative h-48 sm:h-72 md:h-auto">
          <img
            src={image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        {/* Text */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <div className="space-y-3">{children}</div>
        </div>
      </div>
    </Card>
  )
}

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] overflow-hidden">
        <video
          src={promoVideo}
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover rounded-lg border-2 border-emerald-600"
        >
          Your browser does not support the video tag.
        </video>
        <div className="relative z-10 flex items-center justify-center h-full">
          <h1 className="text-white text-2xl sm:text-3xl md:text-5xl px-4 text-center fly-in-left">
            North-East based functions and covers band.
          </h1>
        </div>
      </section>

      {/* About Section (contained) */}
      <section aria-label="About" className="max-w-5xl mx-auto px-6 py-10 space-y-4">
        <div className="w-20 h-" />
        <h2 className="text-4xl font-bold subheading">Welcome to Soundwalk</h2>
        <p>
          Soundwalk are a professional covers band, specializing in playing a range of diverse musical styles.
        </p>
        <p>
          From weddings to functions, or even just an all-round good time, we've got you covered.
        </p>
        <p>
          <strong>Give your night the soundtrack it deserves!</strong>
        </p>
      </section>

      {/* Why Choose Section
          - Full width on mobile/tablet
          - Contained on large screens
      */}
      <section aria-label="Why Choose Soundwalk?" className="w-full py-10 space-y-8 px-0">
        {/* On large screens, re-introduce the container */}
        <div className="lg:max-w-5xl lg:mx-auto lg:px-6 space-y-8">
          <h2 className="text-3xl font-semibold subheading px-6 lg:px-0">Why choose Soundwalk?</h2>

          {/* 1) Musical Style (image left) */}
          <FeatureRow title="Musical Style" image={musicalStyleImg}>
            <p>
              Gone are the days where the over-played Rock classics are enough to satisfy everyone in the room!
              We offer a fantastic variety of musical styles, from classics to modern hits.
            </p>
            <p>Check out just some of the artists we play:</p>
            <ul className="list-disc list-inside grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {[
                "The Turtles",
                "Stereophonics",
                "The Weeknd",
                "Van Morrison",
                "Harry Styles",
                "Kaiser Chiefs",
                "Coldplay",
                "Jackie Wilson",
                "Bastille",
                "Girls Aloud",
                "The Who",
                "Walk The Moon",
                "Wheezer",
                "R.E.M",
                "Jet",
                "Deep Blue Something",
              ].map((artist) => (
                <li key={artist}>{artist}</li>
              ))}
            </ul>
            <p>The list, quite literally, goes on and on!</p>
          </FeatureRow>

          {/* 2) Silent Stage (image right) */}
          <FeatureRow title="Silent Stage" image={silentStageImg} reverse>
            <p>
              We primarily use an electronic drum kit alongside in-ear monitoring to create a fully “silent stage,”
              allowing us to precisely control volume and tailor our sound to any environment—perfect for noise-sensitive venues.
            </p>
            <p>
              However, we also have a full acoustic drum kit set up if a more traditional setup is preferred.
            </p>
          </FeatureRow>

          {/* 3) Pro Sound & Lighting (image left) */}
          <FeatureRow title="Professional Sound &amp; Lighting" image={proSoundImg}>
            <p>
              We provide all our own professional-grade equipment, including a full PA system and stage lighting—
              everything needed for an impressive live performance. For smaller to mid-sized venues, we're fully self-contained and ready to go.
            </p>
            <p>
              For larger venues or events with their own in-house production teams, we've got it covered too.
              Our setup includes a signal splitter system, allowing us to send a clean feed directly to the Front of House (FoH) desk
              while maintaining full control over our in-ear monitoring. This ensures a seamless integration with venue systems without
              compromising our on-stage mix or performance quality.
            </p>
          </FeatureRow>
        </div>
      </section>

      {/* Meet The Band (contained) */}
      <section aria-label="Meet The Band" className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <h2 className="text-3xl font-semibold subheading">Meet The Band</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Ross",
              role: "Guitarist, Vocalist and by far the best member of the band.",
              img: RossProfile,
              alt: "Ross profile picture",
              extra: "(also the builder of this site, I can say what I want.)",
            },
            {
              name: "Keith",
              role: "Bassist, Vocalist and professional bald guy. Don't even challenge him, you'll lose.",
              img: KeithProfile,
              alt: "Keith profile picture",
              extra: null,
            },
            {
              name: "Barry",
              role: "Our amazing drummer with over 30 years of joint pain, and professional drumming experience.",
              img: BarryProfile,
              alt: "Barry profile picture",
              extra: null,
            },
          ].map(({ name, role, img, alt, extra }) => (
            <Card key={name} className="text-center p-6 border-1 border-emerald-600">
              <Avatar className="w-48 h-48 mx-auto">
                <img src={img} alt={alt} className="rounded block object-cover w-full" />
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold">{name}</h3>
              <p>{role}</p>
              {extra && <em>{extra}</em>}
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
