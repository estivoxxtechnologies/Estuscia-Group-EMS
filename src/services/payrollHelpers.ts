import {
  PayrollAdjustment,
  PayrollRecord,
} from '../types/payrollCycle';

const formatCurrency = (
  value?: number | null
) =>
  `₹${Number(
    value ??
      0
  ).toLocaleString()}`;

const getAdjustmentEmployeeName = (
  adjustment: PayrollAdjustment,
  records: PayrollRecord[]
) =>
  records.find(
    record =>
      record.userId ===
      adjustment.userId
  )?.employeeName ??
  'Employee';

export { formatCurrency, getAdjustmentEmployeeName };
