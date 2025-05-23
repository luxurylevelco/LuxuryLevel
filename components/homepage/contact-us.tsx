import Image from 'next/image';

export default function ContactUs() {
  return (
    <div className="min-h-screen relative bg-[url('/homepage-assets/contactus.webp')] bg-cover bg-center bg-no-repeat justify-center items-center p-10 md:px-28 md:py-20 bg-black">
      <div className='flex flex-col bg-black bg-opacity-60 rounded-2xl justify-center items-start h-fit w-full lg:w-[650px] p-5 md:p-10 mt-20 md:mt-5'>
        <div>
          <p className='font-bold text-3xl md:text-4xl xl:text-5xl text-white'>
            We’re Here to Assist You
          </p>
        </div>
        <div className='pt-3'>
          <p className='text-gray-300'>
            Whether you're inquiring about a specific timepiece, seeking style
            guidance, or need help with an existing order, reach out to us with
            any questions — your satisfaction is our priority.
          </p>
        </div>

        <div className='pt-8 w-full'>
          <form
            action='/send-message'
            method='POST'
            className='relative z-10 contact-form flex flex-col gap-3 w-full lg:w-[700px]'
          >
            <div className='flex flex-col w-full'>
              <input
                type='text'
                id='name'
                name='name'
                placeholder='Enter your name'
                required
                className='w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent transition-all duration-200 focus:outline-none focus:border-white rounded-md'
              />
            </div>

            <div className='flex flex-col w-full'>
              <input
                type='email'
                id='email'
                name='email'
                placeholder='Enter your email'
                required
                className='w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent transition-all duration-200 focus:outline-none focus:border-white rounded-md'
              />
            </div>

            <div className='flex flex-col w-full'>
              <textarea
                id='message'
                name='message'
                placeholder='Write your message here...'
                rows={5}
                required
                className='w-full lg:w-[500px] border border-gray-500 text-white px-4 py-2 bg-transparent resize-none transition-all duration-200 focus:outline-none focus:border-white rounded-md'
              />
            </div>

            <button
              type='submit'
              className='mt-4 w-full lg:w-[500px] bg-white text-black px-6 py-2 font-semibold hover:bg-gray-300 hover:text-black border border-black transition-all duration-300 rounded-md'
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
