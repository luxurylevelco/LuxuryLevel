"use client";

import Spinner from "@/components/spinner";
import { BaseEmailProps } from "@/lib/types";
import { useState } from "react";

export default function ContactUs({ message }: { message: string | null }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<BaseEmailProps>({
    email: "",
    name: "",
    message: message || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/send-email`, {
        method: "POST",
        body: JSON.stringify(formData),
      });

      const _res: { message: string; error: string } = await res.json();

      alert(_res.message || _res.error);

      setFormData({ email: "", name: "", message: "" });
    } catch (error) {
      alert(
        (error as { message: string }).message ||
          "Failed to send message. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[url('/homepage-assets/contactus.webp')] bg-cover bg-center bg-no-repeat flex lg:justify-start items-center p-10 md:px-28 md:py-20 bg-black">
      <div className="flex flex-col bg-black bg-opacity-60 rounded-2xl justify-center items-start h-fit w-full lg:w-[650px] p-5 md:p-10 mt-20 md:mt-5">
        <div>
          <p className="font-bold text-2xl md:text-4xl xl:text-5xl text-white">
            We’re Here to Assist You
          </p>
        </div>
        <div className="pt-3">
          <p className="text-gray-300">
            Whether you&apos;re inquiring about a specific timepiece, seeking
            style guidance, or need help with an existing order, reach out to us
            with any questions — your satisfaction is our priority.
          </p>
        </div>

        <div className="pt-8 w-full">
          <form
            onSubmit={handleSendEmail}
            className="relative z-10 contact-form flex flex-col gap-3 w-full lg:w-[700px]"
          >
            <div className="flex flex-col w-full">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                className="w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent transition-all duration-200 focus:outline-none focus:border-white rounded-md"
              />
            </div>

            <div className="flex flex-col w-full">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent transition-all duration-200 focus:outline-none focus:border-white rounded-md"
              />
            </div>

            <div className="flex flex-col w-full">
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Write your message here..."
                rows={5}
                required
                className="w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent resize-none transition-all duration-200 focus:outline-none focus:border-white rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full lg:w-[500px] bg-white text-black px-6 py-2 font-semibold hover:bg-gray-300 hover:text-black border border-black transition-all duration-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex flex-row gap-4 items-center justify-center">
                  Sending <Spinner className="h-5 w-5" />
                </span>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
