import { useState } from 'react'
import { Field, Fieldset, Input, Label } from '@headlessui/react'
import { DumpsterType } from 'pages/dumpster'

// Utility function to round up to the nearest multiple
const roundUp = (num: number | string, multiple: number | string): number => {
  return Math.ceil(Number(num) / Number(multiple)) * Number(multiple)
}

// Function to calculate Cost to Us (CTU)
const calculateCTU = (
  cost: number | string,
  fuel: number | string,
  tax: number | string
): number => {
  return Number(cost) * (1 + Number(fuel) / 100) * (1 + Number(tax) / 100)
}

// Function to calculate Price to Customer (PTC) for Delivery - NON-ASAP
const calculateDeliveryNonASAP = (
  dCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(dCost, fuel, tax)
  const additionalCost = rca ? 20 : 25
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + additionalCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Delivery - ASAP
const calculateDeliveryASAP = (
  dCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(dCost, fuel, tax)
  const additionalCost = 75 + (rca ? 20 : 25)
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + additionalCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Haul Plus Rate
const calculateHaulPlus = (
  hCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean,
  expT: number | string,
  minT: number | string,
  tonnageCost: number | string
): { ptc: number; ctu: number } => {
  const difT = expT > minT ? Number(expT) - Number(minT) : 0
  const additionalCost = difT * Number(tonnageCost)
  const ctu = calculateCTU(Number(hCost) + additionalCost, fuel, tax)
  const baseCost = rca ? 85 : 125
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + baseCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Haul - Inclusion Rate
const calculateHaulInclusion = (
  hCost: number | string,
  fuel: number | string,
  tax: number | string,
  rca: boolean,
  expT: number | string,
  incT: number | string,
  tonnageCost: number | string
): { ptc: number; ctu: number } => {
  let ctu
  if (expT > incT) {
    const difT = Number(expT) - Number(incT)
    const additionalCost = difT * Number(tonnageCost)
    ctu = calculateCTU(Number(hCost) + Number(additionalCost), fuel, tax)
  } else {
    ctu = calculateCTU(hCost, fuel, tax)
  }
  const baseCost = rca ? 85 : 125
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + baseCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Rent
const calculateRent = (
  rCost: number | string,
  tax: number | string,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = Number(rCost) * (1 + Number(tax) / 100)
  const multiplier = rca ? 1.03 : 1.04
  const ptc = ctu * multiplier
  return { ptc: roundUp(ptc, 1), ctu }
}

interface CalculatorProps {
  type: DumpsterType
}

const DumpsterCalculator: React.FC<CalculatorProps> = ({ type }) => {
  const [dCost, setDCost] = useState<number|string>('')
  const [hCost, setHCost] = useState<number|string>('')
  const [rCost, setRCost] = useState<number|string>('')
  const [fuel, setFuel] = useState<number|string>('')
  const [tax, setTax] = useState<number|string>('')
  const [rca, setRca] = useState<boolean>(false)
  const [isASAP, setIsASAP] = useState<boolean>(false)
  const [expT, setExpT] = useState<number|string>('')
  const [minT, setMinT] = useState<number|string>('')
  const [incT, setIncT] = useState<number|string>('')
  const [tonnageCost, setTonnageCost] = useState<number|string>('')

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<number | string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(parseFloat(e.target.value))
    }

  const handleCheckboxChange =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.checked)
    }

  const delivery = isASAP
    ? calculateDeliveryASAP(dCost, fuel, tax, rca)
    : calculateDeliveryNonASAP(dCost, fuel, tax, rca)

  let haul
  if (type === DumpsterType.HAUL_PLUS) {
    haul = calculateHaulPlus(hCost, fuel, tax, rca, expT, minT, tonnageCost)
  } else if (type === DumpsterType.INCLUSION) {
    haul = calculateHaulInclusion(
      hCost,
      fuel,
      tax,
      rca,
      expT,
      incT,
      tonnageCost
    )
  } else {
    haul = { ptc: 0, ctu: 0 }
  }

  const rent = calculateRent(rCost, tax, rca)

  const PTC = delivery.ptc + haul.ptc + rent.ptc
  const CTU = delivery.ctu + haul.ctu + rent.ctu

  return (
    <div className="max-w-full sm:max-w-lg mx-auto mt-3 p-4 bg-white rounded-lg shadow-md">
      <Fieldset className="space-y-4">
        <Field className="flex flex-col">
          <Label className="text-sm font-semibold text-gray-700">
            Delivery Cost
          </Label>
          <Input
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            value={dCost}
            onChange={handleInputChange(setDCost)}
          />
        </Field>
        <Field className="flex flex-col">
          <Label className="text-sm font-semibold text-gray-700">
            Haul Cost
          </Label>
          <Input
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            value={hCost}
            onChange={handleInputChange(setHCost)}
          />
        </Field>
        <Field className="flex flex-col">
          <Label className="text-sm font-semibold text-gray-700">
            Rent Cost
          </Label>
          <Input
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            value={rCost}
            onChange={handleInputChange(setRCost)}
          />
        </Field>
        <Field className="flex flex-col">
          <Label className="text-sm font-semibold text-gray-700">
            Fuel (%)
          </Label>
          <Input
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            value={fuel}
            onChange={handleInputChange(setFuel)}
          />
        </Field>
        <Field className="flex flex-col">
          <Label className="text-sm font-semibold text-gray-700">Tax (%)</Label>
          <Input
            className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            type="number"
            value={tax}
            onChange={handleInputChange(setTax)}
          />
        </Field>
        {type !== DumpsterType.FLAT_RATE && (
          <>
            <Field className="flex flex-col">
              <Label className="text-sm font-semibold text-gray-700">
                Expected Tonnage
              </Label>
              <Input
                className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                type="number"
                value={expT}
                onChange={handleInputChange(setExpT)}
              />
            </Field>
            {type === DumpsterType.INCLUSION && (
              <Field className="flex flex-col">
                <Label className="text-sm font-semibold text-gray-700">
                  Included Tonnage
                </Label>
                <Input
                  className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  type="number"
                  value={incT}
                  onChange={handleInputChange(setIncT)}
                />
              </Field>
            )}
            <Field className="flex flex-col">
              <Label className="text-sm font-semibold text-gray-700">
                Minimum Tonnage
              </Label>
              <Input
                className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                type="number"
                value={minT}
                onChange={handleInputChange(setMinT)}
              />
            </Field>
            <Field className="flex flex-col">
              <Label className="text-sm font-semibold text-gray-700">
                Tonnage Cost
              </Label>
              <Input
                className="mt-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                type="number"
                value={tonnageCost}
                onChange={handleInputChange(setTonnageCost)}
              />
            </Field>
          </>
        )}
        <Field className="flex items-center">
          <Label className="text-sm font-semibold text-gray-700">RCA</Label>
          <Input
            className="ml-3"
            type="checkbox"
            checked={rca}
            onChange={handleCheckboxChange(setRca)}
          />
        </Field>
        <Field className="flex items-center">
          <Label className="text-sm font-semibold text-gray-700">ASAP</Label>
          <Input
            className="ml-3"
            type="checkbox"
            checked={isASAP}
            onChange={handleCheckboxChange(setIsASAP)}
          />
        </Field>
      </Fieldset>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                🚛
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Our Cost
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Delivery
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${delivery.ctu.toFixed(0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                ${delivery.ptc.toFixed(0)}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Haul
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${haul.ctu.toFixed(0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                ${haul.ptc.toFixed(0)}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Rent
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${rent.ctu.toFixed(0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                ${rent.ptc.toFixed(0)}
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                Total
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                ${CTU.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                ${PTC.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DumpsterCalculator
