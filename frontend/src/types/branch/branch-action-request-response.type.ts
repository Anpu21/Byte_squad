export type BranchActionType = 'create' | 'update' | 'delete'

export interface IBranchActionRequestResponse {
  actionId: string
  expiresAt: string
  action: BranchActionType
}

export interface IBranchActionConfirmResponse {
  action: BranchActionType
  branch: import('./branch.type').IBranch | null
}
