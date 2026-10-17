export interface Restaurant {
  id: string;
  tradeName?: string;
  name: string;
  address: string;
  capacity: number;
  percentageAttendance: number;
  simulationEndDate: string;
  lastSimulationUpdate: Date;
  lastPredictionUpdate: Date;
}
