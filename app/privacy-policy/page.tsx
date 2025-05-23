import Banner from '@/components/banner';
import PrivacyPolicy from '@/components/policypages/privacypolicy';

export default async function Page() {
  return (
    <>
      <Banner title={'PRIVACY POLICY'} classnameForBgSrc={''} />
      <PrivacyPolicy />
    </>
  );
}
