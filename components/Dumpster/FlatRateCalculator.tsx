import { useState } from 'react'
import { Input } from '@headlessui/react'

// Utility function to round up to the nearest multiple
const roundUp = (num: number, multiple: number): number => {
  return Math.ceil(num / multiple) * multiple
}

// Function to calculate Cost to Us (CTU)
const calculateCTU = (cost: number, fuel: number, tax: number): number => {
  return cost * (1 + fuel / 100) * (1 + tax / 100)
}

// Function to calculate Price to Customer (PTC) for Delivery - NON-ASAP
const calculateDeliveryNonASAP = (
  dCost: number,
  fuel: number,
  tax: number,
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
  dCost: number,
  fuel: number,
  tax: number,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(dCost, fuel, tax)
  const additionalCost = 75 + (rca ? 20 : 25)
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + additionalCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Haul
const calculateHaul = (
  hCost: number,
  fuel: number,
  tax: number,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = calculateCTU(hCost, fuel, tax)
  const additionalCost = rca ? 85 : 125
  const multiplier = rca ? 1.03 : 1.04
  const ptc = (ctu + additionalCost) * multiplier
  return { ptc: roundUp(ptc, 5), ctu }
}

// Function to calculate Price to Customer (PTC) for Rent
const calculateRent = (
  rCost: number,
  tax: number,
  rca: boolean
): { ptc: number; ctu: number } => {
  const ctu = rCost * (1 + tax / 100)
  const multiplier = rca ? 1.03 : 1.04
  const ptc = ctu * multiplier
  return { ptc: roundUp(ptc, 1), ctu }
}

const FlatRateCalculator: React.FC = () => {
  const [dCost, setDCost] = useState<number>(0)
  const [hCost, setHCost] = useState<number>(0)
  const [rCost, setRCost] = useState<number>(0)
  const [fuel, setFuel] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [rca, setRca] = useState<boolean>(false)
  const [isASAP, setIsASAP] = useState<boolean>(false)

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<number>>) =>
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

  const haul = calculateHaul(hCost, fuel, tax, rca)
  const rent = calculateRent(rCost, tax, rca)

  const PTC = delivery.ptc + haul.ptc + rent.ptc
  const CTU = delivery.ctu + haul.ctu + rent.ctu

  return (
    <div>
      <div className="flex flex-col gap-2">
        <label>
          Delivery Cost:
          <Input
            className="ml-3 border-2 b-indigo-800"
            type="number"
            value={dCost}
            onChange={handleInputChange(setDCost)}
          />
        </label>
        <label>
          Haul Cost:
          <Input
            className="ml-3 border-2 b-indigo-800"
            type="number"
            value={hCost}
            onChange={handleInputChange(setHCost)}
          />
        </label>
        <label>
          Rent Cost:
          <Input
            className="ml-3 border-2 b-indigo-800"
            type="number"
            value={rCost}
            onChange={handleInputChange(setRCost)}
          />
        </label>
        <label>
          Fuel (%):
          <Input
            className="ml-3 border-2 b-indigo-800"
            type="number"
            value={fuel}
            onChange={handleInputChange(setFuel)}
          />
        </label>
        <label>
          Tax (%):
          <Input
            className="ml-3 border-2 b-indigo-800"
            type="number"
            value={tax}
            onChange={handleInputChange(setTax)}
          />
        </label>
        <label>
          RCA:
          <Input
            className="ml-3"
            type="checkbox"
            checked={rca}
            onChange={handleCheckboxChange(setRca)}
          />
        </label>
        <label>
          ASAP:
          <Input
            className="ml-3"
            type="checkbox"
            checked={isASAP}
            onChange={handleCheckboxChange(setIsASAP)}
          />
        </label>
      </div>
      <div className="flex flex-row gap-8 border-t-2">
        <div>
          <h3>Cost to us</h3>
          <p>Delivery: ${delivery.ctu.toFixed(2)}</p>
          <p>Haul: ${haul.ctu.toFixed(2)}</p>
          <p>Rent: ${rent.ctu.toFixed(2)}</p>
          <b>Total Price: ${CTU.toFixed(2)}</b>
        </div>
        <div>
          <h3>Price to customer</h3>
          <p>Delivery: ${delivery.ptc.toFixed(2)}</p>
          <p>Haul: ${haul.ptc.toFixed(2)}</p>
          <p>Rent: ${rent.ptc.toFixed(2)}</p>
          <b>Total Price: ${PTC.toFixed(2)}</b>
        </div>
      </div>
    </div>
  )
}

export default FlatRateCalculator
