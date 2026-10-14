export interface Restaurant {
  version: number;
  timeZone: string;
  currency: string;
  yapeQr: string;
  id: string;
  name: string;
  logo: string;
  address: string;
  capacity: number;
  identification: string;
  phone: string;
  email: string;
  percentageAttendance: number;
  simulationEndDate: string;
  simulationStartDate: string;
  lastSimulationUpdate: string;
  lastPredictionUpdate: number;
}
