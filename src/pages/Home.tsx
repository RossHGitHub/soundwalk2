
import { Card } from "../components/ui/card"
import { Avatar } from "../components/ui/avatar"
import promoVideo from "../assets/vid/soundwalkPromo.mp4"
import RossProfile from "../assets/img/RossProfile.jpg"
import KeithProfile from "../assets/img/KeithProfile.jpg"
import BarryProfile from "../assets/img/BarryProfile.jpg"

export default function HomePage() {
    console.log(promoVideo)
  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground">
    

      {/* Hero Section */}
      <section className="relative w-full h-[400px] md:h-[600px] overflow-hidden">
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
          <h1 className="text-white text-3xl md:text-5xl font-semibold px-4 text-center fly-in-left">
            North-East based functions and covers band.
          </h1>
        </div>
      </section>

      {/* About Section */}
      <section
        aria-label="About"
        className="max-w-5xl mx-auto px-6 py-10 space-y-6"
      >
        <div className="w-20 h-20 " />
        <h2 className="text-4xl font-bold subheading ">Welcome to Soundwalk</h2>
        <p>
          Soundwalk are a professional covers band, specializing in playing a
          range of diverse musical styles.
        </p>
        <p>
          From weddings to functions, or even just an all-round good time, we've
          got you covered.
        </p>
        <p>
          <strong>Give your night the soundtrack it deserves!</strong>
        </p>
      </section>

      {/* Why Choose Section */}
      <section
        aria-label="Why Choose Soundwalk?"
        className="max-w-5xl mx-auto px-6 py-10 space-y-8 "
      >
        <h2 className="text-3xl font-semibold subheading">Why choose Soundwalk?</h2>

        <Card className="p-6 border-1 border-emerald-600">
          <h3 className="text-xl font-semibold mb-2 ">Musical Style</h3>
          <p>
            Gone are the days where the over-played Rock classics are enough to
            satisfy everyone in the room! We offer a fantastic variety of
            musical styles, from classics to modern hits.
          </p>
          <p>Check out just some of the artists we play:</p>
          <ul className="list-disc list-inside grid grid-cols-2 gap-x-6 gap-y-2">
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
        </Card>

        <Card className="p-6 border-1 border-emerald-600">
          <h3 className="text-xl font-semibold mb-2">Silent Stage</h3>
          <p>
            We primarily use an electronic drum kit alongside in-ear monitoring
            to create a fully “silent stage,” allowing us to precisely control
            volume and tailor our sound to any environment—perfect for
            noise-sensitive venues. However, we also have a full acoustic drum
            kit set up if a more traditional setup is preferred.
          </p>
        </Card>

        <Card className="p-6 border-1 border-emerald-600">
          <h3 className="text-xl font-semibold mb-2">Professional Sound &amp; Lighting</h3>
          <p>
            We provide all our own professional-grade equipment, including a
            full PA system and stage lighting - everything needed for an
            impressive live performance. For smaller to mid-sized venues, we’re
            fully self-contained and ready to go.
          </p>
          <p>
            For larger venues or events with their own in-house production
            teams, we've got it covered too. Our setup includes a signal
            splitter system, allowing us to send a clean feed directly to the
            Front of House (FoH) desk while maintaining full control over our
            in-ear monitoring. This ensures a seamless integration with venue
            systems without compromising our on-stage mix or performance
            quality.
          </p>
        </Card>
      </section>

      {/* Meet The Band */}
      <section
        aria-label="Meet The Band"
        className="max-w-5xl mx-auto px-6 py-10 space-y-8"
      >
        <h2 className="text-3xl font-semibold subheading">Meet The Band</h2>

        <div className="grid md:grid-cols-3 gap-8 ">
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
    <img src={img} alt={alt} className="rounded block object-cover w-full " />
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
