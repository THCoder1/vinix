import { UserRole } from "@prisma/client";

export const permissions = {
  VIEW_STOCK: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.VIEWER,
  ],

  CREATE_VEHICLE: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
  ],

  UPDATE_VEHICLE: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
  ],

  DELETE_VEHICLE: [
  UserRole.ADMIN,
  ],

  UPLOAD_PHOTO: [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SALES,
  ],

  DELETE_STOCK_PHOTO: [
  UserRole.ADMIN,
  ],

  UPLOAD_DOCUMENT: [
  UserRole.ADMIN,
  UserRole.MANAGER,
  ],

  CREATE_ACQUISITION: [
    UserRole.ADMIN,
    UserRole.MANAGER,
  ],

  APPROVE_ACQUISITION: [
    UserRole.ADMIN,
    UserRole.MANAGER,
  ],

  CREATE_EXPENSE: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
  ],

  CREATE_SALE: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
  ],

  VIEW_DOCUMENTS: [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.SALES,
    UserRole.VIEWER,
  ],

  MANAGE_USERS: [
    UserRole.ADMIN,
  ],
} satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof permissions;

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return permissions[permission].some(
    (allowedRole) => allowedRole === role
  );
}