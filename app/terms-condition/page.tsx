import Banner from '@/components/banner';
import TermsAndCond from '@/components/policypages/terms&co';

export default async function Page() {
  return (
    <>
      <Banner title={'TERMS AND CONDITIONS'} classnameForBgSrc={''} />
      <TermsAndCond />
    </>
  );
}
