export declare const UserRole: {
    readonly DONOR: "DONOR";
    readonly PATIENT: "PATIENT";
    readonly ADMIN: "ADMIN";
};
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export declare const UserStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly DISABLED: "DISABLED";
};
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export declare const BloodType: {
    readonly O: "O";
    readonly A: "A";
    readonly B: "B";
    readonly AB: "AB";
};
export type BloodType = (typeof BloodType)[keyof typeof BloodType];
export declare const RhFactor: {
    readonly POSITIVE: "POSITIVE";
    readonly NEGATIVE: "NEGATIVE";
};
export type RhFactor = (typeof RhFactor)[keyof typeof RhFactor];
export declare const RequestPriority: {
    readonly HIGH: "HIGH";
    readonly MEDIUM: "MEDIUM";
    readonly LOW: "LOW";
};
export type RequestPriority = (typeof RequestPriority)[keyof typeof RequestPriority];
export declare const BloodRequestStatus: {
    readonly ACTIVE: "ACTIVE";
    readonly RESOLVED: "RESOLVED";
};
export type BloodRequestStatus = (typeof BloodRequestStatus)[keyof typeof BloodRequestStatus];
