import Layout from 'components/Layout'
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import DumpsterCalculator from 'components/Dumpster/Calculator'
import { useState } from 'react'

export enum DumpsterType {
  FLAT_RATE,
  HAUL_PLUS,
  INCLUSION,
}

export default function About() {
  const [dumpsterType, setDumpsterType] = useState(DumpsterType.FLAT_RATE)
  return (
    <Layout>
      <div className="max-w-full sm:max-w-lg mx-auto p-4">
        <TabGroup>
          <TabList className="flex flex-row items-center justify-around gap-2 sm:gap-4">
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.FLAT_RATE)}>
              <h2>Flat Rate</h2>
            </Tab>
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.HAUL_PLUS)}>
              <h2>Haul Plus Rate</h2>
            </Tab>
            <Tab
              className="rounded-full py-2 px-4 text-sm text-gray-700 font-semibold focus:outline-none data-[selected]:bg-black/10 data-[hover]:bg-black/5 data-[selected]:data-[hover]:bg-black/10 data-[focus]:outline-1 data-[focus]:outline-black"
              onClick={() => setDumpsterType(DumpsterType.INCLUSION)}>
              <h2>Inclusion Rate</h2>
            </Tab>
          </TabList>
          <div className="mt-3 rounded-xl bg-white/5 p-3">
            <DumpsterCalculator type={dumpsterType} />
          </div>
        </TabGroup>
      </div>
    </Layout>
  )
}
