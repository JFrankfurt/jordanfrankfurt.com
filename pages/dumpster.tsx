import FlatRateCalculator from 'components/Dumpster/FlatRateCalculator'
import Layout from 'components/Layout'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import HaulPlusRateCalculator from 'components/Dumpster/HaulPlusRateCalculator'
import InclusionRateCalculator from 'components/Dumpster/InclusionRateCalculator'

export default function About() {
  return (
    <Layout>
      <div className="w-[45vw] min-w-96">
        <TabGroup>
          <TabList className="flex gap-4">
            <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black">
              <h2>Flat Rate</h2>
            </Tab>
            <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black">
              <h2>Haul Plus Rate</h2>
            </Tab>
            <Tab className="rounded-full py-1 px-3 text-sm/6 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black">
              <h2>Inclusion Rate</h2>
            </Tab>
          </TabList>
          <TabPanels className="mt-3">
            <TabPanel className="rounded-xl bg-white/5 p-3">
              <FlatRateCalculator />
            </TabPanel>
            <TabPanel className="rounded-xl bg-white/5 p-3">
              <HaulPlusRateCalculator />
            </TabPanel>
            <TabPanel className="rounded-xl bg-white/5 p-3">
              <InclusionRateCalculator />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </Layout>
  )
}
