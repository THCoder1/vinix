import { VehicleStatus } from "@prisma/client";

const vehicleStatusTransitions: Record<
  VehicleStatus,
  readonly VehicleStatus[]
> = {
  [VehicleStatus.PURCHASED]: [
    VehicleStatus.IN_PREPARATION,
    VehicleStatus.HOLD,
    VehicleStatus.CANCELLED,
  ],
  [VehicleStatus.IN_PREPARATION]: [
    VehicleStatus.READY_FOR_SALE,
    VehicleStatus.HOLD,
    VehicleStatus.CANCELLED,
  ],
  [VehicleStatus.READY_FOR_SALE]: [
    VehicleStatus.RESERVED,
    VehicleStatus.SOLD,
    VehicleStatus.IN_PREPARATION,
    VehicleStatus.HOLD,
    VehicleStatus.CANCELLED,
  ],
  [VehicleStatus.RESERVED]: [
    VehicleStatus.SOLD,
    VehicleStatus.READY_FOR_SALE,
    VehicleStatus.HOLD,
    VehicleStatus.CANCELLED,
  ],
  [VehicleStatus.HOLD]: [
    VehicleStatus.IN_PREPARATION,
    VehicleStatus.READY_FOR_SALE,
    VehicleStatus.CANCELLED,
  ],
  [VehicleStatus.CANCELLED]: [],
  [VehicleStatus.SOLD]: [],
};

export function isValidVehicleStatusTransition(
  currentStatus: VehicleStatus,
  newStatus: VehicleStatus
) {
  return vehicleStatusTransitions[currentStatus].includes(newStatus);
}

export function getSelectableVehicleStatusTransitions(
  currentStatus: VehicleStatus
) {
  return vehicleStatusTransitions[currentStatus].filter(
    (status) => status !== VehicleStatus.SOLD
  );
}

export function isSaleEligibleVehicleStatus(
  status: VehicleStatus
) {
  return isValidVehicleStatusTransition(
    status,
    VehicleStatus.SOLD
  );
}
