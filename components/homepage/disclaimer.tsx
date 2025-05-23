export default function Disclaimer() {
  return (
    <div className="section-style relative h-auto w-full bg-[url('/homepage-assets/disclaimerbg.webp')] bg-cover bg-center bg-no-repeat py-10 px-40 bg-black">
      <div className='absolute inset-0 bg-green-950 opacity-60 z-0' />
      <div className='relative z-10 flex flex-col w-full h-fit'>
        <p className='text-white text-md text-center'>
          Disclaimer: We are not an official dealer for the products we sell and
          have no affiliation with the manufacturer. <br />
          All brand names and trademarks are the property of their respective
          owners and are used for identification purposes only.
        </p>
      </div>
    </div>
  );
}
