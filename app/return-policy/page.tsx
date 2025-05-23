import Banner from '@/components/banner';
import ReturnPolicy from '@/components/policypages/returnpolicy';

export default async function Page() {
  return (
    <>
      <Banner title={'RETURN POLICY'} classnameForBgSrc={''} />
      <ReturnPolicy />
    </>
  );
}
