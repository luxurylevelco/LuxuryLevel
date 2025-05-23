import Banner from '@/components/banner';
import CompanyOverviewExt from '@/components/about-us-ext/company-overview-ext';
import Disclaimer from '@/components/about-us-ext/disclaimer';
import OtherInfo from '@/components/about-us-ext/other-info';
import CollectionInfo from '@/components/about-us-ext/collection-info';
import LimitedEdition from '@/components/about-us-ext/limited-edition';

export default async function Page() {
  return (
    <>
      <Banner title={'COMPANY OVERVIEW'} classnameForBgSrc={''} />
      <CompanyOverviewExt />
      <Disclaimer />
      <OtherInfo />
      <CollectionInfo />
      <LimitedEdition />
    </>
  );
}
