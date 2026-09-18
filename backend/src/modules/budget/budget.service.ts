/// Default per-guest and fixed cost rates used by the Budget & Cost Calculator.
/// These can be overridden per-request (e.g. different transportation cost for far venues).
export const DEFAULT_RATES = {
  staffCostPerGuest: 100,
  equipmentCostPerGuest: 50,
  decorationCostPerGuest: 0,
  otherServicesCostPerGuest: 0,
  transportationFlatCost: 10000,
};

export interface BudgetInput {
  guestCount: number;
  pricePerPlate: number; // food cost per person, comes from the selected menu package
  staffCostPerGuest?: number;
  equipmentCostPerGuest?: number;
  decorationCostPerGuest?: number;
  otherServicesCostPerGuest?: number;
  transportationFlatCost?: number;
  taxPercent?: number;
  advancePercent?: number; // default 25%
}

export interface BudgetBreakdown {
  guestCount: number;
  foodCost: number;
  staffCost: number;
  equipmentCost: number;
  decorationCost: number;
  otherServicesCost: number;
  transportationCost: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  advancePercent: number;
  advanceAmount: number;
  balanceDue: number;
}

export function calculateBudget(input: BudgetInput): BudgetBreakdown {
  const {
    guestCount,
    pricePerPlate,
    staffCostPerGuest = DEFAULT_RATES.staffCostPerGuest,
    equipmentCostPerGuest = DEFAULT_RATES.equipmentCostPerGuest,
    decorationCostPerGuest = DEFAULT_RATES.decorationCostPerGuest,
    otherServicesCostPerGuest = DEFAULT_RATES.otherServicesCostPerGuest,
    transportationFlatCost = DEFAULT_RATES.transportationFlatCost,
    taxPercent = 5,
    advancePercent = 25,
  } = input;

  const foodCost = round2(guestCount * pricePerPlate);
  const staffCost = round2(guestCount * staffCostPerGuest);
  const equipmentCost = round2(guestCount * equipmentCostPerGuest);
  const decorationCost = round2(guestCount * decorationCostPerGuest);
  const otherServicesCost = round2(guestCount * otherServicesCostPerGuest);
  const transportationCost = round2(transportationFlatCost);

  const subtotal = round2(
    foodCost + staffCost + equipmentCost + decorationCost + otherServicesCost + transportationCost,
  );
  const taxAmount = round2((subtotal * taxPercent) / 100);
  const totalAmount = round2(subtotal + taxAmount);
  const advanceAmount = round2((totalAmount * advancePercent) / 100);
  const balanceDue = round2(totalAmount - advanceAmount);

  return {
    guestCount,
    foodCost,
    staffCost,
    equipmentCost,
    decorationCost,
    otherServicesCost,
    transportationCost,
    subtotal,
    taxPercent,
    taxAmount,
    totalAmount,
    advancePercent,
    advanceAmount,
    balanceDue,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
