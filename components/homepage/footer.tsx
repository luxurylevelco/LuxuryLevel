import Image from "next/image";
import Link from "next/link";
import { Roboto_Condensed } from "next/font/google";
import { getWhatsAppUrl } from "@/lib/utils";

// Font setup
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Interface for footer links
interface FooterLink {
  name: string;
  href: string;
}

// Footer link values
const footerLinks: FooterLink[] = [
  { name: "Company Overview", href: "/#overview" },
  { name: "Contact Us", href: "/contact-us" },
  { name: "Terms & Conditions", href: "/terms-condition" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Return Policy", href: "/return-policy" },
];

// Social media icon values
const socialMediaLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com",
    icon: "/svgs/ig.svg",
  },
  {
    name: "Facebook",
    href: "https://facebook.com",
    icon: "/svgs/fb.svg",
  },
  { name: "Twitter", href: "https://twitter.com", icon: "/svgs/twt.svg" },
  {
    name: "WhatsApp",
    href: getWhatsAppUrl({ message: "" }),
    icon: "/svgs/whatsapp2.svg",
  },
];

export default function Footer() {
  return (
    <footer className="footer p-0">
      <div>
        <div className="bg-gray-100 w-full h-fit flex flex-col md:flex-row gap-10 p-20 justify-center items-center md:items-start text-center md:text-start">
          {/* Left Section */}
          <div className="flex flex-col w-full md:w-1/4 items-center md:items-start gap-5">
            <div className="flex flex-col items-center md:items-start">
              <Image
                src="/svgs/level-logo.svg"
                alt="Whatsapp"
                width={85}
                height={85}
                className="object-contain"
              />
              <p className="font-semibold text-3xl">Luxury Level</p>
            </div>

            <div>
              <p className="underline">
                Al-Qibla - Ahmad Al-Jaber St. Al-Zumurodah Tower 3rd Floor -
                Office No. 1,2,3
              </p>
            </div>

            <div>
              <p>
                <strong>Timings:</strong> 11:30 AM to 8:30 PM{" "}
                <strong>(Saturday to Thursday)</strong>
              </p>
              <p>
                3:30 PM to 8:30 PM <strong>(Friday)</strong>
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col">
            <p
              className={`font-semibold text-xl mb-2 ${robotoCondensed.className}`}
            >
              USEFUL LINKS
            </p>
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                target="_blank"
                className="hover:underline text-gray-800"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col">
            <p
              className={`font-semibold text-xl mb-2 ${robotoCondensed.className}`}
            >
              CONTACT US AT:
            </p>
            <p>Tel.: (+965) 90085003 - 90086003</p>
            <p>Email: trading@Luxurylevelco.com</p>
            <p>P.O. Box: 29208 Safat - Code: 13152 Kuwait</p>
          </div>
        </div>

        {/* Social media icons */}
        <div className="bg-black flex flex-col justify-center items-center gap-6 py-6 px-20 md:px-40 xl:px-80">
          <div className="flex flex-row gap-5 justify-center items-center">
            {socialMediaLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="hover:opacity-75 transition-opacity duration-300"
              >
                <Image
                  src={social.icon}
                  alt={social.name}
                  width={28}
                  height={28}
                />
              </Link>
            ))}
          </div>

          {/* Line separator */}
          <div className="w-full border-t border-gray-600 my-4" />

          <div className="text-white text-center">
            Copyright &copy; 2025 Luxury Level. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
