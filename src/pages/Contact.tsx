// src/pages/ContactPage.tsx

import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { MailIcon } from "lucide-react"
import { FaFacebook, FaInstagram } from "react-icons/fa"

export default function ContactPage() {
  return (
    <div className="h-full min-h-[calc(100vh-4rem-4rem)] flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full text-center">
        <CardContent>
          <h1 className="text-3xl font-bold mb-4">How can we help?</h1>
          <p className="mb-6 text-muted-foreground">
            We'd love to hear from you! If you have a general enquiry about anything at all, you can send an email by clicking the button below:
          </p>

          <a
            href="mailto:soundwalkband@gmail.com?subject=Soundwalk%20Enquiry"
            className="inline-block"
          >
            <Button className="mb-4" variant="default">
              <MailIcon className="mr-2 h-4 w-4" /> Send an Email
            </Button>
          </a>

          <p className="text-muted-foreground">
            Or if you'd prefer, you can send us a message on one of our social media pages:
          </p>

          <div className="mt-6 flex justify-center space-x-6 text-2xl text-muted-foreground">
            <a
              href="https://facebook.com/Soundwalk-Cover-Band/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              <FaFacebook />
            </a>
            <a
              href="https://instagram.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              <FaInstagram />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
